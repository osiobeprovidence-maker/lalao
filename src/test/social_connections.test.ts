import { test } from 'node:test';
import assert from 'node:assert';

// Relationship and recommendation rules test suite

interface MockUser {
  id: string;
  name: string;
  username: string;
  suspended?: boolean;
  communityName?: string;
}

interface MockFollow {
  followerId: string;
  followingId: string;
  createdAt: number;
}

function computeFollowerCounts(
  userId: string,
  follows: MockFollow[],
  users: MockUser[]
) {
  const activeUserIds = new Set(users.filter(u => !u.suspended).map(u => u.id));
  const followers = follows.filter(
    f => f.followingId === userId && activeUserIds.has(f.followerId)
  );
  const following = follows.filter(
    f => f.followerId === userId && activeUserIds.has(f.followingId)
  );
  return {
    followersCount: followers.length,
    followingCount: following.length,
    followerIds: followers.map(f => f.followerId),
    followingIds: following.map(f => f.followingId),
  };
}

function computeRecommendations(
  currentUserId: string,
  users: MockUser[],
  follows: MockFollow[],
  dismissedIds: Set<string>
) {
  const followedIds = new Set(
    follows.filter(f => f.followerId === currentUserId).map(f => f.followingId)
  );
  followedIds.add(currentUserId);

  // 1. Calculate mutual connections: who do the accounts I follow, follow?
  const myFollowing = follows.filter(f => f.followerId === currentUserId);
  const candidateScores = new Map<string, { mutualCount: number; mutualUsers: string[] }>();

  for (const followRecord of myFollowing) {
    const friendFollowing = follows.filter(f => f.followerId === followRecord.followingId);
    const friendUser = users.find(u => u.id === followRecord.followingId);
    const friendName = friendUser?.name || `@${friendUser?.username || 'friend'}`;

    for (const ff of friendFollowing) {
      const candidateId = ff.followingId;
      if (followedIds.has(candidateId) || dismissedIds.has(candidateId)) continue;

      const currentScore = candidateScores.get(candidateId) || { mutualCount: 0, mutualUsers: [] };
      currentScore.mutualCount += 1;
      if (currentScore.mutualUsers.length < 2) {
        currentScore.mutualUsers.push(friendName);
      }
      candidateScores.set(candidateId, currentScore);
    }
  }

  // 2. Map eligible candidates
  const results: Array<{ id: string; name: string; reason: string; mutualCount: number }> = [];
  const addedIds = new Set<string>();

  // Add mutual candidates first
  const sortedMutualCandidates = Array.from(candidateScores.entries())
    .sort((a, b) => b[1].mutualCount - a[1].mutualCount);

  for (const [candidateId, info] of sortedMutualCandidates) {
    const user = users.find(u => u.id === candidateId);
    if (!user || user.suspended) continue;

    let reason = '';
    if (info.mutualCount === 1) {
      reason = `Followed by ${info.mutualUsers[0]}`;
    } else if (info.mutualCount > 1) {
      reason = `${info.mutualCount} mutual connections`;
    }

    results.push({
      id: user.id,
      name: user.name,
      reason,
      mutualCount: info.mutualCount,
    });
    addedIds.add(user.id);
  }

  // Fallback candidates
  const currentUser = users.find(u => u.id === currentUserId);
  for (const u of users) {
    if (addedIds.has(u.id) || followedIds.has(u.id) || dismissedIds.has(u.id) || u.suspended) continue;
    let reason = 'Suggested for you';
    if (currentUser?.communityName && u.communityName && currentUser.communityName === u.communityName) {
      reason = `Same community · ${u.communityName}`;
    }
    results.push({
      id: u.id,
      name: u.name,
      reason,
      mutualCount: 0,
    });
    addedIds.add(u.id);
  }

  return results;
}

test('Follower and following counts accurately match relationship records', () => {
  const users: MockUser[] = [
    { id: 'user_me', name: 'Me', username: 'me' },
    { id: 'user_alice', name: 'Alice', username: 'alice' },
    { id: 'user_bob', name: 'Bob', username: 'bob' },
    { id: 'user_charlie', name: 'Charlie', username: 'charlie' },
  ];

  const follows: MockFollow[] = [
    { followerId: 'user_alice', followingId: 'user_me', createdAt: 100 },
    { followerId: 'user_bob', followingId: 'user_me', createdAt: 110 },
    { followerId: 'user_me', followingId: 'user_charlie', createdAt: 120 },
  ];

  const counts = computeFollowerCounts('user_me', follows, users);
  assert.strictEqual(counts.followersCount, 2, 'Follower count must match followers array length');
  assert.strictEqual(counts.followingCount, 1, 'Following count must match following array length');
  assert.deepStrictEqual(counts.followerIds, ['user_alice', 'user_bob']);
  assert.deepStrictEqual(counts.followingIds, ['user_charlie']);
});

test('Recommendations strictly exclude self and accounts already followed', () => {
  const users: MockUser[] = [
    { id: 'user_me', name: 'Me', username: 'me' },
    { id: 'user_alice', name: 'Alice', username: 'alice' },
    { id: 'user_bob', name: 'Bob', username: 'bob' },
    { id: 'user_charlie', name: 'Charlie', username: 'charlie' },
  ];

  const follows: MockFollow[] = [
    { followerId: 'user_me', followingId: 'user_alice', createdAt: 100 },
  ];

  const recs = computeRecommendations('user_me', users, follows, new Set());
  const recIds = recs.map(r => r.id);

  assert.ok(!recIds.includes('user_me'), 'Self must never be recommended');
  assert.ok(!recIds.includes('user_alice'), 'Already followed user must never be recommended');
  assert.ok(recIds.includes('user_bob'), 'Bob should be recommended');
  assert.ok(recIds.includes('user_charlie'), 'Charlie should be recommended');
});

test('Mutual connections are prioritized and correctly labeled with friend names', () => {
  const users: MockUser[] = [
    { id: 'user_me', name: 'Me', username: 'me' },
    { id: 'user_alice', name: 'Alice', username: 'alice' },
    { id: 'user_david', name: 'David', username: 'david' },
    { id: 'user_stranger', name: 'Stranger', username: 'stranger' },
  ];

  // Me follows Alice. Alice follows David.
  const follows: MockFollow[] = [
    { followerId: 'user_me', followingId: 'user_alice', createdAt: 100 },
    { followerId: 'user_alice', followingId: 'user_david', createdAt: 110 },
  ];

  const recs = computeRecommendations('user_me', users, follows, new Set());
  assert.strictEqual(recs[0].id, 'user_david', 'Mutual connection David must be ranked first');
  assert.strictEqual(recs[0].reason, 'Followed by Alice', 'Reason must accurately attribute Alice');
  assert.strictEqual(recs[0].mutualCount, 1);
});

test('Dismissed and suspended users are never returned in recommendations', () => {
  const users: MockUser[] = [
    { id: 'user_me', name: 'Me', username: 'me' },
    { id: 'user_banned', name: 'Banned', username: 'banned', suspended: true },
    { id: 'user_dismissed', name: 'Dismissed', username: 'dismissed' },
    { id: 'user_active', name: 'Active', username: 'active' },
  ];

  const follows: MockFollow[] = [];
  const dismissed = new Set(['user_dismissed']);

  const recs = computeRecommendations('user_me', users, follows, dismissed);
  const recIds = recs.map(r => r.id);

  assert.ok(!recIds.includes('user_banned'), 'Suspended user must not be recommended');
  assert.ok(!recIds.includes('user_dismissed'), 'Dismissed user must not be recommended');
  assert.ok(recIds.includes('user_active'), 'Active eligible user must be recommended');
});
