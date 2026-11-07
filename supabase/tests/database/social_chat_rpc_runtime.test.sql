BEGIN;
SELECT plan(67);

SELECT ok(to_regprocedure('public.create_lalao_conversation(text,text)') IS NOT NULL, 'direct conversation RPC accepts server-resolved caller ID');
SELECT ok(to_regprocedure('public.get_lalao_conversations(text)') IS NOT NULL, 'conversation list RPC accepts server-resolved caller ID');
SELECT ok(to_regprocedure('public.get_lalao_conversation_messages(text,text,integer,double precision,text)') IS NOT NULL, 'message list RPC accepts server-resolved caller and keyset cursor');
SELECT ok(position('CREATE TEMP TABLE' IN pg_get_functiondef('public.get_lalao_conversations(text)'::regprocedure)) = 0, 'conversation listing does not use session-scoped temporary tables');
SELECT ok(to_regprocedure('public.send_lalao_message(text,text,text,text,text,text,text,text,text,double precision,text,double precision,boolean)') IS NOT NULL, 'send message RPC accepts server-resolved caller ID');
SELECT ok(NOT has_function_privilege('anon', 'public.create_lalao_conversation(text,text)', 'EXECUTE') AND NOT has_function_privilege('authenticated', 'public.create_lalao_conversation(text,text)', 'EXECUTE') AND has_function_privilege('service_role', 'public.create_lalao_conversation(text,text)', 'EXECUTE'), 'chat RPCs remain service-role-only');
SELECT ok(
  NOT has_function_privilege('anon', 'public.get_lalao_conversations(text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.get_lalao_conversations(text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.get_lalao_conversations(text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.get_lalao_conversation_messages(text,text,integer,double precision,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.get_lalao_conversation_messages(text,text,integer,double precision,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.get_lalao_conversation_messages(text,text,integer,double precision,text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.send_lalao_message(text,text,text,text,text,text,text,text,text,double precision,text,double precision,boolean)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.send_lalao_message(text,text,text,text,text,text,text,text,text,double precision,text,double precision,boolean)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.send_lalao_message(text,text,text,text,text,text,text,text,text,double precision,text,double precision,boolean)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.create_lalao_group_chat(text,text,text,jsonb,text,jsonb)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.create_lalao_group_chat(text,text,text,jsonb,text,jsonb)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.create_lalao_group_chat(text,text,text,jsonb,text,jsonb)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.start_lalao_page_conversation(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.start_lalao_page_conversation(text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.start_lalao_page_conversation(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.invite_lalao_to_group_chat(text,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.invite_lalao_to_group_chat(text,text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.invite_lalao_to_group_chat(text,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.mark_lalao_conversation_read(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.mark_lalao_conversation_read(text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.mark_lalao_conversation_read(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.edit_lalao_message(text,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.edit_lalao_message(text,text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.edit_lalao_message(text,text,text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.delete_lalao_message(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.delete_lalao_message(text,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.delete_lalao_message(text,text)', 'EXECUTE'),
  'all chat RPCs are service-role-only'
);

INSERT INTO public."users" ("_id", "tokenIdentifier", "name", "username", "onboardingStep", "createdAt", "updatedAt") VALUES
  ('chat-runtime-a', 'synthetic|chat-a', 'A', 'chat_a', 'complete', 1, 1),
  ('chat-runtime-b', 'synthetic|chat-b', 'B', 'chat_b', 'complete', 1, 1),
  ('chat-runtime-c', 'synthetic|chat-c', 'C', 'chat_c', 'complete', 1, 1);

INSERT INTO public."groupChats" ("_id", "name", "creatorId", "memberIds", "interests", "createdAt", "updatedAt")
VALUES ('chat-runtime-group', 'G', 'chat-runtime-a', '["chat-runtime-b"]', '[]', 1, 1);
INSERT INTO public."groupMembers" ("_id", "groupId", "userId", "role", "joinedAt") VALUES
  ('chat-runtime-member-a', 'chat-runtime-group', 'chat-runtime-a', 'owner', 1),
  ('chat-runtime-member-b', 'chat-runtime-group', 'chat-runtime-b', 'member', 1);
INSERT INTO public."conversations" ("_id", "userA", "groupChatId", "updatedAt") VALUES ('chat-runtime-group-conv', 'chat-runtime-a', 'chat-runtime-group', 1);
INSERT INTO public."messages" ("_id", "conversationId", "senderId", "text", "createdAt", "isRead") VALUES
  ('chat-runtime-m1', 'chat-runtime-group-conv', 'chat-runtime-a', 'one', 10, false),
  ('chat-runtime-m2', 'chat-runtime-group-conv', 'chat-runtime-a', 'two', 10, false),
  ('chat-runtime-m3', 'chat-runtime-group-conv', 'chat-runtime-a', 'three', 9, false);

SELECT ok((SELECT count(*) = 1 FROM jsonb_array_elements(public.get_lalao_conversations('chat-runtime-b')) WHERE value->>'id' = 'chat-runtime-group-conv'), 'group member sees group conversation');
SELECT is(jsonb_array_length(public.get_lalao_conversation_messages('chat-runtime-b', 'chat-runtime-group-conv', 2, NULL, NULL)), 2, 'group member retrieves only requested page size');
SELECT ok(
  (public.get_lalao_conversation_messages('chat-runtime-b', 'chat-runtime-group-conv', 2, NULL, NULL)->0->>'id') = 'chat-runtime-m2',
  'pagination orders equal timestamps by message ID descending'
);
SELECT is(
  (public.get_lalao_conversation_messages('chat-runtime-b', 'chat-runtime-group-conv', 2, 10, 'chat-runtime-m2')->0->>'id'),
  'chat-runtime-m1',
  'cursor boundary returns the remaining equal-timestamp message without duplication'
);
SELECT throws_ok($$SELECT public.get_lalao_conversation_messages('chat-runtime-c', 'chat-runtime-group-conv', 2, NULL, NULL)$$, 'P0002', 'Conversation not found or not authorized', 'non-member cannot retrieve group messages');
SELECT lives_ok($$SELECT public.mark_lalao_conversation_read('chat-runtime-b', 'chat-runtime-group-conv')$$, 'group member can mark group conversation read');

SELECT throws_ok($$SELECT public.create_lalao_conversation(NULL, 'chat-runtime-b')$$, '42501', 'Not authenticated', 'missing caller ID is rejected');
SELECT throws_ok($$SELECT public.create_lalao_conversation('not-a-profile', 'chat-runtime-b')$$, '42501', 'Not authenticated', 'unknown caller profile is rejected');
SELECT throws_ok($$SELECT public.create_lalao_group_chat('chat-runtime-a', 'Bad', NULL, '[1]'::jsonb, NULL, NULL)$$, '22023', 'Member IDs must be an array of user IDs', 'non-string group member IDs are rejected');
SELECT throws_ok($$SELECT public.create_lalao_group_chat('chat-runtime-a', 'Bad', NULL, '["missing-user"]'::jsonb, NULL, NULL)$$, '22023', 'One or more group members do not exist', 'unknown group members are rejected');
SELECT lives_ok($$SELECT public.create_lalao_group_chat('chat-runtime-a', 'chat-runtime-dedup', NULL, '["chat-runtime-b","chat-runtime-b","chat-runtime-a","chat-runtime-c","chat-runtime-c"]'::jsonb, NULL, '[]'::jsonb)$$, 'group creation accepts repeated members and creator in input');
SELECT ok((SELECT "memberIds" = '["chat-runtime-a","chat-runtime-b","chat-runtime-c"]'::jsonb FROM public."groupChats" WHERE "name" = 'chat-runtime-dedup'), 'group member IDs are distinct, retain input order, and include creator');
SELECT is((SELECT count(*) FROM public."groupMembers" gm JOIN public."groupChats" g ON g."_id" = gm."groupId" WHERE g."name" = 'chat-runtime-dedup' AND gm."userId" = 'chat-runtime-b'), 1::bigint, 'group creation inserts one relational row per repeated member');
SELECT is((SELECT count(*) FROM public."groupMembers" gm JOIN public."groupChats" g ON g."_id" = gm."groupId" WHERE g."name" = 'chat-runtime-dedup' AND gm."userId" = 'chat-runtime-a'), 1::bigint, 'group creator remains a single relational owner');
SELECT ok(position('direct-conversation:' IN pg_get_functiondef('public.create_lalao_conversation(text,text)'::regprocedure)) > 0, 'direct conversation get-or-create serializes concurrent callers');
SELECT ok(position('page-conversation:' IN pg_get_functiondef('public.start_lalao_page_conversation(text,text)'::regprocedure)) > 0, 'page conversation get-or-create serializes concurrent callers');
SELECT ok(public.create_lalao_conversation('chat-runtime-a', 'chat-runtime-b') = public.create_lalao_conversation('chat-runtime-b', 'chat-runtime-a'), 'direct conversation is reused regardless of caller direction');
SELECT is((SELECT count(*) FROM public."conversations" WHERE "pageB" IS NULL AND "groupChatId" IS NULL AND (("userA" = 'chat-runtime-a' AND "userB" = 'chat-runtime-b') OR ("userA" = 'chat-runtime-b' AND "userB" = 'chat-runtime-a'))), 1::bigint, 'direct get-or-create leaves one conversation');

INSERT INTO public."pages" ("_id", "ownerId", "name", "username", "type", "badge", "location", "followersCount", "createdAt", "updatedAt")
VALUES ('chat-runtime-page', 'chat-runtime-a', 'Business', 'chat_page', 'business', 'BIZ', '', 0, 1, 1);
INSERT INTO public."conversations" ("_id", "userA", "pageB", "updatedAt") VALUES ('chat-runtime-page-conv', 'chat-runtime-b', 'chat-runtime-page', 1);
INSERT INTO public."messages" ("_id", "conversationId", "senderId", "pageSenderId", "text", "createdAt", "isRead") VALUES
  ('chat-runtime-page-incoming', 'chat-runtime-page-conv', 'chat-runtime-b', NULL, 'customer', 2, false),
  ('chat-runtime-page-outgoing', 'chat-runtime-page-conv', 'chat-runtime-a', 'chat-runtime-page', 'page', 3, false);
INSERT INTO public."notifications" ("_id", "recipientId", "actorId", "type", "conversationId", "isRead", "createdAt") VALUES
  ('chat-runtime-notif-own', 'chat-runtime-b', 'chat-runtime-a', 'message', 'chat-runtime-page-conv', false, 1),
  ('chat-runtime-notif-other-recipient', 'chat-runtime-c', 'chat-runtime-b', 'message', 'chat-runtime-page-conv', false, 1),
  ('chat-runtime-notif-other-conversation', 'chat-runtime-b', 'chat-runtime-a', 'message', 'chat-runtime-group-conv', false, 1),
  ('chat-runtime-notif-other-type', 'chat-runtime-b', 'chat-runtime-a', 'follow', 'chat-runtime-page-conv', false, 1);
SELECT ok(public.start_lalao_page_conversation('chat-runtime-b', 'chat-runtime-page') IS NOT NULL, 'eligible business page conversation can be started');
SELECT lives_ok($$SELECT public.send_lalao_message('chat-runtime-a', 'chat-runtime-page-conv', 'as page', 'chat-runtime-page')$$, 'page owner can send as the page');
SELECT lives_ok($$SELECT public.send_lalao_message('chat-runtime-a', 'chat-runtime-page-conv', 'as owner profile')$$, 'page owner retains Convex permission to send without pageSenderId');
SELECT lives_ok($$SELECT public.send_lalao_message('chat-runtime-b', 'chat-runtime-page-conv', 'from customer')$$, 'page conversation participant can send to the page owner');
SELECT throws_ok($$SELECT public.send_lalao_message('chat-runtime-c', 'chat-runtime-page-conv', 'as page', 'chat-runtime-page')$$, '42501', 'Not authorized to send to this conversation', 'non-owner cannot send as the page');
SELECT ok(EXISTS (SELECT 1 FROM public."notifications" WHERE "recipientId" = 'chat-runtime-a' AND "actorId" = 'chat-runtime-b' AND "conversationId" = 'chat-runtime-page-conv' AND "type" = 'message'), 'page participant message notifies the page owner');
SELECT ok(public.start_lalao_page_conversation('chat-runtime-b', 'chat-runtime-page') = public.start_lalao_page_conversation('chat-runtime-b', 'chat-runtime-page'), 'page conversation get-or-create is idempotent');
SELECT is((SELECT count(*) FROM public."conversations" WHERE "userA" = 'chat-runtime-b' AND "pageB" = 'chat-runtime-page' AND "groupChatId" IS NULL), 1::bigint, 'page get-or-create leaves one conversation');
SELECT lives_ok($$SELECT public.mark_lalao_conversation_read('chat-runtime-a', 'chat-runtime-page-conv')$$, 'page owner can mark page messages read');
SELECT ok((SELECT "isRead" FROM public."messages" WHERE "_id" = 'chat-runtime-page-incoming'), 'page owner marks customer-authored message read');
SELECT ok(NOT (SELECT "isRead" FROM public."messages" WHERE "_id" = 'chat-runtime-page-outgoing'), 'page owner does not mark page-authored message read');
UPDATE public."messages" SET "isRead" = false WHERE "conversationId" = 'chat-runtime-page-conv';
SELECT lives_ok($$SELECT public.mark_lalao_conversation_read('chat-runtime-b', 'chat-runtime-page-conv')$$, 'customer can mark page conversation read');
SELECT ok(NOT (SELECT "isRead" FROM public."messages" WHERE "_id" = 'chat-runtime-page-incoming'), 'customer does not mark own customer-authored message read');
SELECT ok((SELECT "isRead" FROM public."messages" WHERE "_id" = 'chat-runtime-page-outgoing'), 'customer marks page-authored message read');
SELECT ok((SELECT "isRead" FROM public."notifications" WHERE "_id" = 'chat-runtime-notif-own'), 'read marks caller message notification read');
SELECT ok(NOT (SELECT "isRead" FROM public."notifications" WHERE "_id" = 'chat-runtime-notif-other-recipient'), 'read leaves another recipient notification unread');
SELECT ok(NOT (SELECT "isRead" FROM public."notifications" WHERE "_id" = 'chat-runtime-notif-other-conversation'), 'read leaves another conversation notification unread');
SELECT ok(NOT (SELECT "isRead" FROM public."notifications" WHERE "_id" = 'chat-runtime-notif-other-type'), 'read leaves non-message notification unread');

SELECT throws_ok($$SELECT public.invite_lalao_to_group_chat(NULL, 'chat-runtime-group', 'chat-runtime-c')$$, '42501', 'Not authenticated', 'missing invitation caller is rejected');
SELECT throws_ok($$SELECT public.invite_lalao_to_group_chat('chat-runtime-c', 'chat-runtime-group', 'chat-runtime-a')$$, '42501', 'Not authorized to invite members', 'non-member cannot invite group users');
SELECT is(public.invite_lalao_to_group_chat('chat-runtime-b', 'chat-runtime-group', 'chat-runtime-c'), 'chat-runtime-group', 'existing group member can invite a valid user');
SELECT is(public.invite_lalao_to_group_chat('chat-runtime-b', 'chat-runtime-group', 'chat-runtime-c'), 'chat-runtime-group', 'repeated invitation is idempotent');
SELECT is((SELECT count(*) FROM public."groupMembers" WHERE "groupId" = 'chat-runtime-group' AND "userId" = 'chat-runtime-c'), 1::bigint, 'repeated invitations leave exactly one relational membership');
SELECT is(public.invite_lalao_to_group_chat('chat-runtime-b', 'chat-runtime-group', 'missing-target'), 'chat-runtime-group', 'missing target preserves the established no-op response');
SELECT ok(NOT EXISTS (SELECT 1 FROM public."groupMembers" WHERE "groupId" = 'chat-runtime-group' AND "userId" = 'missing-target'), 'missing target does not create a membership row');
SELECT ok(EXISTS (SELECT 1 FROM public."groupMembers" WHERE "groupId" = 'chat-runtime-group' AND "userId" = 'chat-runtime-c'), 'invited user is added to group membership records');
SELECT ok((SELECT "memberIds" @> '["chat-runtime-c"]'::jsonb FROM public."groupChats" WHERE "_id" = 'chat-runtime-group'), 'invited user is added to canonical group member IDs');
SELECT is((SELECT count(*) FROM public."groupChats" g CROSS JOIN LATERAL jsonb_array_elements_text(g."memberIds") AS item(member_id) WHERE g."_id" = 'chat-runtime-group' AND item.member_id = 'chat-runtime-c'), 1::bigint, 'canonical member IDs contain the invited user exactly once');
INSERT INTO public."users" ("_id", "tokenIdentifier", "name", "username", "onboardingStep", "createdAt", "updatedAt") VALUES
  ('chat-runtime-d', 'synthetic|chat-d', 'D', 'chat_d', 'complete', 1, 1);
UPDATE public."groupChats" SET "memberIds" = "memberIds" || '["chat-runtime-d"]'::jsonb WHERE "_id" = 'chat-runtime-group';
SELECT is(public.invite_lalao_to_group_chat('chat-runtime-b', 'chat-runtime-group', 'chat-runtime-d'), 'chat-runtime-group', 'invitation repairs missing relational membership');
SELECT ok(EXISTS (SELECT 1 FROM public."groupMembers" WHERE "groupId" = 'chat-runtime-group' AND "userId" = 'chat-runtime-d'), 'JSON member is synchronized to relational membership');
SELECT is((SELECT count(*) FROM public."groupMembers" WHERE "groupId" = 'chat-runtime-group' AND "userId" = 'chat-runtime-d'), 1::bigint, 'repaired relational membership exists exactly once');
DELETE FROM public."groupMembers" WHERE "groupId" = 'chat-runtime-group' AND "userId" = 'chat-runtime-c';
UPDATE public."groupChats" SET "memberIds" = "memberIds" - 'chat-runtime-c' WHERE "_id" = 'chat-runtime-group';
INSERT INTO public."groupMembers" ("_id", "groupId", "userId", "role", "joinedAt") VALUES ('chat-runtime-member-c-repair', 'chat-runtime-group', 'chat-runtime-c', 'member', 1);
SELECT is(public.invite_lalao_to_group_chat('chat-runtime-b', 'chat-runtime-group', 'chat-runtime-c'), 'chat-runtime-group', 'invitation repairs missing canonical member ID');
SELECT ok((SELECT "memberIds" @> '["chat-runtime-c"]'::jsonb FROM public."groupChats" WHERE "_id" = 'chat-runtime-group'), 'relational member is synchronized to canonical JSON');
SELECT is((SELECT count(*) FROM public."groupChats" g CROSS JOIN LATERAL jsonb_array_elements_text(g."memberIds") AS item(member_id) WHERE g."_id" = 'chat-runtime-group' AND item.member_id = 'chat-runtime-c'), 1::bigint, 'repaired canonical member ID exists exactly once');

INSERT INTO public."groupChats" ("_id", "name", "creatorId", "memberIds", "interests", "createdAt", "updatedAt") VALUES ('chat-runtime-rel-group', 'Relational only group', 'chat-runtime-a', '[]', '[]', 1, 1);
INSERT INTO public."groupMembers" ("_id", "groupId", "userId", "role", "joinedAt") VALUES
  ('chat-runtime-rel-owner', 'chat-runtime-rel-group', 'chat-runtime-a', 'owner', 1),
  ('chat-runtime-rel-c', 'chat-runtime-rel-group', 'chat-runtime-c', 'member', 1);
INSERT INTO public."conversations" ("_id", "userA", "groupChatId", "updatedAt") VALUES ('chat-runtime-rel-conv', 'chat-runtime-a', 'chat-runtime-rel-group', 1);
INSERT INTO public."messages" ("_id", "conversationId", "senderId", "text", "createdAt", "isRead") VALUES ('chat-runtime-rel-message', 'chat-runtime-rel-conv', 'chat-runtime-a', 'history', 1, false);
SELECT is(jsonb_array_length(public.get_lalao_conversation_messages('chat-runtime-c', 'chat-runtime-rel-conv', 50, NULL, NULL)), 1, 'relational group member can read message history');
SELECT lives_ok($$SELECT public.send_lalao_message('chat-runtime-c', 'chat-runtime-rel-conv', 'sent as relational member')$$, 'relational group member can send consistently with history access');
SELECT is((SELECT count(*) FROM public."notifications" WHERE "recipientId" = 'chat-runtime-a' AND "conversationId" = 'chat-runtime-rel-conv' AND "type" = 'message'), 1::bigint, 'message send writes one recipient notification');
SELECT is((SELECT count(*) FROM public."notificationOutbox" o JOIN public."notifications" n ON n."_id" = o."notificationId" WHERE n."recipientId" = 'chat-runtime-a' AND n."conversationId" = 'chat-runtime-rel-conv' AND o."category" = 'messages'), 1::bigint, 'message send queues one notification outbox item');

UPDATE public."users" SET "phone" = '+15550000001' WHERE "_id" = 'chat-runtime-a';
SELECT throws_ok(
  $$SELECT public.update_lalao_user_phone('chat-runtime-b', '+15550000001')$$,
  '23505', 'This phone number is already associated with another account.',
  'phone uniqueness checks the legacy phone columns'
);
SELECT ok(position('pg_advisory_xact_lock' IN pg_get_functiondef('public.enforce_lalao_user_phone_uniqueness()'::regprocedure)) > 0, 'phone trigger serializes uniqueness across both columns');
-- Manual two-session concurrency procedure: concurrently assign the same new phone number to two users through update_lalao_user_phone; exactly one transaction must commit and the other must fail with 23505. Repeat with updatePhoneSetup racing update_lalao_user_phone. This pgTAP runner is single-session and cannot exercise that race.
SELECT is(
  public.update_lalao_user_onboarding('chat-runtime-b', 'updatePhoneSetup',
    '{"phoneNumber":"+15550000002","countryCode":"US","countryName":"United States","phoneCountryCode":"1"}'::jsonb),
  'country_restricted',
  'onboarding phone setup preserves its existing country response'
);
SELECT throws_ok(
  $$SELECT public.update_lalao_user_phone('chat-runtime-c', '+15550000002')$$,
  '23505', 'This phone number is already associated with another account.',
  'phone update rejects a number set through onboarding'
);

SELECT * FROM finish();
ROLLBACK;
