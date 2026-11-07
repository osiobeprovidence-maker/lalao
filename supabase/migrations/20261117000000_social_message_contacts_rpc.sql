CREATE OR REPLACE FUNCTION public.get_lalao_message_contacts(
  p_viewer_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  result jsonb;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_viewer_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public."users" WHERE "_id" = p_viewer_id
  ) THEN
    RAISE EXCEPTION 'Mapped viewer profile not found' USING ERRCODE = '42501';
  END IF;

  -- Friends are the mutual-follow intersection: viewer follows target AND target follows viewer
  WITH mutual_follows AS (
    SELECT f1."followingId" AS friend_id
    FROM public."follows" AS f1
    INNER JOIN public."follows" AS f2
      ON f2."followerId" = f1."followingId"
     AND f2."followingId" = f1."followerId"
    WHERE f1."followerId" = p_viewer_id
  ),
  friend_profiles AS (
    SELECT
      u."_id",
      u."name",
      u."username",
      u."avatarUrl",
      u."userType",
      u."followersCount",
      u."followingCount",
      u."verificationTier",
      u."verificationStatus",
      u."verificationExpiresAt",
      u."_creationTime"
    FROM public."users" AS u
    INNER JOIN mutual_follows AS mf ON mf.friend_id = u."_id"
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', "_id",
        'name', COALESCE("name", 'User'),
        'username', COALESCE("username", 'user'),
        'avatar', COALESCE("avatarUrl", ''),
        'userType', COALESCE("userType", 'person'),
        'followersCount', COALESCE("followersCount", 0),
        'followingCount', COALESCE("followingCount", 0),
        'isFollowing', true,
        'relationship', 'friends',
        'isVerified', (
          NULLIF("verificationTier", '') IS NOT NULL AND "verificationTier" <> 'none'
          AND ("verificationStatus" IS NULL OR "verificationStatus" = 'active')
          AND ("verificationExpiresAt" IS NULL OR "verificationExpiresAt" = 0 OR "verificationExpiresAt" > v_now)
        ),
        'verificationTier', CASE
          WHEN NULLIF("verificationTier", '') IS NOT NULL AND "verificationTier" <> 'none'
            AND ("verificationStatus" IS NULL OR "verificationStatus" = 'active')
            AND ("verificationExpiresAt" IS NULL OR "verificationExpiresAt" = 0 OR "verificationExpiresAt" > v_now)
          THEN "verificationTier"
          ELSE 'none'
        END
      )
    ),
    '[]'::jsonb
  )
  INTO result
  FROM friend_profiles;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lalao_message_contacts(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_lalao_message_contacts(text) TO service_role;

COMMENT ON FUNCTION public.get_lalao_message_contacts(text) IS 'Returns mutual-follow (friend) message contacts for the viewer, with public profile projection and verification status. Trusted server only.';
