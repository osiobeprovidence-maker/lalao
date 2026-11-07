DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public."likes"
    GROUP BY "userId", "targetType", "targetId"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate like rows exist; reconcile them before applying the social likes migration';
  END IF;
END
$$;

CREATE UNIQUE INDEX idx_likes_by_user_target_unique
  ON public."likes" ("userId", "targetType", "targetId");

CREATE TABLE public."notificationOutbox" (
  "_id" text PRIMARY KEY,
  "notificationId" text NOT NULL UNIQUE,
  "recipientId" text NOT NULL,
  "category" text NOT NULL CHECK ("category" IN ('likes', 'comments')),
  "payload" jsonb NOT NULL CHECK (jsonb_typeof("payload") = 'object'),
  "status" text NOT NULL CHECK ("status" IN ('pending', 'suppressed', 'sending', 'delivered', 'failed')),
  "attemptCount" integer NOT NULL DEFAULT 0 CHECK ("attemptCount" >= 0),
  "availableAt" double precision NOT NULL,
  "lastErrorCode" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);

ALTER TABLE public."notificationOutbox" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."notificationOutbox" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."notificationOutbox" TO service_role;

CREATE INDEX idx_notificationOutbox_status_available
  ON public."notificationOutbox" ("status", "availableAt");
CREATE INDEX idx_notificationOutbox_recipient_created
  ON public."notificationOutbox" ("recipientId", "createdAt" DESC);

CREATE OR REPLACE FUNCTION public.enqueue_lalao_social_notification(
  p_recipient_id text,
  p_actor_id text,
  p_type text,
  p_post_id text,
  p_comment_id text,
  p_excerpt text,
  p_category text,
  p_title text,
  p_body text,
  p_url text,
  p_tag text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notification_id text := 'notification_' || gen_random_uuid()::text;
  v_outbox_id text := 'outbox_' || gen_random_uuid()::text;
  v_now double precision := extract(epoch FROM clock_timestamp()) * 1000;
  v_preferences jsonb;
  v_status text;
BEGIN
  IF p_recipient_id IS NULL OR p_recipient_id = ''
     OR p_actor_id IS NULL OR p_actor_id = ''
     OR p_type IS NULL OR p_type NOT IN ('like', 'comment_like', 'reply_like')
     OR p_category IS NULL OR p_category NOT IN ('likes', 'comments')
     OR p_post_id IS NULL OR p_post_id = '' THEN
    RAISE EXCEPTION 'Invalid social notification' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public."notifications" (
    "_id", "recipientId", "actorId", "type", "postId", "commentId",
    "targetExcerpt", "isRead", "createdAt"
  ) VALUES (
    v_notification_id, p_recipient_id, p_actor_id, p_type, p_post_id, p_comment_id,
    left(p_excerpt, 80), false, v_now
  );

  SELECT "notificationPrefs" INTO v_preferences
  FROM public."users"
  WHERE "_id" = p_recipient_id;

  v_status := CASE
    WHEN v_preferences ->> 'desktop' = 'false'
      OR v_preferences ->> p_category = 'false' THEN 'suppressed'
    ELSE 'pending'
  END;

  INSERT INTO public."notificationOutbox" (
    "_id", "notificationId", "recipientId", "category", "payload", "status",
    "attemptCount", "availableAt", "createdAt", "updatedAt"
  ) VALUES (
    v_outbox_id, v_notification_id, p_recipient_id, p_category,
    jsonb_strip_nulls(jsonb_build_object(
      'title', p_title,
      'body', p_body,
      'url', p_url,
      'tag', p_tag
    )),
    v_status, 0, v_now, v_now, v_now
  );

  RETURN v_notification_id;
END
$$;

CREATE OR REPLACE FUNCTION public.toggle_lalao_post_like(
  p_user_id text,
  p_post_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_post public."posts"%ROWTYPE;
  v_user_name text;
  v_like_id text;
  v_count double precision;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_post_id IS NULL OR p_post_id = '' THEN
    RAISE EXCEPTION 'Invalid like request' USING ERRCODE = '22023';
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

  SELECT "_id" INTO v_like_id
  FROM public."likes"
  WHERE "userId" = p_user_id AND "targetType" = 'post' AND "targetId" = p_post_id;

  IF v_like_id IS NOT NULL THEN
    DELETE FROM public."likes" WHERE "_id" = v_like_id;
    UPDATE public."posts"
    SET "likesCount" = greatest(coalesce("likesCount", 0) - 1, 0)
    WHERE "_id" = p_post_id
    RETURNING "likesCount" INTO v_count;
    RETURN jsonb_build_object('liked', false, 'likesCount', v_count);
  END IF;

  INSERT INTO public."likes" ("_id", "userId", "targetType", "targetId", "createdAt")
  VALUES ('like_' || gen_random_uuid()::text, p_user_id, 'post', p_post_id,
          extract(epoch FROM clock_timestamp()) * 1000);
  UPDATE public."posts"
  SET "likesCount" = coalesce("likesCount", 0) + 1
  WHERE "_id" = p_post_id
  RETURNING "likesCount" INTO v_count;

  IF v_post."authorId" <> p_user_id THEN
    SELECT "name" INTO v_user_name FROM public."users" WHERE "_id" = p_user_id;
    PERFORM public.enqueue_lalao_social_notification(
      v_post."authorId", p_user_id, 'like', p_post_id, NULL,
      coalesce(v_post."text", ''), 'likes',
      coalesce(v_user_name, 'Someone') || ' liked your post',
      CASE WHEN coalesce(v_post."text", '') = '' THEN 'Check it out on Lalao'
           ELSE left(v_post."text", 100) END,
      '/app?tab=home&post=' || p_post_id,
      'like-' || p_post_id
    );
  END IF;

  RETURN jsonb_build_object('liked', true, 'likesCount', v_count);
END
$$;

CREATE OR REPLACE FUNCTION public.toggle_lalao_comment_like(
  p_user_id text,
  p_comment_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_comment public."comments"%ROWTYPE;
  v_user_name text;
  v_like_id text;
  v_count double precision;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' OR p_comment_id IS NULL OR p_comment_id = '' THEN
    RAISE EXCEPTION 'Invalid like request' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_comment
  FROM public."comments"
  WHERE "_id" = p_comment_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT "_id" INTO v_like_id
  FROM public."likes"
  WHERE "userId" = p_user_id AND "targetType" = 'comment' AND "targetId" = p_comment_id;

  IF v_like_id IS NOT NULL THEN
    DELETE FROM public."likes" WHERE "_id" = v_like_id;
    UPDATE public."comments"
    SET "likesCount" = greatest(coalesce("likesCount", 0) - 1, 0)
    WHERE "_id" = p_comment_id
    RETURNING "likesCount" INTO v_count;
    RETURN jsonb_build_object('liked', false, 'likesCount', v_count);
  END IF;

  INSERT INTO public."likes" ("_id", "userId", "targetType", "targetId", "createdAt")
  VALUES ('like_' || gen_random_uuid()::text, p_user_id, 'comment', p_comment_id,
          extract(epoch FROM clock_timestamp()) * 1000);
  UPDATE public."comments"
  SET "likesCount" = coalesce("likesCount", 0) + 1
  WHERE "_id" = p_comment_id
  RETURNING "likesCount" INTO v_count;

  IF v_comment."authorId" <> p_user_id THEN
    SELECT "name" INTO v_user_name FROM public."users" WHERE "_id" = p_user_id;
    PERFORM public.enqueue_lalao_social_notification(
      v_comment."authorId", p_user_id,
      CASE WHEN v_comment."parentCommentId" IS NULL THEN 'comment_like' ELSE 'reply_like' END,
      v_comment."postId", p_comment_id,
      CASE WHEN coalesce(v_comment."text", '') = '' THEN 'an attachment'
           ELSE v_comment."text" END,
      'comments',
      coalesce(v_user_name, 'Someone') || CASE
        WHEN v_comment."parentCommentId" IS NULL THEN ' liked your comment'
        ELSE ' liked your reply' END,
      CASE WHEN coalesce(v_comment."text", '') = '' THEN 'an attachment'
           ELSE left(v_comment."text", 100) END,
      '/app?tab=home&post=' || v_comment."postId"
    );
  END IF;

  RETURN jsonb_build_object('liked', true, 'likesCount', v_count);
END
$$;

REVOKE ALL ON FUNCTION public.enqueue_lalao_social_notification(text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_lalao_post_like(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_lalao_comment_like(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_lalao_post_like(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_lalao_comment_like(text, text) TO service_role;
