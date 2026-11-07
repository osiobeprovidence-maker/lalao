CREATE OR REPLACE FUNCTION public.get_lalao_discoverable_people(
  p_viewer_id text,
  p_limit integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result jsonb;
  viewer_interests jsonb;
BEGIN
  IF p_viewer_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public."users" WHERE "_id" = p_viewer_id
  ) THEN
    RAISE EXCEPTION 'Mapped viewer profile not found' USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 0 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Invalid discoverable people limit' USING ERRCODE = '22023';
  END IF;

  SELECT CASE
    WHEN jsonb_typeof("interests") = 'array' THEN "interests"
    ELSE '[]'::jsonb
  END
  INTO viewer_interests
  FROM public."users"
  WHERE "_id" = p_viewer_id;

  WITH eligible AS (
    SELECT
      u."_id",
      u."name",
      u."username",
      u."avatarUrl",
      u."userType",
      u."bio",
      u."locationName",
      u."followersCount",
      u."followingCount",
      u."verificationTier",
      u."verificationStatus",
      u."verificationExpiresAt",
      u."_creationTime",
      (
        SELECT count(*)::integer
        FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(u."interests") = 'array' THEN u."interests" ELSE '[]'::jsonb END
        ) AS interest(value)
        WHERE viewer_interests ? interest.value
      ) AS shared_interests
    FROM public."users" AS u
    WHERE u."_id" <> p_viewer_id
      AND COALESCE(u."suspended", false) = false
      AND COALESCE(u."accessStatus", 'available') NOT IN ('country_restricted', 'waitlisted')
      AND NOT EXISTS (
        SELECT 1
        FROM public."follows" AS f
        WHERE f."followerId" = p_viewer_id AND f."followingId" = u."_id"
      )
  ),
  ranked AS (
    SELECT *
    FROM eligible
    ORDER BY shared_interests DESC, COALESCE("followersCount", 0) DESC, "_creationTime" ASC, "_id" ASC
    LIMIT p_limit
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', "_id",
        'name', COALESCE("name", 'User'),
        'username', COALESCE("username", 'user'),
        'avatar', COALESCE("avatarUrl", ''),
        'userType', COALESCE("userType", 'person'),
        'bio', COALESCE("bio", ''),
        'location', btrim(regexp_replace(regexp_replace(COALESCE("locationName", ''), '\s*\(Detected\)\s*', '', 'i'), '^GPS Detected$', '', 'i')),
        'followersCount', COALESCE("followersCount", 0),
        'followingCount', COALESCE("followingCount", 0),
        'isFollowing', false,
        'relationship', CASE
          WHEN EXISTS (
            SELECT 1 FROM public."follows" AS inbound
            WHERE inbound."followerId" = ranked."_id" AND inbound."followingId" = p_viewer_id
          ) THEN 'follower'
          ELSE 'none'
        END,
        'isVerified', (
          "verificationTier" IS NOT NULL AND "verificationTier" <> 'none'
          AND ("verificationStatus" IS NULL OR "verificationStatus" = 'active')
          AND ("verificationExpiresAt" IS NULL OR "verificationExpiresAt" > extract(epoch from clock_timestamp()) * 1000)
        ),
        'verificationTier', CASE
          WHEN "verificationTier" IS NOT NULL AND "verificationTier" <> 'none'
            AND ("verificationStatus" IS NULL OR "verificationStatus" = 'active')
            AND ("verificationExpiresAt" IS NULL OR "verificationExpiresAt" > extract(epoch from clock_timestamp()) * 1000)
          THEN "verificationTier"
          ELSE 'none'
        END
      )
      ORDER BY shared_interests DESC, COALESCE("followersCount", 0) DESC, "_creationTime" ASC, "_id" ASC
    ),
    '[]'::jsonb
  )
  INTO result
  FROM ranked;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_lalao_discoverable_people_count(
  p_viewer_id text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result bigint;
BEGIN
  IF p_viewer_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public."users" WHERE "_id" = p_viewer_id
  ) THEN
    RAISE EXCEPTION 'Mapped viewer profile not found' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)
  INTO result
  FROM public."users" AS u
  WHERE u."_id" <> p_viewer_id
    AND COALESCE(u."suspended", false) = false
    AND COALESCE(u."accessStatus", 'available') NOT IN ('country_restricted', 'waitlisted')
    AND NOT EXISTS (
      SELECT 1
      FROM public."follows" AS f
      WHERE f."followerId" = p_viewer_id AND f."followingId" = u."_id"
    );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lalao_discoverable_people(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_lalao_discoverable_people_count(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_lalao_discoverable_people(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_lalao_discoverable_people_count(text) TO service_role;
