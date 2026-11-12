-- Additive Supabase parity for the Convex-backed Live Room upgrade.
-- Convex remains authoritative for live-room authorization and realtime.
BEGIN;

CREATE TABLE IF NOT EXISTS public."roomTopics" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "groupChatId" text NOT NULL,
  "conversationId" text NOT NULL,
  "createdBy" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "expiresAt" double precision NOT NULL,
  "originalExpiresAt" double precision NOT NULL,
  "extensionCount" double precision NOT NULL,
  "pinned" boolean NOT NULL,
  "archivedAt" double precision,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
ALTER TABLE public."roomTopics" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."roomTopics" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."roomTopics" TO service_role;

CREATE TABLE IF NOT EXISTS public."messageMentions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "messageId" text NOT NULL,
  "conversationId" text NOT NULL,
  "groupChatId" text,
  "mentionedUserId" text NOT NULL,
  "mentionedById" text NOT NULL,
  "createdAt" double precision NOT NULL
);
ALTER TABLE public."messageMentions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."messageMentions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."messageMentions" TO service_role;

ALTER TABLE public."messages" ADD COLUMN IF NOT EXISTS "pinnedBy" text;
ALTER TABLE public."messages" ADD COLUMN IF NOT EXISTS "pinnedAt" double precision;
ALTER TABLE public."messages" ADD COLUMN IF NOT EXISTS "expiredAt" double precision;
ALTER TABLE public."messages" ADD COLUMN IF NOT EXISTS "topicId" text;
ALTER TABLE public."cycleStories" ADD COLUMN IF NOT EXISTS "roomId" text;

ALTER TABLE public."notifications" DROP CONSTRAINT IF EXISTS "ck_notifications_type_enum";
ALTER TABLE public."notifications" ADD CONSTRAINT "ck_notifications_type_enum"
  CHECK ("type" IN ('like', 'comment', 'reply', 'comment_like', 'reply_like', 'follow', 'rally_join', 'system_alert', 'message', 'subscription_joined', 'subscription_renewal', 'subscription_cancelled', 'subscription_payment_failed', 'missed_call', 'incoming_call', 'ad_submitted', 'ad_payment_confirmed', 'ad_approved', 'ad_rejected', 'ad_paused', 'ad_completed', 'gift_received', 'mention'));

ALTER TABLE public."roomTopics" ADD CONSTRAINT "fk_roomTopics_groupChatId_groupChats" FOREIGN KEY ("groupChatId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomTopics" ADD CONSTRAINT "fk_roomTopics_conversationId_conversations" FOREIGN KEY ("conversationId") REFERENCES public."conversations" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomTopics" ADD CONSTRAINT "fk_roomTopics_createdBy_users" FOREIGN KEY ("createdBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messageMentions" ADD CONSTRAINT "fk_messageMentions_messageId_messages" FOREIGN KEY ("messageId") REFERENCES public."messages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messageMentions" ADD CONSTRAINT "fk_messageMentions_conversationId_conversations" FOREIGN KEY ("conversationId") REFERENCES public."conversations" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messageMentions" ADD CONSTRAINT "fk_messageMentions_groupChatId_groupChats" FOREIGN KEY ("groupChatId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messageMentions" ADD CONSTRAINT "fk_messageMentions_mentionedUserId_users" FOREIGN KEY ("mentionedUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messageMentions" ADD CONSTRAINT "fk_messageMentions_mentionedById_users" FOREIGN KEY ("mentionedById") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messages" ADD CONSTRAINT "fk_messages_pinnedBy_users" FOREIGN KEY ("pinnedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messages" ADD CONSTRAINT "fk_messages_topicId_roomTopics" FOREIGN KEY ("topicId") REFERENCES public."roomTopics" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cycleStories" ADD CONSTRAINT "fk_cycleStories_roomId_groupChats" FOREIGN KEY ("roomId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;

CREATE INDEX IF NOT EXISTS "idx_roomTopics_by_group_active" ON public."roomTopics" ("groupChatId", "archivedAt", "expiresAt");
CREATE INDEX IF NOT EXISTS "idx_roomTopics_by_group_created" ON public."roomTopics" ("groupChatId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_roomTopics_by_conversation" ON public."roomTopics" ("conversationId");
CREATE INDEX IF NOT EXISTS "idx_messageMentions_by_message" ON public."messageMentions" ("messageId");
CREATE INDEX IF NOT EXISTS "idx_messageMentions_by_mentioned" ON public."messageMentions" ("mentionedUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_messageMentions_by_conversation" ON public."messageMentions" ("conversationId");

COMMIT;
