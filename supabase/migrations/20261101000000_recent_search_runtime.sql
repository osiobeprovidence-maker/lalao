BEGIN;

CREATE OR REPLACE FUNCTION public.upsert_lalao_recent_search(p_user_id text, p_search jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_query text;
  v_type text;
  v_entity_id text;
  v_search_id text;
  v_existing_timestamp double precision;
  v_shadow_revision bigint;
  v_shadow_owner text;
  v_revision bigint;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  v_trim record;
  v_count integer;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_search IS NULL OR pg_catalog.jsonb_typeof(p_search) <> 'object' THEN
    RAISE EXCEPTION 'Invalid recent search request' USING ERRCODE = '22023';
  END IF;
  IF pg_catalog.jsonb_typeof(p_search->'query') IS DISTINCT FROM 'string'
     OR pg_catalog.jsonb_typeof(p_search->'type') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'Search text and type are required' USING ERRCODE = '22023';
  END IF;
  v_query := btrim(p_search->>'query');
  v_type := p_search->>'type';
  IF v_type NOT IN ('keyword', 'person', 'page', 'shop', 'content', 'event') THEN
    RAISE EXCEPTION 'Invalid recent search type' USING ERRCODE = '22023';
  END IF;
  IF v_query = '' THEN RETURN NULL; END IF;
  IF (p_search ? 'entityId' AND p_search->'entityId' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_search->'entityId') <> 'string')
     OR (p_search ? 'title' AND p_search->'title' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_search->'title') <> 'string')
     OR (p_search ? 'subtitle' AND p_search->'subtitle' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_search->'subtitle') <> 'string')
     OR (p_search ? 'avatarUrl' AND p_search->'avatarUrl' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_search->'avatarUrl') <> 'string')
     OR (p_search ? 'isVerified' AND p_search->'isVerified' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_search->'isVerified') <> 'boolean')
     OR (p_search ? 'verificationTier' AND p_search->'verificationTier' <> 'null'::jsonb AND pg_catalog.jsonb_typeof(p_search->'verificationTier') <> 'string') THEN
    RAISE EXCEPTION 'Invalid recent search fields' USING ERRCODE = '22023';
  END IF;
  v_entity_id := NULLIF(p_search->>'entityId', '');

  -- Serialize a user's history mutations. The per-search lock below is shared
  -- with apply_recent_search_shadow, so delayed Convex mirror events cannot
  -- race a direct Supabase update or tombstone.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('recent-search-user:' || p_user_id, 0));
  IF v_entity_id IS NOT NULL THEN
    SELECT search."_id", search."timestamp" INTO v_search_id, v_existing_timestamp
      FROM public."recentSearches" AS search
     WHERE search."userId" = p_user_id AND search."entityId" = v_entity_id AND search."type" = v_type
     ORDER BY search."timestamp" DESC LIMIT 1;
  END IF;
  IF v_search_id IS NULL THEN
    SELECT search."_id", search."timestamp" INTO v_search_id, v_existing_timestamp
      FROM public."recentSearches" AS search
     WHERE search."userId" = p_user_id AND search."query" = v_query AND search."type" = v_type
     ORDER BY search."timestamp" DESC LIMIT 1;
  END IF;
  IF v_search_id IS NULL THEN
    v_search_id := 'rs_' || replace(gen_random_uuid()::text, '-', '');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_search_id, 0));
  SELECT state.revision INTO v_shadow_revision
    FROM public."recentSearchShadowState" AS state WHERE state.search_id = v_search_id FOR UPDATE;
  IF FOUND AND EXISTS (
    SELECT 1 FROM public."recentSearchShadowState" AS state
     WHERE state.search_id = v_search_id AND state.user_id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'Recent search owner does not match shadow state' USING ERRCODE = '23505';
  END IF;
  v_revision := greatest(v_now, coalesce(floor(v_existing_timestamp)::bigint + 1, 0), coalesce(v_shadow_revision + 1, 0));

  IF v_existing_timestamp IS NULL THEN
    INSERT INTO public."recentSearches" (
      "_id", "userId", "query", "type", "entityId", "title", "subtitle", "avatarUrl",
      "isVerified", "verificationTier", "timestamp"
    ) VALUES (
      v_search_id, p_user_id, v_query, v_type, v_entity_id, p_search->>'title', p_search->>'subtitle',
      p_search->>'avatarUrl', (p_search->>'isVerified')::boolean, p_search->>'verificationTier', v_revision
    );
  ELSE
    UPDATE public."recentSearches" SET
      "query" = v_query,
      "entityId" = coalesce(v_entity_id, "entityId"),
      "title" = CASE WHEN p_search ? 'title' THEN p_search->>'title' ELSE "title" END,
      "subtitle" = CASE WHEN p_search ? 'subtitle' THEN p_search->>'subtitle' ELSE "subtitle" END,
      "avatarUrl" = CASE WHEN p_search ? 'avatarUrl' THEN p_search->>'avatarUrl' ELSE "avatarUrl" END,
      "isVerified" = CASE WHEN p_search ? 'isVerified' THEN (p_search->>'isVerified')::boolean ELSE "isVerified" END,
      "verificationTier" = CASE WHEN p_search ? 'verificationTier' THEN p_search->>'verificationTier' ELSE "verificationTier" END,
      "timestamp" = v_revision
    WHERE "_id" = v_search_id AND "userId" = p_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recent search record disappeared during update' USING ERRCODE = '40001';
    END IF;
  END IF;

  INSERT INTO public."recentSearchShadowState" AS state (search_id, user_id, revision, deleted, updated_at)
  VALUES (v_search_id, p_user_id, v_revision, false, clock_timestamp())
  ON CONFLICT (search_id) DO UPDATE SET revision = EXCLUDED.revision, deleted = false, updated_at = EXCLUDED.updated_at
  WHERE state.user_id = EXCLUDED.user_id;

  SELECT count(*)::integer INTO v_count FROM public."recentSearches" WHERE "userId" = p_user_id;
  IF v_count > 50 THEN
    FOR v_trim IN
      SELECT search."_id", search."timestamp" FROM public."recentSearches" AS search
       WHERE search."userId" = p_user_id ORDER BY search."timestamp" ASC, search."_id" ASC
       LIMIT v_count - 50
    LOOP
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_trim."_id", 0));
      SELECT state.revision, state.user_id INTO v_shadow_revision, v_shadow_owner FROM public."recentSearchShadowState" AS state
       WHERE state.search_id = v_trim."_id" FOR UPDATE;
      IF FOUND AND v_shadow_owner <> p_user_id THEN
        RAISE EXCEPTION 'Recent search owner does not match shadow state' USING ERRCODE = '23505';
      END IF;
      v_revision := greatest(floor(v_trim."timestamp")::bigint + 1, coalesce(v_shadow_revision + 1, 0));
      INSERT INTO public."recentSearchShadowState" AS state (search_id, user_id, revision, deleted, updated_at)
      VALUES (v_trim."_id", p_user_id, v_revision, true, clock_timestamp())
      ON CONFLICT (search_id) DO UPDATE SET revision = EXCLUDED.revision, deleted = true, updated_at = EXCLUDED.updated_at
      WHERE state.user_id = EXCLUDED.user_id;
      DELETE FROM public."recentSearches" WHERE "_id" = v_trim."_id" AND "userId" = p_user_id;
    END LOOP;
  END IF;

  RETURN v_search_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_lalao_recent_search(p_user_id text, p_search_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_owner_id text;
  v_timestamp double precision;
  v_shadow_revision bigint;
  v_shadow_deleted boolean;
  v_revision bigint;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_search_id IS NULL OR p_search_id = '' THEN
    RAISE EXCEPTION 'Search and owner IDs are required' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('recent-search-user:' || p_user_id, 0));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_search_id, 0));
  SELECT search."userId", search."timestamp" INTO v_owner_id, v_timestamp
    FROM public."recentSearches" AS search WHERE search."_id" = p_search_id FOR UPDATE;
  IF FOUND AND v_owner_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized to remove this search item' USING ERRCODE = '42501';
  END IF;
  SELECT state.user_id, state.revision, state.deleted INTO v_owner_id, v_shadow_revision, v_shadow_deleted
    FROM public."recentSearchShadowState" AS state WHERE state.search_id = p_search_id FOR UPDATE;
  IF FOUND AND v_owner_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized to remove this search item' USING ERRCODE = '42501';
  END IF;
  IF v_timestamp IS NULL AND (v_shadow_revision IS NULL OR v_shadow_deleted) THEN RETURN true; END IF;
  v_revision := greatest(coalesce(floor(v_timestamp)::bigint + 1, 0), coalesce(v_shadow_revision + 1, 0));
  INSERT INTO public."recentSearchShadowState" AS state (search_id, user_id, revision, deleted, updated_at)
  VALUES (p_search_id, p_user_id, v_revision, true, clock_timestamp())
  ON CONFLICT (search_id) DO UPDATE SET revision = EXCLUDED.revision, deleted = true, updated_at = EXCLUDED.updated_at
  WHERE state.user_id = EXCLUDED.user_id;
  DELETE FROM public."recentSearches" WHERE "_id" = p_search_id AND "userId" = p_user_id;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_lalao_recent_searches(p_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_record record;
  v_shadow_revision bigint;
  v_shadow_owner text;
  v_revision bigint;
  v_count integer := 0;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Search owner is required' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('recent-search-user:' || p_user_id, 0));
  FOR v_record IN SELECT search."_id", search."timestamp" FROM public."recentSearches" AS search WHERE search."userId" = p_user_id
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_record."_id", 0));
    SELECT state.revision, state.user_id INTO v_shadow_revision, v_shadow_owner FROM public."recentSearchShadowState" AS state
     WHERE state.search_id = v_record."_id" FOR UPDATE;
    IF FOUND AND v_shadow_owner <> p_user_id THEN
      RAISE EXCEPTION 'Recent search owner does not match shadow state' USING ERRCODE = '23505';
    END IF;
    v_revision := greatest(floor(v_record."timestamp")::bigint + 1, coalesce(v_shadow_revision + 1, 0));
    INSERT INTO public."recentSearchShadowState" AS state (search_id, user_id, revision, deleted, updated_at)
    VALUES (v_record."_id", p_user_id, v_revision, true, clock_timestamp())
    ON CONFLICT (search_id) DO UPDATE SET revision = EXCLUDED.revision, deleted = true, updated_at = EXCLUDED.updated_at
    WHERE state.user_id = EXCLUDED.user_id;
    DELETE FROM public."recentSearches" WHERE "_id" = v_record."_id" AND "userId" = p_user_id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_lalao_recent_search(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.remove_lalao_recent_search(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.clear_lalao_recent_searches(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lalao_recent_search(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_lalao_recent_search(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_lalao_recent_searches(text) TO service_role;

COMMENT ON FUNCTION public.upsert_lalao_recent_search(text, jsonb) IS 'Upserts an authenticated user search and maintains shadow ordering state; service-role only.';
COMMENT ON FUNCTION public.remove_lalao_recent_search(text, text) IS 'Deletes only the authenticated user search and records a mirror tombstone; service-role only.';
COMMENT ON FUNCTION public.clear_lalao_recent_searches(text) IS 'Clears one authenticated user search history and records mirror tombstones; service-role only.';

COMMIT;
