BEGIN;

-- ============================================================================
-- Lalao Feed & Social — Post, comment and repost interactions
--
-- Adds server-side RPCs for creating/deleting posts and comments, toggling
-- reposts, and reading comments. All functions are SECURITY DEFINER with a
-- fixed search path and are executable only by service_role. Caller identity
-- is resolved by the app-social Edge Function (never client-supplied).
--
-- Forward-only: previously applied migrations are not edited.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Indexes for safe pagination and ownership lookups
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_posts_by_author_created"
  ON public."posts" ("authorId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_comments_by_post_created"
  ON public."comments" ("postId", "createdAt" DESC);

-- ---------------------------------------------------------------------------
-- Comments migration was renamed from 20261116000000_social_post_comment_interactions.sql
-- to 20261116000001_social_post_comment_interactions.sql to resolve a duplicate
-- timestamp with people_discovery_read_rpc.sql. No functional change.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Create a post
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_lalao_post(text, text, text, text, text, text, double precision, double precision, text, text, text, text, jsonb, text, text, text, text, jsonb, text, text, text, text, text, text, text, double precision, double precision, double precision, double precision, double precision, text, text, text, text, text, boolean, double precision, double precision);

CREATE OR REPLACE FUNCTION public.create_lalao_post(
  p_author_id text,
  p_text text,
  p_location text,
  p_media_url text,
  p_media_storage_id text,
  p_media_type text,
  p_media_width double precision,
  p_media_height double precision,
  p_audience text,
  p_reply_permission text,
  p_gif_url text,
  p_poll_question text,
  p_poll_options jsonb,
  p_rally_ref_id text,
  p_page_ref_id text,
  p_group_ref_id text,
  p_content_topics jsonb,
  p_mux_upload_id text,
  p_mux_asset_id text,
  p_mux_playback_id text,
  p_media_status text,
  p_sound_id text,
  p_sound_title text,
  p_sound_author_name text,
  p_sound_audio_url text,
  p_sound_start_offset double precision,
  p_sound_volume double precision,
  p_original_audio_volume double precision,
  p_location_accuracy double precision,
  p_location_captured_at double precision,
  p_location_country text,
  p_location_state text,
  p_location_city text,
  p_location_neighborhood text,
  p_location_status text,
  p_nearby_enabled boolean,
  p_latitude double precision,
  p_longitude double precision
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_post_id text;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
  v_latitude double precision := NULL;
  v_longitude double precision := NULL;
  v_nearby_enabled boolean := FALSE;
BEGIN
  IF p_author_id IS NULL OR p_author_id = '' THEN
    RAISE EXCEPTION 'Post author is required' USING ERRCODE = '22023';
  END IF;
  IF p_text IS NULL OR p_text = '' THEN
    RAISE EXCEPTION 'Post text is required' USING ERRCODE = '22023';
  END IF;
  IF p_location IS NULL OR p_location = '' THEN
    RAISE EXCEPTION 'Post location is required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_author_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  -- Validate coordinates if provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    IF p_latitude >= -90 AND p_latitude <= 90
       AND p_longitude >= -180 AND p_longitude <= 180 THEN
      v_latitude := p_latitude;
      v_longitude := p_longitude;
    END IF;
  END IF;

  -- Nearby eligibility: requires valid coordinates
  IF p_nearby_enabled IS TRUE AND v_latitude IS NOT NULL AND v_longitude IS NOT NULL THEN
    v_nearby_enabled := TRUE;
  END IF;

  v_post_id := 'post_' || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public."posts" (
    "_id", "_creationTime", "authorId", "text", "location",
    "latitude", "longitude", "createdAt", "likesCount", "commentsCount",
    "repostsCount", "audience", "replyPermission", "gifUrl",
    "pollQuestion", "pollOptions", "rallyRefId", "pageRefId", "groupRefId",
    "contentTopics", "muxUploadId", "muxAssetId", "muxPlaybackId",
    "mediaStatus", "mediaUrl", "mediaStorageId", "mediaType", "mediaWidth",
    "mediaHeight", "soundId", "soundTitle", "soundAuthorName", "soundAudioUrl",
    "soundStartOffset", "soundVolume", "originalAudioVolume",
    "locationAccuracy", "locationCapturedAt", "locationCountry", "locationState",
    "locationCity", "locationNeighborhood", "locationStatus", "nearbyEnabled",
    "moderationStatus"
  )
  VALUES (
    v_post_id, v_now, p_author_id, p_text, p_location,
    v_latitude, v_longitude, v_now, 0, 0, 0,
    coalesce(p_audience, 'everyone'), coalesce(p_reply_permission, 'everyone'),
    p_gif_url, p_poll_question, p_poll_options, p_rally_ref_id,
    p_page_ref_id, p_group_ref_id, p_content_topics,
    p_mux_upload_id, p_mux_asset_id, p_mux_playback_id,
    coalesce(p_media_status, 'ready'), p_media_url, p_media_storage_id,
    p_media_type, p_media_width, p_media_height,
    p_sound_id, p_sound_title, p_sound_author_name, p_sound_audio_url,
    p_sound_start_offset, p_sound_volume, p_original_audio_volume,
    p_location_accuracy, p_location_captured_at,
    p_location_country, p_location_state, p_location_city,
    p_location_neighborhood, coalesce(p_location_status, 'unverified'),
    v_nearby_enabled, 'safe'
  );

  RETURN jsonb_build_object(
    'id', v_post_id,
    'authorId', p_author_id,
    'createdAt', v_now,
    'success', true
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- Delete a post (ownership enforced)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_lalao_post(
  p_user_id text,
  p_post_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_post public."posts"%ROWTYPE;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_post_id IS NULL OR p_post_id = '' THEN
    RAISE EXCEPTION 'Invalid delete request' USING ERRCODE = '22023';
  END IF;

  -- Lock the post row for the duration of the delete
  SELECT * INTO v_post
  FROM public."posts"
  WHERE "_id" = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_post."authorId" <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized to delete this post' USING ERRCODE = '42501';
  END IF;

  -- Delete comment likes for comments on this post
  DELETE FROM public."likes"
  WHERE "targetType" = 'comment'
    AND "targetId" IN (
      SELECT "_id" FROM public."comments" WHERE "postId" = p_post_id
    );

  -- Delete replies' likes (targetType 'reply' targeting comment IDs on this post)
  DELETE FROM public."likes"
  WHERE "targetType" = 'reply'
    AND "targetId" IN (
      SELECT "_id" FROM public."comments" WHERE "postId" = p_post_id
    );

  -- Delete comments on this post
  DELETE FROM public."comments" WHERE "postId" = p_post_id;

  -- Delete post likes
  DELETE FROM public."likes"
  WHERE "targetType" = 'post' AND "targetId" = p_post_id;

  -- Delete notifications referencing this post
  DELETE FROM public."notifications" WHERE "postId" = p_post_id;

  -- Delete the post itself
  DELETE FROM public."posts" WHERE "_id" = p_post_id;

  RETURN jsonb_build_object('success', true, 'deletedAt', v_now);
END;
$function$;

-- ---------------------------------------------------------------------------
-- Create a comment (or reply) on a post
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_lalao_comment(
  p_author_id text,
  p_post_id text,
  p_text text,
  p_parent_comment_id text,
  p_media_url text,
  p_media_storage_id text,
  p_media_type text,
  p_duration double precision
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_comment_id text;
  v_post public."posts"%ROWTYPE;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
  v_count double precision;
  v_parent public."comments"%ROWTYPE;
  v_group public."groupChats"%ROWTYPE;
  v_group_member_role text;
  v_is_group_member boolean;
  v_is_group_admin boolean;
  v_group_visibility text;
  v_mentioned boolean;
BEGIN
  IF p_author_id IS NULL OR p_author_id = '' THEN
    RAISE EXCEPTION 'Comment author is required' USING ERRCODE = '22023';
  END IF;
  IF p_post_id IS NULL OR p_post_id = '' THEN
    RAISE EXCEPTION 'Post is required' USING ERRCODE = '22023';
  END IF;
  IF (p_text IS NULL OR trim(p_text) = '') AND (p_media_storage_id IS NULL OR p_media_storage_id = '') THEN
    RAISE EXCEPTION 'Comment cannot be empty' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_author_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_post
  FROM public."posts"
  WHERE "_id" = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_parent_comment_id IS NOT NULL THEN
    SELECT * INTO v_parent FROM public."comments"
    WHERE "_id" = p_parent_comment_id AND "postId" = p_post_id
    FOR KEY SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent comment does not belong to this post' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Reply permission checks (mirror Convex behavior)
  IF v_post."replyPermission" IS NOT NULL AND v_post."replyPermission" <> 'everyone' THEN
    -- For simplicity in the RPC, allow followers/following/friends checks
    -- based on the follows table. The full mention-based check is handled
    -- in the frontend/Convex path when needed.
    IF v_post."replyPermission" = 'followers' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public."follows"
        WHERE "followerId" = p_author_id AND "followingId" = v_post."authorId"
      ) THEN
        RAISE EXCEPTION 'Only followers can reply' USING ERRCODE = '42501';
      END IF;
    ELSIF v_post."replyPermission" = 'following' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public."follows"
        WHERE "followerId" = v_post."authorId" AND "followingId" = p_author_id
      ) THEN
        RAISE EXCEPTION 'Only users this person follows can reply' USING ERRCODE = '42501';
      END IF;
    ELSIF v_post."replyPermission" = 'friends' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public."follows" f1
        WHERE f1."followerId" = p_author_id AND f1."followingId" = v_post."authorId"
      ) OR NOT EXISTS (
        SELECT 1 FROM public."follows" f2
        WHERE f2."followerId" = v_post."authorId" AND f2."followingId" = p_author_id
      ) THEN
        RAISE EXCEPTION 'Only friends can reply' USING ERRCODE = '42501';
      END IF;
    ELSIF v_post."replyPermission" = 'mentioned' THEN
      SELECT EXISTS (
        SELECT 1 FROM public."users" u
        WHERE u."_id" = p_author_id
          AND (coalesce(v_post."text", '') ILIKE '%' || ('@' || coalesce(u."username", '')) || '%'
            OR (u."name" IS NOT NULL AND coalesce(v_post."text", '') ILIKE '%' || ('@' || u."name") || '%'))
      ) INTO v_mentioned;
      IF NOT v_mentioned AND p_author_id <> v_post."authorId" THEN
        RAISE EXCEPTION 'Only mentioned users can reply to this post' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF v_post."groupRefId" IS NOT NULL THEN
    SELECT * INTO v_group FROM public."groupChats" WHERE "_id" = v_post."groupRefId";
    IF FOUND THEN
      IF v_group."communityEnabled" = false OR v_group."communityFeatures"->>'replies' = 'false' THEN
        RAISE EXCEPTION 'Replies are disabled for this group' USING ERRCODE = '42501';
      END IF;
      SELECT gm."role" INTO v_group_member_role FROM public."groupMembers" gm
      WHERE gm."groupId" = v_group."_id" AND gm."userId" = p_author_id LIMIT 1;
      v_is_group_member := v_group."creatorId" = p_author_id
        OR v_group_member_role IS NOT NULL
        OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(coalesce(v_group."memberIds", '[]'::jsonb)) m(value) WHERE m.value = p_author_id);
      v_is_group_admin := v_group."creatorId" = p_author_id OR v_group_member_role IN ('owner', 'admin');
      v_group_visibility := coalesce(v_group."visibility", 'private_discoverable');
      IF v_group_visibility <> 'public' AND NOT v_is_group_member THEN
        RAISE EXCEPTION 'You must be a member of this group to reply to posts' USING ERRCODE = '42501';
      END IF;
      IF v_group."publishingPermissions"->>'canReply' = 'admins_only' AND NOT v_is_group_admin THEN
        RAISE EXCEPTION 'Only group administrators can reply to posts in this group' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  v_comment_id := 'comment_' || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public."comments" (
    "_id", "_creationTime", "postId", "authorId", "parentCommentId",
    "text", "createdAt", "likesCount", "mediaUrl", "mediaStorageId",
    "mediaType", "duration", "isDeleted"
  )
  VALUES (
    v_comment_id, v_now, p_post_id, p_author_id, p_parent_comment_id,
    trim(coalesce(p_text, '')), v_now, 0,
    p_media_url, p_media_storage_id, p_media_type, p_duration, FALSE
  );

  UPDATE public."posts"
  SET "commentsCount" = coalesce("commentsCount", 0) + 1
  WHERE "_id" = p_post_id
  RETURNING "commentsCount" INTO v_count;

  -- Enqueue comment notification (not self)
  IF v_post."authorId" <> p_author_id THEN
    PERFORM public.enqueue_lalao_social_notification(
      v_post."authorId", p_author_id, 'comment', p_post_id, v_comment_id,
      coalesce(trim(p_text), ''), 'comments',
      'Someone commented on your post',
      left(coalesce(trim(p_text), ''), 100),
      '/app?tab=home&post=' || p_post_id,
      'comment-' || v_comment_id
    );
  END IF;

  -- Notify parent comment author if different
  IF p_parent_comment_id IS NOT NULL THEN
    IF v_parent."authorId" <> p_author_id
       AND v_parent."authorId" <> v_post."authorId" THEN
      PERFORM public.enqueue_lalao_social_notification(
        v_parent."authorId", p_author_id, 'reply', p_post_id, v_comment_id,
        coalesce(trim(p_text), ''), 'comments',
        'Someone replied to your comment',
        left(coalesce(trim(p_text), ''), 100),
        '/app?tab=home&post=' || p_post_id,
        'reply-' || v_comment_id
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', v_comment_id,
    'authorId', p_author_id,
    'parentCommentId', p_parent_comment_id,
    'text', trim(coalesce(p_text, '')),
    'createdAt', v_now,
    'likesCount', 0,
    'success', true
  );
END;
$function$;

-- ---------------------------------------------------------------------------
-- Delete a comment (ownership enforced; soft delete if it has children)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_lalao_comment(
  p_user_id text,
  p_comment_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_comment public."comments"%ROWTYPE;
  v_post public."posts"%ROWTYPE;
  v_child_count integer;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
  v_count double precision;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_comment_id IS NULL OR p_comment_id = '' THEN
    RAISE EXCEPTION 'Invalid delete request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_comment
  FROM public."comments"
  WHERE "_id" = p_comment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_comment."authorId" <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  -- Delete likes on this comment
  DELETE FROM public."likes"
  WHERE "targetType" = 'comment' AND "targetId" = p_comment_id;

  -- Check for children
  SELECT count(*) INTO v_child_count
  FROM public."comments"
  WHERE "parentCommentId" = p_comment_id;

  IF v_child_count > 0 THEN
    -- Soft delete
    UPDATE public."comments"
    SET "text" = '[Deleted]', "mediaUrl" = NULL, "mediaStorageId" = NULL,
        "mediaType" = NULL, "duration" = NULL, "isDeleted" = TRUE
    WHERE "_id" = p_comment_id;
  ELSE
    -- Hard delete and decrement post commentsCount
    SELECT * INTO v_post
    FROM public."posts"
    WHERE "_id" = v_comment."postId";

    DELETE FROM public."comments" WHERE "_id" = p_comment_id;

    IF FOUND THEN
      UPDATE public."posts"
      SET "commentsCount" = greatest(coalesce("commentsCount", 0) - 1, 0)
      WHERE "_id" = v_comment."postId"
      RETURNING "commentsCount" INTO v_count;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'deletedAt', v_now);
END;
$function$;

-- ---------------------------------------------------------------------------
-- Toggle a repost on a post (atomic)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_lalao_post_repost(
  p_user_id text,
  p_post_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_post public."posts"%ROWTYPE;
  v_existing_id text;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
  v_count double precision;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_post_id IS NULL OR p_post_id = '' THEN
    RAISE EXCEPTION 'Invalid repost request' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_post
  FROM public."posts"
  WHERE "_id" = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check for existing repost (represented as a like with targetType 'repost')
  SELECT "_id" INTO v_existing_id
  FROM public."likes"
  WHERE "userId" = p_user_id
    AND "targetType" = 'repost'
    AND "targetId" = p_post_id;

  IF v_existing_id IS NOT NULL THEN
    -- Undo repost
    DELETE FROM public."likes" WHERE "_id" = v_existing_id;
    UPDATE public."posts"
    SET "repostsCount" = greatest(coalesce("repostsCount", 0) - 1, 0)
    WHERE "_id" = p_post_id
    RETURNING "repostsCount" INTO v_count;
    RETURN jsonb_build_object('reposted', false, 'repostsCount', v_count);
  END IF;

  -- Add repost
  INSERT INTO public."likes" ("_id", "userId", "targetType", "targetId", "createdAt")
  VALUES ('repost_' || replace(gen_random_uuid()::text, '-', ''),
          p_user_id, 'repost', p_post_id, v_now);

  UPDATE public."posts"
  SET "repostsCount" = coalesce("repostsCount", 0) + 1
  WHERE "_id" = p_post_id
  RETURNING "repostsCount" INTO v_count;

  RETURN jsonb_build_object('reposted', true, 'repostsCount', v_count);
END;
$function$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_lalao_post(text, text, text, text, text, text, double precision, double precision, text, text, text, text, jsonb, text, text, text, jsonb, text, text, text, text, text, text, text, text, double precision, double precision, double precision, double precision, double precision, text, text, text, text, text, boolean, double precision, double precision) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_lalao_post(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lalao_comment(text, text, text, text, text, text, text, double precision) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_lalao_comment(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_lalao_post_repost(text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_lalao_post(text, text, text, text, text, text, double precision, double precision, text, text, text, text, jsonb, text, text, text, jsonb, text, text, text, text, text, text, text, text, double precision, double precision, double precision, double precision, double precision, text, text, text, text, text, boolean, double precision, double precision) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_lalao_post(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_lalao_comment(text, text, text, text, text, text, text, double precision) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_lalao_comment(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_lalao_post_repost(text, text) TO service_role;

COMMENT ON FUNCTION public.create_lalao_post(text, text, text, text, text, text, double precision, double precision, text, text, text, text, jsonb, text, text, text, jsonb, text, text, text, text, text, text, text, text, double precision, double precision, double precision, double precision, double precision, text, text, text, text, text, boolean, double precision, double precision) IS 'Creates a post with server-resolved author identity; trusted server only.';
COMMENT ON FUNCTION public.delete_lalao_post(text, text) IS 'Deletes a post after ownership check, cascading to comments/likes/notifications; trusted server only.';
COMMENT ON FUNCTION public.create_lalao_comment(text, text, text, text, text, text, text, double precision) IS 'Creates a comment or reply, increments commentsCount, enqueues notifications; trusted server only.';
COMMENT ON FUNCTION public.delete_lalao_comment(text, text) IS 'Deletes a comment after ownership check, soft-deletes if it has children; trusted server only.';
COMMENT ON FUNCTION public.toggle_lalao_post_repost(text, text) IS 'Atomically toggles a repost on a post; trusted server only.';

COMMIT;
