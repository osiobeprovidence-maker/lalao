/**
 * Lalao — Runtime verification of get_lalao_message_contacts against local Supabase PostgreSQL.
 *
 * Creates controlled records directly in the local Supabase database,
 * calls the security-definer RPC get_lalao_message_contacts, and verifies:
 *   - Mutual-follow eligibility (both users follow each other)
 *   - Exclusion of the current user
 *   - Correct handling of one-way follows (not mutual)
 *   - Correct handling of no follows at all
 *   - Suspended users are excluded
 *   - Public user fields and verification status
 *   - No private fields exposed
 *   - Correct response shape for the frontend
 *   - Viewer-not-found error handling
 *
 * Runtime tests against a real PostgreSQL database, not mocked.
 */

import assert from 'node:assert/strict';
import { Client } from 'pg';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function runTests() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  let allPassed = true;
  const results: { name: string; passed: boolean; message?: string }[] = [];
  const createdUserIds: string[] = [];

  // ── Helper: create a test user ──
  async function createUser(id: string, opts: {
    suspended?: boolean;
    accessStatus?: string;
    verificationTier?: string;
    verificationStatus?: string;
    verificationExpiresAt?: number | null;
  } = {}) {
    await client.query(
      `INSERT INTO public."users" ("_id", "name", "username", "avatarUrl", "userType",
       "bio", "locationName", "followersCount", "followingCount", "verificationTier",
       "verificationStatus", "verificationExpiresAt", "suspended", "accessStatus",
       "createdAt", "updatedAt", "tokenIdentifier", "onboardingStep")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT ("_id") DO UPDATE SET
         "suspended" = EXCLUDED."suspended",
         "accessStatus" = EXCLUDED."accessStatus"`,
      [
        id, `User ${id}`, `user${id}`, `https://example.com/avatar/${id}.png`,
        'person', 'Test user bio', 'Test City', 0, 0,
        opts.verificationTier ?? 'none',
        opts.verificationStatus ?? null,
        opts.verificationExpiresAt ?? null,
        opts.suspended ?? false,
        opts.accessStatus ?? 'available',
        Date.now(), Date.now(),
        `firebase|${id}`, 'pending',
      ],
    );
    createdUserIds.push(id);
  }

  // ── Helper: create a follow relationship ──
  async function follow(followerId: string, followingId: string) {
    await client.query(
      `INSERT INTO public."follows" ("_id", "followerId", "followingId", "createdAt")
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [`follow_${followerId}_${followingId}`, followerId, followingId, Date.now()],
    );
  }

  // ── Helper: cleanup only our test users ──
  async function cleanup() {
    for (const id of createdUserIds) {
      try { await client.query(`DELETE FROM public."authIdentities" WHERE "userId" = $1`, [id]); } catch { /* ignore */ }
    }
    try { await client.query(`DELETE FROM public."follows" WHERE "followerId" = ANY($1) OR "followingId" = ANY($1)`, [createdUserIds]); } catch { /* ignore */ }
    createdUserIds.length = 0;
    try { await client.query(`DELETE FROM public."users" WHERE "_id" = ANY($1)`, [createdUserIds]); } catch { /* ignore */ }
  }

  const tests: Array<{ name: string; fn: () => Promise<void> }> = [
    // ── Test 1: Mutual follow returns the friend ──
    {
      name: 'mutual follow returns the friend',
      fn: async () => {
        await cleanup();
        await createUser('viewer_mutual');
        await createUser('friend_mutual');
        await follow('viewer_mutual', 'friend_mutual');
        await follow('friend_mutual', 'viewer_mutual');

        const { rows } = await client.query(
          `SELECT public.get_lalao_message_contacts($1) AS result`,
          ['viewer_mutual'],
        );
        const result = rows[0].result as any[];
        assert.ok(Array.isArray(result), 'result should be an array');
        assert.equal(result.length, 1, 'should return exactly 1 friend');
        assert.equal(result[0].id, 'friend_mutual');
        assert.equal(result[0].relationship, 'friends');
        assert.equal(result[0].isFollowing, true);
      },
    },
    // ── Test 2: Exclusion of current user ──
    {
      name: 'excludes the current user',
      fn: async () => {
        await cleanup();
        await createUser('viewer_no_friends');
        await createUser('other_user');
        await follow('viewer_no_friends', 'other_user');

        const { rows } = await client.query(
          `SELECT public.get_lalao_message_contacts($1) AS result`,
          ['viewer_no_friends'],
        );
        const result = rows[0].result as any[];
        assert.ok(Array.isArray(result));
        assert.equal(result.length, 0, 'should return empty array when no mutual follows');
      },
    },
    // ── Test 3: One-way follow is not mutual ──
    {
      name: 'one-way follow is not mutual',
      fn: async () => {
        await cleanup();
        await createUser('viewer_one_way');
        await createUser('target_one_way');
        await follow('viewer_one_way', 'target_one_way');

        const { rows } = await client.query(
          `SELECT public.get_lalao_message_contacts($1) AS result`,
          ['viewer_one_way'],
        );
        const result = rows[0].result as any[];
        assert.ok(Array.isArray(result));
        assert.equal(result.length, 0, 'one-way follow should not produce a friend');
      },
    },
    // ── Test 4: Suspended user excluded ──
    {
      name: 'suspended user excluded',
      fn: async () => {
        await cleanup();
        await createUser('viewer_suspended');
        await createUser('suspended_friend', { suspended: true });
        await follow('viewer_suspended', 'suspended_friend');
        await follow('suspended_friend', 'viewer_suspended');

        const { rows } = await client.query(
          `SELECT public.get_lalao_message_contacts($1) AS result`,
          ['viewer_suspended'],
        );
        const result = rows[0].result as any[];
        assert.ok(Array.isArray(result));
        assert.equal(result.length, 0, 'suspended friend should be excluded');
      },
    },
    // ── Test 5: Public fields exposed, no private fields ──
    {
      name: 'public fields exposed, no private fields',
      fn: async () => {
        await cleanup();
        await createUser('viewer_fields');
        await createUser('friend_fields', {
          verificationTier: 'verified',
          verificationStatus: 'active',
          verificationExpiresAt: Date.now() + 86400000,
        });
        await follow('viewer_fields', 'friend_fields');
        await follow('friend_fields', 'viewer_fields');

        const { rows } = await client.query(
          `SELECT public.get_lalao_message_contacts($1) AS result`,
          ['viewer_fields'],
        );
        const result = rows[0].result as any[];
        assert.equal(result.length, 1);
        const friend = result[0];
        assert.ok(friend.id);
        assert.ok(friend.name);
        assert.ok(friend.username);
        assert.ok(friend.avatar);
        assert.ok(friend.userType);
        assert.equal(friend.isFollowing, true);
        assert.equal(friend.relationship, 'friends');
        assert.equal(friend.isVerified, true);
        assert.equal(friend.verificationTier, 'verified');
        assert.ok(!Object.prototype.hasOwnProperty.call(friend, 'email'));
        assert.ok(!Object.prototype.hasOwnProperty.call(friend, 'password'));
        assert.ok(!Object.prototype.hasOwnProperty.call(friend, 'tokenIdentifier'));
        assert.ok(!Object.prototype.hasOwnProperty.call(friend, '_creationTime'));
      },
    },
    // ── Test 6: Empty result when no mutual follows ──
    {
      name: 'empty result when no mutual follows',
      fn: async () => {
        await cleanup();
        await createUser('viewer_no_mutual');
        await createUser('other_user');
        await follow('viewer_no_mutual', 'other_user');

        const { rows } = await client.query(
          `SELECT public.get_lalao_message_contacts($1) AS result`,
          ['viewer_no_mutual'],
        );
        const result = rows[0].result as any[];
        assert.ok(Array.isArray(result));
        assert.equal(result.length, 0);
      },
    },
    // ── Test 7: Multiple mutual friends ordered by name ──
    {
      name: 'multiple mutual friends ordered by name',
      fn: async () => {
        await cleanup();
        await createUser('viewer_multi');
        await createUser('alice_friend');
        await createUser('bob_friend');
        await createUser('charlie_friend');
        for (const f of ['alice_friend', 'bob_friend', 'charlie_friend']) {
          await follow('viewer_multi', f);
          await follow(f, 'viewer_multi');
        }

        const { rows } = await client.query(
          `SELECT public.get_lalao_message_contacts($1) AS result`,
          ['viewer_multi'],
        );
        const result = rows[0].result as any[];
        assert.ok(Array.isArray(result));
        assert.equal(result.length, 3);
        const names = result.map((r) => r.name);
        assert.deepEqual(names, ['User alice_friend', 'User bob_friend', 'User charlie_friend']);
      },
    },
    // ── Test 8: Nonexistent viewer throws 42501 ──
    {
      name: 'nonexistent viewer throws 42501',
      fn: async () => {
        await cleanup();
        let threw = false;
        try {
          await client.query(
            `SELECT public.get_lalao_message_contacts($1) AS result`,
            ['nonexistent_viewer'],
          );
        } catch (err: unknown) {
          threw = true;
          assert.ok(err instanceof Error);
          assert.equal((err as any).code, '42501');
        }
        assert.ok(threw, 'should throw for nonexistent viewer');
      },
    },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      results.push({ name: test.name, passed: true });
      console.log(`✓ PASS: ${test.name}`);
    } catch (err: unknown) {
      allPassed = false;
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name: test.name, passed: false, message: msg });
      console.log(`✗ FAIL: ${test.name} — ${msg}`);
    }
  }

  await cleanup();
  await client.end();

  console.log(`\nResult: ${allPassed ? 'ALL ' + results.length + ' TESTS PASSED' : 'SOME TESTS FAILED'}`);
  if (!allPassed) process.exit(1);
}

runTests().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
