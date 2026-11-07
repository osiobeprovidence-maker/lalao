-- ============================================================================
-- Lalao Feed & Social — Chat / Conversation RPCs
--
-- Adds server-side RPCs for conversation list, creation, messaging, and
-- read-state operations. All functions are SECURITY DEFINER with a fixed
-- search path and are executable only by service_role. Caller identity is
-- resolved by the app-social Edge Function (never client-supplied).
--
-- Forward-only: previously applied migrations are not edited.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: check if a caller can access a group chat (creator or member)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_lalao_group_chat(
  p_caller_id text,
  p_creator_id text,
  p_member_ids jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_caller_id IS NULL OR p_creator_id IS NULL OR p_member_ids IS NULL THEN
    RETURN false;
  END IF;

  IF p_caller_id = p_creator_id THEN
    RETURN true;
  END IF;

  IF jsonb_typeof(p_member_ids) = 'array' THEN
    RETURN EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(p_member_ids) AS elem(value)
      WHERE elem.value = p_caller_id
    );
  END IF;

  RETURN false;
END;
$$;

-- ---------------------------------------------------------------------------
-- Get or create a one-to-one conversation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_lalao_conversation(
  p_caller_id text,
  p_other_user_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_conv_id text;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_other_user_id IS NULL OR p_other_user_id = '' THEN
    RAISE EXCEPTION 'Other user ID is required' USING ERRCODE = '22023';
  END IF;
  IF p_caller_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_other_user_id) THEN
    RAISE EXCEPTION 'Other user not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check if conversation already exists (userA = viewer, userB = target)
  SELECT "_id" INTO v_conv_id
  FROM public."conversations"
  WHERE "userA" = p_caller_id
    AND "userB" = p_other_user_id
    AND "pageB" IS NULL
    AND "groupChatId" IS NULL;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Check reverse direction (userA = target, userB = viewer)
  SELECT "_id" INTO v_conv_id
  FROM public."conversations"
  WHERE "userA" = p_other_user_id
    AND "userB" = p_caller_id
    AND "pageB" IS NULL
    AND "groupChatId" IS NULL;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO public."conversations" (
    "_id", "userA", "userB", "updatedAt"
  ) VALUES (
    'conv_' || gen_random_uuid()::text,
    p_caller_id,
    p_other_user_id,
    extract(epoch FROM clock_timestamp()) * 1000
  ) RETURNING "_id" INTO v_conv_id;

  RETURN v_conv_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- List conversations for the current user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_lalao_conversations(
  p_caller_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Collect conversation IDs the user participates in
  CREATE TEMP TABLE IF NOT EXISTS temp_conv_ids (conv_id text PRIMARY KEY) ON COMMIT DROP;
  TRUNCATE temp_conv_ids;

  INSERT INTO temp_conv_ids (conv_id)
    SELECT "_id" FROM public."conversations" WHERE "userA" = p_caller_id;

  INSERT INTO temp_conv_ids (conv_id)
    SELECT "_id" FROM public."conversations" WHERE "userB" = p_caller_id;

  INSERT INTO temp_conv_ids (conv_id)
    SELECT "_id" FROM public."conversations" WHERE "userA" = p_caller_id
    ON CONFLICT DO NOTHING;

  INSERT INTO temp_conv_ids (conv_id)
    SELECT c."_id"
    FROM public."conversations" c
    JOIN public."groupChats" g ON g."_id" = c."groupChatId"
    WHERE g."creatorId" = p_caller_id
       OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = g."_id" AND gm."userId" = p_caller_id)
       OR can_access_lalao_group_chat(p_caller_id, g."creatorId", g."memberIds")
    ON CONFLICT DO NOTHING;

  INSERT INTO temp_conv_ids (conv_id)
    SELECT c."_id"
    FROM public."conversations" c
    JOIN public."pages" p ON p."_id" = c."pageB"
    WHERE p."ownerId" = p_caller_id
    ON CONFLICT DO NOTHING;

  -- Build result
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c."_id",
      'userA', c."userA",
      'userB', c."userB",
      'pageB', c."pageB",
      'groupChatId', c."groupChatId",
      'updatedAt', c."updatedAt",
      'createdAt', c."_creationTime"
    ) ORDER BY c."updatedAt" DESC
  ) INTO result
  FROM public."conversations" c
  WHERE c."_id" IN (SELECT conv_id FROM temp_conv_ids);

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ---------------------------------------------------------------------------
-- List messages in a conversation (paginated)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_lalao_conversation_messages(
  p_caller_id text,
  p_conversation_id text,
  p_limit integer DEFAULT 50,
  p_cursor_created_at double precision DEFAULT NULL,
  p_cursor_message_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_conversation_id IS NULL OR p_conversation_id = '' THEN
    RAISE EXCEPTION 'Conversation ID is required' USING ERRCODE = '22023';
  END IF;
  IF (p_cursor_created_at IS NULL) <> (p_cursor_message_id IS NULL) THEN
    RAISE EXCEPTION 'Both cursor values are required together' USING ERRCODE = '22023';
  END IF;

  -- Verify access to conversation
  IF NOT EXISTS (
    SELECT 1 FROM public."conversations"
    WHERE "_id" = p_conversation_id
      AND (
        "userA" = p_caller_id OR "userB" = p_caller_id
        OR ("groupChatId" IS NOT NULL AND EXISTS (
          SELECT 1 FROM public."groupChats" g
          WHERE g."_id" = "conversations"."groupChatId"
            AND can_access_lalao_group_chat(p_caller_id, g."creatorId", g."memberIds")
        ))
        OR ("pageB" IS NOT NULL AND EXISTS (
          SELECT 1 FROM public."pages" p WHERE p."_id" = "conversations"."pageB" AND p."ownerId" = p_caller_id
        ))
      )
  ) THEN
    RAISE EXCEPTION 'Conversation not found or not authorized' USING ERRCODE = 'P0002';
  END IF;

  SELECT jsonb_agg(page.message_json ORDER BY page.created_at DESC, page.message_id DESC)
  INTO result
  FROM (
    SELECT m."createdAt" AS created_at, m."_id" AS message_id, jsonb_build_object(
      'id', m."_id",
      'conversationId', m."conversationId",
      'senderId', m."senderId",
      'pageSenderId', m."pageSenderId",
      'text', m."text",
      'isRead', m."isRead",
      'readAt', m."readAt",
      'replyToMessageId', m."replyToMessageId",
      'type', m."type",
      'callId', m."callId",
      'callType', m."callType",
      'callDuration', m."callDuration",
      'callStatus', m."callStatus",
      'mediaStorageId', m."mediaStorageId",
      'mimeType', m."mimeType",
      'fileName', m."fileName",
      'fileSize', m."fileSize",
      'audioStorageId', m."audioStorageId",
      'audioDuration', m."audioDuration",
      'viewOnce', m."viewOnce",
      'viewOnceOpened', m."viewOnceOpened",
      'viewedAt', m."viewedAt",
      'createdAt', m."createdAt"
    ) AS message_json
    FROM public."messages" m
    WHERE m."conversationId" = p_conversation_id
      AND (
        p_cursor_created_at IS NULL
        OR m."createdAt" < p_cursor_created_at
        OR (m."createdAt" = p_cursor_created_at AND m."_id" < p_cursor_message_id)
      )
    ORDER BY m."createdAt" DESC, m."_id" DESC
    LIMIT v_limit
  ) page;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ---------------------------------------------------------------------------
-- Send a message
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_lalao_message(
  p_caller_id text,
  p_conversation_id text,
  p_text text,
  p_page_sender_id text DEFAULT NULL,
  p_reply_to_message_id text DEFAULT NULL,
  p_type text DEFAULT 'text',
  p_media_storage_id text DEFAULT NULL,
  p_mime_type text DEFAULT NULL,
  p_file_name text DEFAULT NULL,
  p_file_size double precision DEFAULT NULL,
  p_audio_storage_id text DEFAULT NULL,
  p_audio_duration double precision DEFAULT NULL,
  p_view_once boolean DEFAULT FALSE
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_conversation public.conversations%ROWTYPE;
  v_message_id text;
  v_recipient_id text;
  v_sender_name text;
  v_sender_avatar text;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_conversation_id IS NULL OR p_conversation_id = '' THEN
    RAISE EXCEPTION 'Conversation ID is required' USING ERRCODE = '22023';
  END IF;
  IF p_text IS NULL AND p_media_storage_id IS NULL THEN
    RAISE EXCEPTION 'Message text or media is required' USING ERRCODE = '22023';
  END IF;

  -- Fetch conversation
  SELECT * INTO v_conversation
  FROM public."conversations"
  WHERE "_id" = p_conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_conversation."pageB" IS NULL AND p_page_sender_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot send as a page in this conversation' USING ERRCODE = '42501';
  END IF;

  -- Authorization check
  IF v_conversation."groupChatId" IS NOT NULL THEN
    -- Group chat: check membership
    IF NOT (
      can_access_lalao_group_chat(
      p_caller_id,
      (SELECT "creatorId" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId"),
      (SELECT "memberIds" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId")
      ) OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = v_conversation."groupChatId" AND gm."userId" = p_caller_id)
    ) THEN
      RAISE EXCEPTION 'Not authorized to send to this conversation' USING ERRCODE = '42501';
    END IF;
  ELSIF v_conversation."pageB" IS NOT NULL THEN
    IF v_conversation."userA" <> p_caller_id AND NOT EXISTS (
      SELECT 1 FROM public."pages" p WHERE p."_id" = v_conversation."pageB" AND p."ownerId" = p_caller_id
    ) THEN
      RAISE EXCEPTION 'Not authorized to send to this conversation' USING ERRCODE = '42501';
    END IF;
  ELSIF v_conversation."userA" = p_caller_id OR v_conversation."userB" = p_caller_id THEN
      NULL;
  ELSE
    RAISE EXCEPTION 'Not authorized to send to this conversation' USING ERRCODE = '42501';
  END IF;

  -- Determine recipient
  IF v_conversation."pageB" IS NOT NULL THEN
    -- Page conversation
    IF p_page_sender_id IS NOT NULL AND (
      p_page_sender_id <> v_conversation."pageB"
      OR NOT EXISTS (SELECT 1 FROM public."pages" p WHERE p."_id" = v_conversation."pageB" AND p."ownerId" = p_caller_id)
    ) THEN
      RAISE EXCEPTION 'Not authorized to send as this page' USING ERRCODE = '42501';
    END IF;
    IF p_page_sender_id IS NULL AND v_conversation."userA" <> p_caller_id THEN
      RAISE EXCEPTION 'Not authorized to send in this page conversation' USING ERRCODE = '42501';
    END IF;
    SELECT "userA" INTO v_recipient_id FROM public."conversations" WHERE "_id" = p_conversation_id;
  ELSE
    -- Direct conversation
    IF v_conversation."userA" = p_caller_id THEN
      v_recipient_id := v_conversation."userB";
    ELSE
      v_recipient_id := v_conversation."userA";
    END IF;
  END IF;

  -- Insert message
  INSERT INTO public."messages" (
    "_id", "conversationId", "senderId", "pageSenderId", "text",
    "isRead", "replyToMessageId", "type", "mediaStorageId", "mimeType",
    "fileName", "fileSize", "audioStorageId", "audioDuration", "viewOnce",
    "createdAt"
  ) VALUES (
    'msg_' || gen_random_uuid()::text,
    p_conversation_id,
    p_caller_id,
    p_page_sender_id,
    p_text,
    false,
    p_reply_to_message_id,
    p_type,
    p_media_storage_id,
    p_mime_type,
    p_file_name,
    p_file_size,
    p_audio_storage_id,
    p_audio_duration,
    p_view_once,
    extract(epoch FROM clock_timestamp()) * 1000
  ) RETURNING "_id" INTO v_message_id;

  -- Update conversation updatedAt
  UPDATE public."conversations"
  SET "updatedAt" = extract(epoch FROM clock_timestamp()) * 1000
  WHERE "_id" = p_conversation_id;

  RETURN v_message_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Edit a message (sender only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.edit_lalao_message(
  p_caller_id text,
  p_message_id text,
  p_text text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_message public.messages%ROWTYPE;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_message_id IS NULL OR p_message_id = '' THEN
    RAISE EXCEPTION 'Message ID is required' USING ERRCODE = '22023';
  END IF;
  IF p_text IS NULL OR p_text = '' THEN
    RAISE EXCEPTION 'Text is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_message
  FROM public."messages"
  WHERE "_id" = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_message."senderId" <> p_caller_id THEN
    RAISE EXCEPTION 'Not authorized to edit this message' USING ERRCODE = '42501';
  END IF;

  UPDATE public."messages"
  SET "text" = p_text, "isEdited" = true
  WHERE "_id" = p_message_id;

  RETURN p_message_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Delete a message (sender only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_lalao_message(
  p_caller_id text,
  p_message_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_message public.messages%ROWTYPE;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_message_id IS NULL OR p_message_id = '' THEN
    RAISE EXCEPTION 'Message ID is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_message
  FROM public."messages"
  WHERE "_id" = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_message."senderId" <> p_caller_id THEN
    RAISE EXCEPTION 'Not authorized to delete this message' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public."messages"
  WHERE "_id" = p_message_id;

  RETURN p_message_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Mark conversation as read
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_lalao_conversation_read(
  p_caller_id text,
  p_conversation_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_conversation public.conversations%ROWTYPE;
  v_is_group_member boolean := false;
  v_is_manager boolean := false;
  v_am_i_user_a boolean := false;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_conversation_id IS NULL OR p_conversation_id = '' THEN
    RAISE EXCEPTION 'Conversation ID is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_conversation
  FROM public."conversations"
  WHERE "_id" = p_conversation_id;

  IF NOT FOUND THEN
    RETURN p_conversation_id;
  END IF;

  v_am_i_user_a := (v_conversation."userA" = p_caller_id);

  -- Check authorization
  IF v_conversation."groupChatId" IS NOT NULL THEN
    IF NOT (
      can_access_lalao_group_chat(
      p_caller_id,
      (SELECT "creatorId" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId"),
      (SELECT "memberIds" FROM public."groupChats" WHERE "_id" = v_conversation."groupChatId")
      ) OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = v_conversation."groupChatId" AND gm."userId" = p_caller_id)
    ) THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
    v_is_group_member := true;
  ELSIF v_conversation."pageB" IS NOT NULL THEN
    -- Page conversation: page owner is manager
    SELECT EXISTS (SELECT 1 FROM public."pages" WHERE "_id" = v_conversation."pageB" AND "ownerId" = p_caller_id)
      INTO v_is_manager;
    IF v_is_manager AND v_conversation."userA" <> p_caller_id THEN
      -- Page owner reading as manager
      NULL;
    ELSIF v_conversation."userA" <> p_caller_id AND v_conversation."userB" <> p_caller_id THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
  ELSIF v_conversation."userA" <> p_caller_id AND v_conversation."userB" <> p_caller_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- Mark unread messages as read
  UPDATE public."messages"
  SET "isRead" = true, "readAt" = extract(epoch FROM clock_timestamp()) * 1000
  WHERE "conversationId" = p_conversation_id
    AND "isRead" = false
    AND CASE
      WHEN v_is_manager AND NOT v_am_i_user_a THEN "pageSenderId" IS NOT NULL
      ELSE "pageSenderId" IS NOT NULL OR "senderId" <> p_caller_id
    END;

  RETURN p_conversation_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Create a group chat
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_lalao_group_chat(
  p_caller_id text,
  p_name text,
  p_description text DEFAULT NULL,
  p_member_ids jsonb DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_interests jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_group_chat_id text;
  v_conversation_id text;
  v_member_id text;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Group name is required' USING ERRCODE = '22023';
  END IF;

  IF p_member_ids IS NOT NULL AND (
    jsonb_typeof(p_member_ids) <> 'array'
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_member_ids) AS item(value)
               WHERE jsonb_typeof(item.value) <> 'string' OR item.value #>> '{}' = '')
  ) THEN
    RAISE EXCEPTION 'Member IDs must be an array of user IDs' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(coalesce(p_member_ids, '[]'::jsonb)) AS member(user_id)
    LEFT JOIN public."users" u ON u."_id" = member.user_id
    WHERE u."_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more group members do not exist' USING ERRCODE = '22023';
  END IF;

  -- Build member list: creator + additional members
  INSERT INTO public."groupChats" (
    "_id", "name", "description", "creatorId", "memberIds", "avatarUrl",
    "interests", "createdAt", "updatedAt"
  ) VALUES (
    'gc_' || gen_random_uuid()::text,
    p_name,
    p_description,
    p_caller_id,
    (SELECT coalesce(jsonb_agg(member.user_id), '[]'::jsonb)
     FROM (SELECT DISTINCT user_id
           FROM jsonb_array_elements_text(coalesce(p_member_ids, '[]'::jsonb)) AS x(user_id)
           WHERE user_id <> p_caller_id ORDER BY user_id) member),
    p_avatar_url,
    COALESCE(p_interests, '[]'::jsonb),
    extract(epoch FROM clock_timestamp()) * 1000,
    extract(epoch FROM clock_timestamp()) * 1000
  ) RETURNING "_id" INTO v_group_chat_id;

  -- Add creator as owner
  INSERT INTO public."groupMembers" (
    "_id", "groupId", "userId", "role", "joinedAt"
  ) VALUES (
    'gm_' || gen_random_uuid()::text,
    v_group_chat_id,
    p_caller_id,
    'owner',
    extract(epoch FROM clock_timestamp()) * 1000
  );

  -- Add additional members
  IF p_member_ids IS NOT NULL AND jsonb_typeof(p_member_ids) = 'array' THEN
    FOR v_member_id IN SELECT elem.value FROM jsonb_array_elements_text(p_member_ids) AS elem(value)
    LOOP
      IF v_member_id <> p_caller_id THEN
        INSERT INTO public."groupMembers" (
          "_id", "groupId", "userId", "role", "joinedAt"
        ) VALUES (
          'gm_' || gen_random_uuid()::text,
          v_group_chat_id,
          v_member_id,
          'member',
          extract(epoch FROM clock_timestamp()) * 1000
        );
      END IF;
    END LOOP;
  END IF;

  -- Create conversation linked to group chat
  INSERT INTO public."conversations" (
    "_id", "userA", "groupChatId", "updatedAt"
  ) VALUES (
    'conv_' || gen_random_uuid()::text,
    p_caller_id,
    v_group_chat_id,
    extract(epoch FROM clock_timestamp()) * 1000
  ) RETURNING "_id" INTO v_conversation_id;

  RETURN jsonb_build_object(
    'groupChatId', v_group_chat_id,
    'conversationId', v_conversation_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Invite user to group chat
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invite_lalao_to_group_chat(
  p_caller_id text,
  p_group_chat_id text,
  p_user_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_group_chat public."groupChats"%ROWTYPE;
  v_norm_user_id text;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_group_chat_id IS NULL OR p_group_chat_id = '' THEN
    RAISE EXCEPTION 'Group chat ID is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_group_chat
  FROM public."groupChats"
  WHERE "_id" = p_group_chat_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group chat not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check caller can access group chat
  IF NOT (
    can_access_lalao_group_chat(
    p_caller_id,
    v_group_chat."creatorId",
    v_group_chat."memberIds"
    ) OR EXISTS (SELECT 1 FROM public."groupMembers" gm WHERE gm."groupId" = p_group_chat_id AND gm."userId" = p_caller_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to invite members' USING ERRCODE = '42501';
  END IF;

  -- Normalize target user ID
  SELECT "_id" INTO v_norm_user_id
  FROM public."users"
  WHERE "_id" = p_user_id;

  IF NOT FOUND THEN
    RETURN p_group_chat_id;
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public."groupMembers"
    WHERE "groupId" = p_group_chat_id AND "userId" = v_norm_user_id
  ) THEN
    RETURN p_group_chat_id;
  END IF;

  -- Add member
  INSERT INTO public."groupMembers" (
    "_id", "groupId", "userId", "role", "joinedAt"
  ) VALUES (
    'gm_' || gen_random_uuid()::text,
    p_group_chat_id,
    v_norm_user_id,
    'member',
    extract(epoch FROM clock_timestamp()) * 1000
  );

  -- Update group chat memberIds
  UPDATE public."groupChats"
  SET "memberIds" = coalesce("memberIds", '[]'::jsonb) || jsonb_build_array(v_norm_user_id),
  "updatedAt" = extract(epoch FROM clock_timestamp()) * 1000
  WHERE "_id" = p_group_chat_id;

  RETURN p_group_chat_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Start a page conversation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_lalao_page_conversation(
  p_caller_id text,
  p_page_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_conv_id text;
  v_page public.pages%ROWTYPE;
BEGIN
  IF p_caller_id IS NULL OR p_caller_id = '' OR NOT EXISTS (SELECT 1 FROM public."users" WHERE "_id" = p_caller_id) THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_page_id IS NULL OR p_page_id = '' THEN
    RAISE EXCEPTION 'Page ID is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_page
  FROM public."pages"
  WHERE "_id" = p_page_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_page."type" <> 'business' AND v_page."badge" IS DISTINCT FROM 'BIZ' THEN
    RAISE EXCEPTION 'Messaging is only available for Business pages' USING ERRCODE = '42501';
  END IF;

  IF v_page."ownerId" = p_caller_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with your own page' USING ERRCODE = '22023';
  END IF;

  -- Check if conversation already exists
  SELECT "_id" INTO v_conv_id
  FROM public."conversations"
  WHERE "userA" = p_caller_id
    AND "pageB" = p_page_id
    AND "groupChatId" IS NULL;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO public."conversations" (
    "_id", "userA", "pageB", "updatedAt"
  ) VALUES (
    'conv_' || gen_random_uuid()::text,
    p_caller_id,
    p_page_id,
    extract(epoch FROM clock_timestamp()) * 1000
  ) RETURNING "_id" INTO v_conv_id;

  RETURN v_conv_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.can_access_lalao_group_chat(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lalao_conversation(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_lalao_conversations(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_lalao_conversation_messages(text, text, integer, double precision, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_lalao_message(text, text, text, text, text, text, text, text, text, double precision, text, double precision, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.edit_lalao_message(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_lalao_message(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_lalao_conversation_read(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_lalao_group_chat(text, text, text, jsonb, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.invite_lalao_to_group_chat(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_lalao_page_conversation(text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.can_access_lalao_group_chat(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_lalao_conversation(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_lalao_conversations(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_lalao_conversation_messages(text, text, integer, double precision, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.send_lalao_message(text, text, text, text, text, text, text, text, text, double precision, text, double precision, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.edit_lalao_message(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_lalao_message(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_lalao_conversation_read(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_lalao_group_chat(text, text, text, jsonb, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.invite_lalao_to_group_chat(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_lalao_page_conversation(text, text) TO service_role;

COMMENT ON FUNCTION public.create_lalao_conversation(text, text) IS 'Get or create a one-to-one conversation for the server-resolved caller. Trusted server only.';
COMMENT ON FUNCTION public.get_lalao_conversations(text) IS 'List direct, group-member, and page-owner conversations for the server-resolved caller. Trusted server only.';
COMMENT ON FUNCTION public.get_lalao_conversation_messages(text, text, integer, double precision, text) IS 'List authorized conversation messages using deterministic keyset pagination. Trusted server only.';
COMMENT ON FUNCTION public.send_lalao_message(text, text, text, text, text, text, text, text, text, double precision, text, double precision, boolean) IS 'Send a message for the server-resolved caller. Trusted server only.';
COMMENT ON FUNCTION public.edit_lalao_message(text, text, text) IS 'Edit a message (sender only). Trusted server only.';
COMMENT ON FUNCTION public.delete_lalao_message(text, text) IS 'Delete a message (sender only). Trusted server only.';
COMMENT ON FUNCTION public.mark_lalao_conversation_read(text, text) IS 'Mark authorized conversation messages as read. Trusted server only.';
COMMENT ON FUNCTION public.create_lalao_group_chat(text, text, text, jsonb, text, jsonb) IS 'Create a group chat and linked conversation for the server-resolved caller. Trusted server only.';
COMMENT ON FUNCTION public.invite_lalao_to_group_chat(text, text, text) IS 'Invite a user to a group chat as the server-resolved caller. Trusted server only.';
COMMENT ON FUNCTION public.start_lalao_page_conversation(text, text) IS 'Get or create a business-page conversation for the server-resolved caller. Trusted server only.';
