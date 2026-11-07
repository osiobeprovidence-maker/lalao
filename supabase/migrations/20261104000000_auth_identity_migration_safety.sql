BEGIN;

-- Provider email claims are profile data, never administrator authorization.
CREATE OR REPLACE FUNCTION public.ensure_lalao_user_for_identity(
  p_issuer text,
  p_subject text,
  p_email text,
  p_email_verified boolean,
  p_name text,
  p_avatar_url text,
  p_method text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_provider text;
  v_token_identifier text;
  v_normalized_email text;
  v_user_id text;
  v_username_base text;
  v_username text;
  v_suffix text;
  v_now double precision;
  v_attempt integer := 0;
  v_existing_user_id text;
  v_matching_user_count integer;
BEGIN
  IF p_issuer = 'https://securetoken.google.com/uselalaoapp' THEN
    v_provider := 'firebase';
  ELSIF p_issuer = 'https://one.playsole.xyz' THEN
    v_provider := 'playsole';
  ELSE
    RAISE EXCEPTION 'Unsupported Lalao identity provider' USING ERRCODE = '22023';
  END IF;
  IF p_subject IS NULL OR btrim(p_subject) = '' OR p_email_verified IS NULL THEN
    RAISE EXCEPTION 'Invalid Lalao identity claims' USING ERRCODE = '22023';
  END IF;

  v_token_identifier := p_issuer || '|' || p_subject;
  v_normalized_email := CASE WHEN p_email_verified AND p_email IS NOT NULL AND btrim(p_email) <> ''
    THEN lower(btrim(p_email)) ELSE NULL END;

  -- Serialize provisioning and email ownership checks for this identity.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity:' || p_issuer || ':' || p_subject, 0));
  IF v_normalized_email IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('email:' || v_normalized_email, 0));
  END IF;

  SELECT auth_identity."userId" INTO v_user_id
    FROM public."authIdentities" AS auth_identity
   WHERE auth_identity."issuer" = p_issuer AND auth_identity."subject" = p_subject;

  IF v_user_id IS NULL THEN
    SELECT count(*)::integer INTO v_matching_user_count
      FROM public."users" AS users
     WHERE users."tokenIdentifier" = v_token_identifier;
    IF v_matching_user_count > 1 THEN
      RAISE EXCEPTION 'Legacy authentication identity conflict. Contact support for account recovery.' USING ERRCODE = '23505';
    END IF;
    SELECT users."_id" INTO v_user_id
      FROM public."users" AS users
     WHERE users."tokenIdentifier" = v_token_identifier
     ORDER BY users."_creationTime"
     LIMIT 1;
  END IF;

  IF v_user_id IS NULL AND v_normalized_email IS NOT NULL THEN
    SELECT users."_id" INTO v_existing_user_id
      FROM public."users" AS users
     WHERE lower(COALESCE(users."emailNormalized", users."email", '')) = v_normalized_email
     ORDER BY users."_creationTime"
     LIMIT 1;
    IF v_existing_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'A Lalao account may already use this email. Sign in to that account first, then link this sign-in method from Security & Authentication.'
        USING ERRCODE = '23505';
    END IF;
  END IF;

  v_now := extract(epoch FROM clock_timestamp()) * 1000;
  IF v_user_id IS NULL THEN
    v_username_base := left(regexp_replace(lower(COALESCE(NULLIF(p_email, ''), p_subject)), '[^a-z0-9]+', '', 'g'), 20);
    IF v_username_base = '' THEN
      v_username_base := 'user' || left(md5(v_token_identifier), 12);
    END IF;
    v_suffix := left(md5(v_token_identifier), 6);
    v_username := v_username_base;
    LOOP
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('username:' || v_username, 0));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public."users" WHERE "username" = v_username);
      v_attempt := v_attempt + 1;
      v_username := left(v_username_base, greatest(1, 20 - length(v_suffix) - length(v_attempt::text))) || v_suffix || v_attempt::text;
    END LOOP;

    v_user_id := 'usr_' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO public."users" (
      "_id", "tokenIdentifier", "email", "emailNormalized", "name", "username", "avatarUrl",
      "onboardingStep", "followersCount", "followingCount", "role", "phoneSetupCompleted",
      "phoneVerified", "createdAt", "updatedAt", "lastSignInProvider", "lastSignInMethod"
    ) VALUES (
      v_user_id, v_token_identifier, NULLIF(p_email, ''), v_normalized_email,
      COALESCE(NULLIF(p_name, ''), CASE WHEN p_email IS NOT NULL THEN split_part(p_email, '@', 1) ELSE 'New user' END),
      v_username, NULLIF(p_avatar_url, ''), 'pending', 0, 0, 'user', false, false,
      v_now, v_now, v_provider, COALESCE(NULLIF(p_method, ''), v_provider)
    );
  ELSE
    -- Preserve the existing role exactly; authentication and email verification
    -- must never promote or demote an already provisioned account.
    UPDATE public."users"
       SET "lastSignInProvider" = v_provider,
           "lastSignInMethod" = COALESCE(NULLIF(p_method, ''), v_provider),
           "avatarUrl" = CASE WHEN COALESCE("avatarUrl", '') = '' AND NULLIF(p_avatar_url, '') IS NOT NULL THEN p_avatar_url ELSE "avatarUrl" END,
           "emailNormalized" = CASE WHEN "emailNormalized" IS NULL THEN v_normalized_email ELSE "emailNormalized" END,
           "name" = CASE WHEN "name" IS NULL OR "name" = 'New user' THEN COALESCE(NULLIF(p_name, ''), "name") ELSE "name" END,
           "updatedAt" = v_now
     WHERE "_id" = v_user_id;
  END IF;

  INSERT INTO public."authIdentities" (
    "_id", "userId", "provider", "issuer", "subject", "tokenIdentifier", "method",
    "emailNormalized", "emailVerified", "linkedAt"
  ) VALUES (
    'auth_' || replace(gen_random_uuid()::text, '-', ''), v_user_id, v_provider, p_issuer, p_subject,
    v_token_identifier, COALESCE(NULLIF(p_method, ''), v_provider), v_normalized_email, p_email_verified, v_now
  ) ON CONFLICT ("issuer", "subject") DO NOTHING;

  SELECT auth_identity."userId" INTO v_existing_user_id
    FROM public."authIdentities" AS auth_identity
   WHERE auth_identity."issuer" = p_issuer AND auth_identity."subject" = p_subject;
  IF v_existing_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'This sign-in method is already associated with another Lalao account.' USING ERRCODE = '23505';
  END IF;

  RETURN v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) TO service_role;
COMMENT ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) IS
  'Idempotently resolves or provisions one Lalao user for a cryptographically verified provider identity. Verified email is not administrator authorization. Service-role only.';

-- Explicit, resumable administrative backfill. It is never called during login.
CREATE OR REPLACE FUNCTION public.backfill_lalao_auth_identities(p_cursor jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_cursor_time double precision;
  v_cursor_id text;
  v_last_time double precision;
  v_last_id text;
  v_done boolean;
  v_processed_count integer := 0;
  v_inserted_count integer := 0;
  v_conflict_count integer := 0;
  v_skipped_count integer := 0;
  v_conflicts jsonb := '[]'::jsonb;
  v_user record;
  v_current_creation_time double precision;
  v_current_token_identifier text;
  v_current_created_at double precision;
  v_separator integer;
  v_issuer text;
  v_subject text;
  v_provider text;
  v_by_token_count integer;
  v_by_token_user text;
  v_by_token_issuer text;
  v_by_token_subject text;
  v_by_token_provider text;
  v_by_subject_count integer;
  v_by_subject_user text;
  v_by_subject_token text;
  v_by_subject_provider text;
  v_conflict_reason text;
  v_inserted_rows integer;
  v_state_count integer;
  v_noted_at double precision;
BEGIN
  IF p_cursor IS NOT NULL THEN
    IF jsonb_typeof(p_cursor) <> 'object'
      OR jsonb_typeof(p_cursor -> 'creationTime') <> 'number'
      OR jsonb_typeof(p_cursor -> 'id') <> 'string'
      OR btrim(p_cursor ->> 'id') = '' THEN
      RAISE EXCEPTION 'Invalid auth identity backfill cursor' USING ERRCODE = '22023';
    END IF;
    v_cursor_time := (p_cursor ->> 'creationTime')::double precision;
    v_cursor_id := p_cursor ->> 'id';
  END IF;

  -- Serialize pages so finalization cannot race another backfill invocation.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('auth-identity-backfill:global', 0));

  FOR v_user IN
    SELECT users."_id", users."_creationTime", users."tokenIdentifier", users."createdAt"
      FROM public."users" AS users
     WHERE p_cursor IS NULL OR (users."_creationTime", users."_id") > (v_cursor_time, v_cursor_id)
     ORDER BY users."_creationTime", users."_id"
     LIMIT 100
  LOOP
    v_processed_count := v_processed_count + 1;
    v_last_time := v_user."_creationTime";
    v_last_id := v_user."_id";
    v_conflict_reason := NULL;

    v_separator := pg_catalog.strpos(v_user."tokenIdentifier", '|');
    IF v_separator <= 1 THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    v_issuer := pg_catalog.left(v_user."tokenIdentifier", v_separator - 1);
    v_subject := pg_catalog.substr(v_user."tokenIdentifier", v_separator + 1);
    IF pg_catalog.btrim(v_subject) = '' THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    v_provider := CASE v_issuer
      WHEN 'https://securetoken.google.com/uselalaoapp' THEN 'firebase'
      WHEN 'https://one.playsole.xyz' THEN 'playsole'
      ELSE NULL
    END;
    IF v_provider IS NULL THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Match ensure_lalao_user_for_identity's lock key to serialize this mapping
    -- with ordinary verified sign-in provisioning.
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity:' || v_issuer || ':' || v_subject, 0));

    -- Take the row lock only after the shared identity lock. Provisioning uses
    -- that same order (identity advisory lock, then user update), avoiding a
    -- lock-order deadlock while protecting this legacy identity snapshot.
    SELECT users."_creationTime", users."tokenIdentifier", users."createdAt"
      INTO v_current_creation_time, v_current_token_identifier, v_current_created_at
      FROM public."users" AS users
     WHERE users."_id" = v_user."_id"
     FOR UPDATE;
    IF NOT FOUND THEN
      CONTINUE;
    END IF;
    IF v_current_creation_time IS DISTINCT FROM v_user."_creationTime"
       OR v_current_token_identifier IS DISTINCT FROM v_user."tokenIdentifier" THEN
      RAISE EXCEPTION 'User identity changed during backfill; retry this page' USING ERRCODE = '40001';
    END IF;

    SELECT count(*)::integer, min(identity."userId"), min(identity."issuer"),
           min(identity."subject"), min(identity."provider")
      INTO v_by_token_count, v_by_token_user, v_by_token_issuer, v_by_token_subject, v_by_token_provider
      FROM public."authIdentities" AS identity
     WHERE identity."tokenIdentifier" = v_user."tokenIdentifier";
    SELECT count(*)::integer, min(identity."userId"), min(identity."tokenIdentifier"), min(identity."provider")
      INTO v_by_subject_count, v_by_subject_user, v_by_subject_token, v_by_subject_provider
      FROM public."authIdentities" AS identity
     WHERE identity."issuer" = v_issuer AND identity."subject" = v_subject;

    IF v_by_token_count > 1 OR v_by_subject_count > 1 THEN
      v_conflict_reason := 'duplicate_identity_mapping';
    ELSIF v_by_token_count = 1 AND (
      v_by_token_user <> v_user."_id" OR v_by_token_issuer <> v_issuer
      OR v_by_token_subject <> v_subject OR v_by_token_provider <> v_provider
    ) THEN
      v_conflict_reason := 'token_identifier_owned_or_mapped_elsewhere';
    ELSIF v_by_subject_count = 1 AND (
      v_by_subject_user <> v_user."_id" OR v_by_subject_token <> v_user."tokenIdentifier"
      OR v_by_subject_provider <> v_provider
    ) THEN
      v_conflict_reason := 'issuer_subject_owned_or_mapped_elsewhere';
    END IF;

    IF v_conflict_reason IS NOT NULL THEN
      v_conflict_count := v_conflict_count + 1;
      v_conflicts := v_conflicts || jsonb_build_array(jsonb_build_object(
        'userId', v_user."_id",
        'tokenIdentifier', v_user."tokenIdentifier",
        'reason', v_conflict_reason
      ));
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('auth-identity-backfill-conflict:' || v_user."_id", 0));
      IF NOT EXISTS (
        SELECT 1 FROM public."authIdentityBackfillConflicts" AS conflict
         WHERE conflict."userId" = v_user."_id"
      ) THEN
        v_noted_at := extract(epoch FROM clock_timestamp()) * 1000;
        INSERT INTO public."authIdentityBackfillConflicts" ("_id", "userId", "tokenIdentifier", "notedAt")
        VALUES ('auth_conflict_' || replace(gen_random_uuid()::text, '-', ''), v_user."_id", v_user."tokenIdentifier", v_noted_at);
      END IF;
      CONTINUE;
    END IF;

    IF v_by_token_count = 1 OR v_by_subject_count = 1 THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    INSERT INTO public."authIdentities" (
      "_id", "userId", "provider", "issuer", "subject", "tokenIdentifier",
      "emailVerified", "linkedAt"
    ) VALUES (
      'auth_backfill_' || replace(gen_random_uuid()::text, '-', ''), v_user."_id", v_provider,
      v_issuer, v_subject, v_user."tokenIdentifier", false, v_current_created_at
    ) ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;

    IF v_inserted_rows = 1 THEN
      v_inserted_count := v_inserted_count + 1;
    ELSE
      -- Fail closed on an unexpected concurrent unique-key collision. Never
      -- reassign an existing identity or infer ownership from email.
      v_conflict_count := v_conflict_count + 1;
      v_conflicts := v_conflicts || jsonb_build_array(jsonb_build_object(
        'userId', v_user."_id",
        'tokenIdentifier', v_user."tokenIdentifier",
        'reason', 'concurrent_identity_mapping_conflict'
      ));
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('auth-identity-backfill-conflict:' || v_user."_id", 0));
      IF NOT EXISTS (
        SELECT 1 FROM public."authIdentityBackfillConflicts" AS conflict
         WHERE conflict."userId" = v_user."_id"
      ) THEN
        v_noted_at := extract(epoch FROM clock_timestamp()) * 1000;
        INSERT INTO public."authIdentityBackfillConflicts" ("_id", "userId", "tokenIdentifier", "notedAt")
        VALUES ('auth_conflict_' || replace(gen_random_uuid()::text, '-', ''), v_user."_id", v_user."tokenIdentifier", v_noted_at);
      END IF;
    END IF;
  END LOOP;

  IF v_last_id IS NULL AND p_cursor IS NULL THEN
    v_done := NOT EXISTS (SELECT 1 FROM public."users");
  ELSIF v_last_id IS NULL THEN
    v_done := NOT EXISTS (
      SELECT 1 FROM public."users" AS users
       WHERE (users."_creationTime", users."_id") > (v_cursor_time, v_cursor_id)
    );
  ELSE
    v_done := NOT EXISTS (
      SELECT 1 FROM public."users" AS users
       WHERE (users."_creationTime", users."_id") > (v_last_time, v_last_id)
    );
  END IF;

  IF v_done AND NOT EXISTS (SELECT 1 FROM public."authIdentityBackfillConflicts") THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('auth-migration-state:authIdentityV1', 0));
    SELECT count(*)::integer INTO v_state_count
      FROM public."authMigrationState" AS state
     WHERE state."key" = 'authIdentityV1';
    IF v_state_count > 1 THEN
      RAISE EXCEPTION 'Duplicate auth migration state rows; resolve before backfill completion' USING ERRCODE = '23505';
    ELSIF v_state_count = 1 THEN
      UPDATE public."authMigrationState"
         SET "authIdentitiesBackfilledAt" = extract(epoch FROM clock_timestamp()) * 1000
       WHERE "key" = 'authIdentityV1';
    ELSE
      INSERT INTO public."authMigrationState" ("_id", "key", "authIdentitiesBackfilledAt")
      VALUES ('auth_state_' || replace(gen_random_uuid()::text, '-', ''), 'authIdentityV1', extract(epoch FROM clock_timestamp()) * 1000);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'processedCount', v_processed_count,
    'insertedCount', v_inserted_count,
    'conflictCount', v_conflict_count,
    'conflicts', v_conflicts,
    'skippedCount', v_skipped_count,
    'done', v_done,
    'nextCursor', CASE WHEN v_done OR v_last_id IS NULL THEN NULL
      ELSE jsonb_build_object('creationTime', v_last_time, 'id', v_last_id) END
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.backfill_lalao_auth_identities(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_lalao_auth_identities(jsonb) TO service_role;
COMMENT ON FUNCTION public.backfill_lalao_auth_identities(jsonb) IS
  'Explicit service-role-only, idempotent 100-user keyset backfill from legacy tokenIdentifier values. Never called by login; never links by email or changes users.';

COMMIT;
