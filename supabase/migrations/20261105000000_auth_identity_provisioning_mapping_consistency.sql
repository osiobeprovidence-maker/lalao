BEGIN;

-- Resolve explicit and legacy identity ownership independently. Provider email
-- claims remain profile/linking hints and never establish account ownership.
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
  v_explicit_count integer;
  v_explicit_user_id text;
  v_explicit_provider text;
  v_explicit_token_identifier text;
  v_legacy_user_id text;
  v_existing_provider text;
  v_existing_token_identifier text;
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

  -- Keep the existing lock order: identity first, then verified email. The
  -- backfill takes the same identity lock before locking a legacy user row.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('identity:' || p_issuer || ':' || p_subject, 0));
  IF v_normalized_email IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('email:' || v_normalized_email, 0));
  END IF;

  -- Read the explicit provider mapping regardless of whether a legacy user
  -- also exists. Never let an explicit row conceal a legacy ownership conflict.
  SELECT count(*)::integer,
         min(auth_identity."userId"),
         min(auth_identity."provider"),
         min(auth_identity."tokenIdentifier")
    INTO v_explicit_count, v_explicit_user_id, v_explicit_provider, v_explicit_token_identifier
    FROM public."authIdentities" AS auth_identity
   WHERE auth_identity."issuer" = p_issuer
     AND auth_identity."subject" = p_subject;

  IF v_explicit_count > 1 THEN
    RAISE EXCEPTION 'Provider identity has multiple conflicting account mappings. Contact support for account recovery.' USING ERRCODE = '23505';
  END IF;
  IF v_explicit_count = 1 AND (
    v_explicit_provider IS DISTINCT FROM v_provider
    OR v_explicit_token_identifier IS DISTINCT FROM v_token_identifier
  ) THEN
    RAISE EXCEPTION 'Provider identity mapping conflicts with the incoming identity. Contact support for account recovery.' USING ERRCODE = '23505';
  END IF;

  -- Resolve the exact legacy issuer|subject key independently, and fail closed
  -- if historical data contains duplicates.
  SELECT count(*)::integer, min(users."_id")
    INTO v_matching_user_count, v_legacy_user_id
    FROM public."users" AS users
   WHERE users."tokenIdentifier" = v_token_identifier;
  IF v_matching_user_count > 1 THEN
    RAISE EXCEPTION 'Legacy authentication identity conflict. Contact support for account recovery.' USING ERRCODE = '23505';
  END IF;

  IF v_explicit_count = 1
     AND v_matching_user_count = 1
     AND v_explicit_user_id IS DISTINCT FROM v_legacy_user_id THEN
    RAISE EXCEPTION 'Explicit and legacy account mappings disagree. Contact support for account recovery.' USING ERRCODE = '23505';
  END IF;
  v_user_id := COALESCE(v_explicit_user_id, v_legacy_user_id);

  -- A verified email collision asks the user to sign in to the existing account
  -- and link the provider. Email is never used to choose the account owner.
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
    -- Existing roles are immutable through identity provisioning.
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

  -- Verify the row after insertion too, so unique-key races and malformed
  -- pre-existing records cannot be mistaken for a successful link.
  SELECT auth_identity."userId", auth_identity."provider", auth_identity."tokenIdentifier"
    INTO v_existing_user_id, v_existing_provider, v_existing_token_identifier
    FROM public."authIdentities" AS auth_identity
   WHERE auth_identity."issuer" = p_issuer
     AND auth_identity."subject" = p_subject;
  IF v_existing_user_id IS DISTINCT FROM v_user_id
     OR v_existing_provider IS DISTINCT FROM v_provider
     OR v_existing_token_identifier IS DISTINCT FROM v_token_identifier THEN
    RAISE EXCEPTION 'This sign-in method is already associated with another Lalao account.' USING ERRCODE = '23505';
  END IF;

  RETURN v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) TO service_role;
COMMENT ON FUNCTION public.ensure_lalao_user_for_identity(text, text, text, boolean, text, text, text) IS
  'Resolves explicit and legacy mappings for a cryptographically verified provider identity; email never determines account ownership. Existing roles are preserved. Service-role only.';

COMMIT;
