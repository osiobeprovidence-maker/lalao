BEGIN;

-- Preserve existing rows while serializing get-or-create paths by logical key.
CREATE OR REPLACE FUNCTION public.create_lalao_conversation(p_caller_id text, p_other_user_id text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_conv_id text;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_other_user_id IS NULL OR p_other_user_id = '' THEN RAISE EXCEPTION 'Other user ID is required' USING ERRCODE = '22023'; END IF;
  IF p_caller_id = p_other_user_id THEN RAISE EXCEPTION 'Cannot start a conversation with yourself' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_other_user_id) THEN RAISE EXCEPTION 'Other user not found' USING ERRCODE = 'P0002'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'direct-conversation:' || LEAST(p_caller_id, p_other_user_id) || ':' || GREATEST(p_caller_id, p_other_user_id), 0));
  SELECT "_id" INTO v_conv_id FROM public."conversations"
   WHERE (("userA" = p_caller_id AND "userB" = p_other_user_id) OR ("userA" = p_other_user_id AND "userB" = p_caller_id))
     AND "pageB" IS NULL AND "groupChatId" IS NULL
   ORDER BY "_creationTime" NULLS LAST, "_id" LIMIT 1;
  IF v_conv_id IS NOT NULL THEN RETURN v_conv_id; END IF;
  INSERT INTO public."conversations" ("_id", "userA", "userB", "updatedAt")
  VALUES ('conv_' || gen_random_uuid()::text, p_caller_id, p_other_user_id, extract(epoch FROM clock_timestamp()) * 1000)
  RETURNING "_id" INTO v_conv_id;
  RETURN v_conv_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_lalao_page_conversation(p_caller_id text, p_page_id text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_conv_id text;
  v_page public.pages%ROWTYPE;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_page_id IS NULL OR p_page_id = '' THEN RAISE EXCEPTION 'Page ID is required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_page FROM public."pages" WHERE "_id" = p_page_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Page not found' USING ERRCODE = 'P0002'; END IF;
  IF v_page."type" <> 'business' AND v_page."badge" IS DISTINCT FROM 'BIZ' THEN RAISE EXCEPTION 'Messaging is only available for Business pages' USING ERRCODE = '42501'; END IF;
  IF v_page."ownerId" = p_caller_id THEN RAISE EXCEPTION 'Cannot start a conversation with your own page' USING ERRCODE = '22023'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('page-conversation:' || p_caller_id || ':' || p_page_id, 0));
  SELECT "_id" INTO v_conv_id FROM public."conversations"
   WHERE "userA" = p_caller_id AND "pageB" = p_page_id AND "groupChatId" IS NULL
   ORDER BY "_creationTime" NULLS LAST, "_id" LIMIT 1;
  IF v_conv_id IS NOT NULL THEN RETURN v_conv_id; END IF;
  INSERT INTO public."conversations" ("_id", "userA", "pageB", "updatedAt")
  VALUES ('conv_' || gen_random_uuid()::text, p_caller_id, p_page_id, extract(epoch FROM clock_timestamp()) * 1000)
  RETURNING "_id" INTO v_conv_id;
  RETURN v_conv_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_lalao_group_chat(
  p_caller_id text, p_name text, p_description text DEFAULT NULL,
  p_member_ids jsonb DEFAULT NULL, p_avatar_url text DEFAULT NULL, p_interests jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_group_chat_id text;
  v_conversation_id text;
  v_member_id text;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_name IS NULL OR p_name = '' THEN RAISE EXCEPTION 'Group name is required' USING ERRCODE = '22023'; END IF;
  IF p_member_ids IS NOT NULL AND (jsonb_typeof(p_member_ids) <> 'array' OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_member_ids) AS item(value)
    WHERE jsonb_typeof(item.value) <> 'string' OR item.value #>> '{}' = '')) THEN
    RAISE EXCEPTION 'Member IDs must be an array of user IDs' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(coalesce(p_member_ids, '[]'::jsonb)) AS member(user_id)
    LEFT JOIN public."users" u ON u."_id" = member.user_id WHERE u."_id" IS NULL) THEN
    RAISE EXCEPTION 'One or more group members do not exist' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public."groupChats" ("_id", "name", "description", "creatorId", "memberIds", "avatarUrl", "interests", "createdAt", "updatedAt")
  VALUES (
    'gc_' || gen_random_uuid()::text, p_name, p_description, p_caller_id,
    jsonb_build_array(p_caller_id) || coalesce((
      SELECT jsonb_agg(member.user_id ORDER BY member.ordinality)
      FROM (SELECT DISTINCT ON (user_id) user_id, ordinality
        FROM jsonb_array_elements_text(coalesce(p_member_ids, '[]'::jsonb)) WITH ORDINALITY AS x(user_id, ordinality)
        WHERE user_id <> p_caller_id ORDER BY user_id, ordinality) member
    ), '[]'::jsonb),
    p_avatar_url, coalesce(p_interests, '[]'::jsonb),
    extract(epoch FROM clock_timestamp()) * 1000, extract(epoch FROM clock_timestamp()) * 1000
  ) RETURNING "_id" INTO v_group_chat_id;
  INSERT INTO public."groupMembers" ("_id", "groupId", "userId", "role", "joinedAt")
  VALUES ('gm_' || gen_random_uuid()::text, v_group_chat_id, p_caller_id, 'owner', extract(epoch FROM clock_timestamp()) * 1000);
  FOR v_member_id IN
    SELECT user_id FROM (SELECT DISTINCT ON (user_id) user_id, ordinality
      FROM jsonb_array_elements_text(coalesce(p_member_ids, '[]'::jsonb)) WITH ORDINALITY AS x(user_id, ordinality)
      WHERE user_id <> p_caller_id ORDER BY user_id, ordinality) members ORDER BY ordinality
  LOOP
    INSERT INTO public."groupMembers" ("_id", "groupId", "userId", "role", "joinedAt")
    VALUES ('gm_' || gen_random_uuid()::text, v_group_chat_id, v_member_id, 'member', extract(epoch FROM clock_timestamp()) * 1000);
  END LOOP;
  INSERT INTO public."conversations" ("_id", "userA", "groupChatId", "updatedAt")
  VALUES ('conv_' || gen_random_uuid()::text, p_caller_id, v_group_chat_id, extract(epoch FROM clock_timestamp()) * 1000)
  RETURNING "_id" INTO v_conversation_id;
  RETURN jsonb_build_object('groupChatId', v_group_chat_id, 'conversationId', v_conversation_id);
END;
$function$;

-- History authorization now recognizes the same JSON and relational memberships as send_lalao_message.
CREATE OR REPLACE FUNCTION public.get_lalao_conversation_messages(
  p_caller_id text, p_conversation_id text, p_limit integer DEFAULT 50,
  p_cursor_created_at double precision DEFAULT NULL, p_cursor_message_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  result jsonb;
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_conversation_id IS NULL OR p_conversation_id = '' THEN RAISE EXCEPTION 'Conversation ID is required' USING ERRCODE = '22023'; END IF;
  IF (p_cursor_created_at IS NULL) <> (p_cursor_message_id IS NULL) THEN RAISE EXCEPTION 'Both cursor values are required together' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public."conversations" c WHERE c."_id" = p_conversation_id AND (
      c."userA" = p_caller_id OR c."userB" = p_caller_id
      OR (c."groupChatId" IS NOT NULL AND EXISTS (
        SELECT 1 FROM public."groupChats" g WHERE g."_id" = c."groupChatId" AND (
          can_access_lalao_group_chat(p_caller_id, g."creatorId", g."memberIds")
          OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = g."_id" AND gm."userId" = p_caller_id))))
      OR (c."pageB" IS NOT NULL AND EXISTS (SELECT 1 FROM public."pages" p WHERE p."_id" = c."pageB" AND p."ownerId" = p_caller_id))
    )
  ) THEN RAISE EXCEPTION 'Conversation not found or not authorized' USING ERRCODE = 'P0002'; END IF;
  SELECT jsonb_agg(page.message_json ORDER BY page.created_at DESC, page.message_id DESC) INTO result
  FROM (
    SELECT m."createdAt" AS created_at, m."_id" AS message_id, jsonb_build_object(
      'id', m."_id", 'conversationId', m."conversationId", 'senderId', m."senderId", 'pageSenderId', m."pageSenderId",
      'text', m."text", 'isRead', m."isRead", 'readAt', m."readAt", 'replyToMessageId', m."replyToMessageId",
      'type', m."type", 'callId', m."callId", 'callType', m."callType", 'callDuration', m."callDuration",
      'callStatus', m."callStatus", 'mediaStorageId', m."mediaStorageId", 'mimeType', m."mimeType", 'fileName', m."fileName",
      'fileSize', m."fileSize", 'audioStorageId', m."audioStorageId", 'audioDuration', m."audioDuration",
      'viewOnce', m."viewOnce", 'viewOnceOpened', m."viewOnceOpened", 'viewedAt', m."viewedAt", 'createdAt', m."createdAt"
    ) AS message_json
    FROM public."messages" m WHERE m."conversationId" = p_conversation_id AND (
      p_cursor_created_at IS NULL OR m."createdAt" < p_cursor_created_at
      OR (m."createdAt" = p_cursor_created_at AND m."_id" < p_cursor_message_id))
    ORDER BY m."createdAt" DESC, m."_id" DESC LIMIT v_limit
  ) page;
  RETURN coalesce(result, '[]'::jsonb);
END;
$function$;

-- The existing Outbox is the transactional notification handoff. Extend its category
-- constraint for messages and write one notification/outbox item per distinct recipient.
DO $constraint$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT c.conname INTO v_constraint_name
  FROM pg_catalog.pg_constraint c
  WHERE c.conrelid = 'public."notificationOutbox"'::regclass
    AND c.contype = 'c'
    AND c.conkey = ARRAY[(SELECT a.attnum FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = c.conrelid AND a.attname = 'category' AND NOT a.attisdropped)]::smallint[];
  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public."notificationOutbox" DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END;
$constraint$;
ALTER TABLE public."notificationOutbox" ADD CONSTRAINT "ck_notification_outbox_category"
  CHECK ("category" IN ('likes', 'comments', 'messages'));

-- The sending RPC is replaced below to preserve its existing checks and insert path,
-- with only message notification/outbox enqueueing added after the message insert.
CREATE OR REPLACE FUNCTION public.send_lalao_message(
  p_caller_id text, p_conversation_id text, p_text text, p_page_sender_id text DEFAULT NULL,
  p_reply_to_message_id text DEFAULT NULL, p_type text DEFAULT 'text', p_media_storage_id text DEFAULT NULL,
  p_mime_type text DEFAULT NULL, p_file_name text DEFAULT NULL, p_file_size double precision DEFAULT NULL,
  p_audio_storage_id text DEFAULT NULL, p_audio_duration double precision DEFAULT NULL, p_view_once boolean DEFAULT FALSE
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_conversation public.conversations%ROWTYPE;
  v_message_id text;
  v_recipient_id text;
  v_notice_recipient_id text;
  v_sender_name text;
  v_sender_avatar text;
  v_notification_id text;
  v_outbox_id text;
  v_recipient_prefs jsonb;
  v_outbox_status text;
  v_preview text;
  v_title text;
  v_now double precision;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF p_conversation_id IS NULL OR p_conversation_id = '' THEN RAISE EXCEPTION 'Conversation ID is required' USING ERRCODE = '22023'; END IF;
  IF p_text IS NULL AND p_media_storage_id IS NULL THEN RAISE EXCEPTION 'Message text or media is required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_conversation FROM public."conversations" WHERE "_id" = p_conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found' USING ERRCODE = 'P0002'; END IF;
  IF v_conversation."pageB" IS NULL AND p_page_sender_id IS NOT NULL THEN RAISE EXCEPTION 'Cannot send as a page in this conversation' USING ERRCODE = '42501'; END IF;
  IF v_conversation."groupChatId" IS NOT NULL THEN
    IF NOT (can_access_lalao_group_chat(p_caller_id,
      (SELECT "creatorId" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId"),
      (SELECT "memberIds" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId"))
      OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = v_conversation."groupChatId" AND gm."userId" = p_caller_id)) THEN
      RAISE EXCEPTION 'Not authorized to send to this conversation' USING ERRCODE = '42501';
    END IF;
  ELSIF v_conversation."pageB" IS NOT NULL THEN
    IF v_conversation."userA" <> p_caller_id AND NOT EXISTS (SELECT 1 FROM public."pages" p WHERE p."_id" = v_conversation."pageB" AND p."ownerId" = p_caller_id) THEN RAISE EXCEPTION 'Not authorized to send to this conversation' USING ERRCODE = '42501'; END IF;
  ELSIF v_conversation."userA" <> p_caller_id AND v_conversation."userB" <> p_caller_id THEN
    RAISE EXCEPTION 'Not authorized to send to this conversation' USING ERRCODE = '42501';
  END IF;
  IF v_conversation."pageB" IS NOT NULL THEN
    IF p_page_sender_id IS NOT NULL AND (p_page_sender_id <> v_conversation."pageB" OR NOT EXISTS (SELECT 1 FROM public."pages" p WHERE p."_id" = v_conversation."pageB" AND p."ownerId" = p_caller_id)) THEN RAISE EXCEPTION 'Not authorized to send as this page' USING ERRCODE = '42501'; END IF;
    IF EXISTS (SELECT 1 FROM public."pages" p WHERE p."_id" = v_conversation."pageB" AND p."ownerId" = p_caller_id) THEN
      v_recipient_id := v_conversation."userA";
    ELSE
      SELECT p."ownerId" INTO v_recipient_id FROM public."pages" p WHERE p."_id" = v_conversation."pageB";
    END IF;
  ELSIF v_conversation."groupChatId" IS NULL THEN
    v_recipient_id := CASE WHEN v_conversation."userA" = p_caller_id THEN v_conversation."userB" ELSE v_conversation."userA" END;
  END IF;
  INSERT INTO public."messages" (
    "_id", "conversationId", "senderId", "pageSenderId", "text", "isRead", "replyToMessageId", "type",
    "mediaStorageId", "mimeType", "fileName", "fileSize", "audioStorageId", "audioDuration", "viewOnce", "createdAt"
  ) VALUES (
    'msg_' || gen_random_uuid()::text, p_conversation_id, p_caller_id, p_page_sender_id, p_text, false,
    p_reply_to_message_id, p_type, p_media_storage_id, p_mime_type, p_file_name, p_file_size,
    p_audio_storage_id, p_audio_duration, p_view_once, extract(epoch FROM clock_timestamp()) * 1000
  ) RETURNING "_id" INTO v_message_id;
  UPDATE public."conversations" SET "updatedAt" = extract(epoch FROM clock_timestamp()) * 1000 WHERE "_id" = p_conversation_id;

  SELECT "name", coalesce("avatarUrl", '') INTO v_sender_name, v_sender_avatar FROM public."users" WHERE "_id" = p_caller_id;
  IF p_page_sender_id IS NOT NULL THEN SELECT "name", coalesce("avatar", '') INTO v_sender_name, v_sender_avatar FROM public."pages" WHERE "_id" = p_page_sender_id; END IF;
  v_preview := left(btrim(coalesce(p_text, CASE WHEN p_type = 'image' THEN 'shared a photo' WHEN p_type = 'video' THEN 'shared a video' ELSE 'sent an attachment' END)), 100);
  v_title := CASE WHEN v_conversation."groupChatId" IS NOT NULL THEN 'New message in group' ELSE 'New message from ' || coalesce(v_sender_name, 'Someone') END;
  FOR v_notice_recipient_id IN
    SELECT DISTINCT recipient_id FROM (
      SELECT v_recipient_id AS recipient_id WHERE v_conversation."groupChatId" IS NULL
      UNION ALL
      SELECT member_id FROM public."groupChats" g CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(g."memberIds", '[]'::jsonb)) AS member(member_id)
       WHERE g."_id" = v_conversation."groupChatId" AND v_conversation."groupChatId" IS NOT NULL
      UNION ALL
      SELECT g."creatorId" FROM public."groupChats" g
       WHERE g."_id" = v_conversation."groupChatId" AND v_conversation."groupChatId" IS NOT NULL
      UNION ALL
      SELECT gm."userId" FROM public."groupMembers" gm WHERE gm."groupId" = v_conversation."groupChatId" AND v_conversation."groupChatId" IS NOT NULL
    ) recipients WHERE recipient_id IS NOT NULL AND recipient_id <> p_caller_id
  LOOP
    v_notification_id := 'notification_' || gen_random_uuid()::text;
    v_outbox_id := 'outbox_' || gen_random_uuid()::text;
    v_now := extract(epoch FROM clock_timestamp()) * 1000;
    INSERT INTO public."notifications" ("_id", "recipientId", "actorId", "type", "conversationId", "messageId", "targetExcerpt", "isRead", "createdAt")
    VALUES (v_notification_id, v_notice_recipient_id, p_caller_id, 'message', p_conversation_id, v_message_id, v_preview, false, v_now);
    SELECT "notificationPrefs" INTO v_recipient_prefs FROM public."users" WHERE "_id" = v_notice_recipient_id;
    v_outbox_status := CASE WHEN v_recipient_prefs->>'desktop' = 'false' OR v_recipient_prefs->>'messages' = 'false' THEN 'suppressed' ELSE 'pending' END;
    INSERT INTO public."notificationOutbox" ("_id", "notificationId", "recipientId", "category", "payload", "status", "attemptCount", "availableAt", "createdAt", "updatedAt")
    VALUES (v_outbox_id, v_notification_id, v_notice_recipient_id, 'messages',
      jsonb_strip_nulls(jsonb_build_object('title', v_title, 'body', v_preview, 'url', '/app?chat=' || p_conversation_id,
        'tag', 'msg-' || v_message_id, 'conversationId', p_conversation_id, 'messageId', v_message_id,
        'icon', CASE WHEN v_sender_avatar LIKE 'https://%' THEN v_sender_avatar ELSE NULL END)),
      v_outbox_status, 0, v_now, v_now, v_now);
  END LOOP;
  RETURN v_message_id;
END;
$function$;

-- Conversation listing needs no session-scoped temp table; preserve the same access
-- union and explicit updatedAt order while selecting each conversation once.
CREATE OR REPLACE FUNCTION public.get_lalao_conversations(p_caller_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE result jsonb;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', c."_id", 'userA', c."userA", 'userB', c."userB", 'pageB', c."pageB", 'groupChatId', c."groupChatId", 'updatedAt', c."updatedAt", 'createdAt', c."_creationTime") ORDER BY c."updatedAt" DESC), '[]'::jsonb)
  INTO result FROM public."conversations" c
  WHERE c."userA" = p_caller_id OR c."userB" = p_caller_id
    OR (c."groupChatId" IS NOT NULL AND EXISTS (SELECT 1 FROM public."groupChats" g WHERE g."_id" = c."groupChatId" AND (g."creatorId" = p_caller_id OR can_access_lalao_group_chat(p_caller_id, g."creatorId", g."memberIds") OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = g."_id" AND gm."userId" = p_caller_id))))
    OR (c."pageB" IS NOT NULL AND EXISTS (SELECT 1 FROM public."pages" p WHERE p."_id" = c."pageB" AND p."ownerId" = p_caller_id));
  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_lalao_conversation(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_lalao_page_conversation(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lalao_group_chat(text, text, text, jsonb, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_lalao_conversation_messages(text, text, integer, double precision, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_lalao_message(text, text, text, text, text, text, text, text, text, double precision, text, double precision, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_lalao_conversations(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_lalao_conversation(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_lalao_page_conversation(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_lalao_group_chat(text, text, text, jsonb, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_lalao_conversation_messages(text, text, integer, double precision, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.send_lalao_message(text, text, text, text, text, text, text, text, text, double precision, text, double precision, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_lalao_conversations(text) TO service_role;

COMMIT;
