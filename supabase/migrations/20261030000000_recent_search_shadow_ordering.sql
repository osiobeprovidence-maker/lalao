BEGIN;

-- Internal event state for the local recent-search shadow mirror. The row is
-- deliberately retained after deletes as a tombstone so older retries cannot
-- resurrect a search row.
CREATE TABLE public."recentSearchShadowState" (
  search_id text PRIMARY KEY,
  user_id text NOT NULL,
  revision bigint NOT NULL CHECK (revision >= 0),
  deleted boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public."recentSearchShadowState" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."recentSearchShadowState" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."recentSearchShadowState" TO service_role;

CREATE OR REPLACE FUNCTION public.apply_recent_search_shadow(
  p_search_id text,
  p_user_id text,
  p_revision bigint,
  p_deleted boolean,
  p_record jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  current_user_id text;
  current_revision bigint;
  existing_row_user_id text;
BEGIN
  IF p_search_id IS NULL OR p_search_id = '' OR p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Search and owner IDs are required';
  END IF;
  IF p_revision IS NULL OR p_revision < 0 THEN
    RAISE EXCEPTION 'A non-negative search revision is required';
  END IF;
  IF p_deleted IS NULL THEN
    RAISE EXCEPTION 'The shadow operation kind is required';
  END IF;

  -- Serialize every mutation for this Convex search ID. A hash collision only
  -- serializes unrelated IDs; it cannot bypass the revision comparison.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_search_id, 0));

  SELECT state.user_id, state.revision
    INTO current_user_id, current_revision
    FROM public."recentSearchShadowState" AS state
   WHERE state.search_id = p_search_id
   FOR UPDATE;

  IF FOUND THEN
    IF current_user_id <> p_user_id THEN
      RAISE EXCEPTION 'Recent search owner does not match shadow state';
    END IF;
    IF p_revision < current_revision THEN
      RETURN 'stale';
    ELSIF p_revision = current_revision THEN
      RETURN 'duplicate';
    END IF;
  END IF;

  SELECT search."userId"
    INTO existing_row_user_id
    FROM public."recentSearches" AS search
   WHERE search."_id" = p_search_id
   FOR UPDATE;
  IF FOUND AND existing_row_user_id <> p_user_id THEN
    RAISE EXCEPTION 'Recent search owner does not match stored row';
  END IF;

  IF NOT p_deleted THEN
    IF p_record IS NULL OR pg_catalog.jsonb_typeof(p_record) <> 'object'
       OR p_record->>'_id' IS DISTINCT FROM p_search_id
       OR p_record->>'userId' IS DISTINCT FROM p_user_id
       OR (p_record->>'timestamp') IS NULL
       OR (p_record->>'timestamp')::numeric <> p_revision::numeric THEN
      RAISE EXCEPTION 'Recent search payload does not match its ID, owner, and revision';
    END IF;
  END IF;

  INSERT INTO public."recentSearchShadowState" (search_id, user_id, revision, deleted, updated_at)
  VALUES (p_search_id, p_user_id, p_revision, p_deleted, clock_timestamp())
  ON CONFLICT (search_id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        revision = EXCLUDED.revision,
        deleted = EXCLUDED.deleted,
        updated_at = EXCLUDED.updated_at;

  IF p_deleted THEN
    DELETE FROM public."recentSearches"
     WHERE "_id" = p_search_id AND "userId" = p_user_id;
    RETURN 'deleted';
  END IF;

  INSERT INTO public."recentSearches"
  SELECT (pg_catalog.jsonb_populate_record(NULL::public."recentSearches", p_record)).*
  ON CONFLICT ("_id") DO UPDATE SET
    "userId" = EXCLUDED."userId",
    "query" = EXCLUDED."query",
    "type" = EXCLUDED."type",
    "entityId" = EXCLUDED."entityId",
    "title" = EXCLUDED."title",
    "subtitle" = EXCLUDED."subtitle",
    "avatarUrl" = EXCLUDED."avatarUrl",
    "isVerified" = EXCLUDED."isVerified",
    "verificationTier" = EXCLUDED."verificationTier",
    "timestamp" = EXCLUDED."timestamp";

  RETURN 'mirrored';
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_recent_search_shadow(text, text, bigint, boolean, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_recent_search_shadow(text, text, bigint, boolean, jsonb) TO service_role;

COMMENT ON TABLE public."recentSearchShadowState" IS 'Internal recent-search mirror revision/tombstone state; tombstones prevent delayed sync retries from resurrecting deleted rows.';
COMMENT ON FUNCTION public.apply_recent_search_shadow(text, text, bigint, boolean, jsonb) IS 'Serializes a recent-search mirror event by ID and applies only strictly newer revisions. Service-role only.';

COMMIT;
