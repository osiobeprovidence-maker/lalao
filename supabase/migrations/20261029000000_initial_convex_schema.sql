-- Generated from convex/schema.ts by scripts/generate-supabase-schema.ts.
-- All source tables and fields are included; Convex IDs remain text for identity continuity.
-- This is a local-first parity schema. No live data is included.
BEGIN;

CREATE TABLE public."users" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "tokenIdentifier" text NOT NULL,
  "email" text,
  "emailNormalized" text,
  "phone" text,
  "name" text,
  "username" text,
  "avatarUrl" text,
  "avatarStorageId" text,
  "bio" text,
  "pronouns" text,
  "userType" text CONSTRAINT "ck_users_userType_enum" CHECK ("userType" IN ('person', 'business', 'organization', 'club', 'community')),
  "locationName" text,
  "locationSub" text,
  "latitude" double precision,
  "longitude" double precision,
  "radiusKm" double precision,
  "interests" jsonb CONSTRAINT "ck_users_interests_shape" CHECK ("interests" IS NULL OR (jsonb_typeof("interests") = 'array')),
  "homeFeedPreferences" jsonb,
  "onboardingStep" text NOT NULL CONSTRAINT "ck_users_onboardingStep_enum" CHECK ("onboardingStep" IN ('pending', 'name', 'profile', 'pronouns', 'location', 'interests', 'complete')),
  "followersCount" double precision,
  "followingCount" double precision,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL,
  "lastSignInProvider" text CONSTRAINT "ck_users_lastSignInProvider_enum" CHECK ("lastSignInProvider" IN ('firebase', 'playsole')),
  "lastSignInMethod" text,
  "role" text CONSTRAINT "ck_users_role_enum" CHECK ("role" IN ('user', 'moderator', 'editor', 'admin', 'super_admin')),
  "suspended" boolean,
  "countryCode" text,
  "countryName" text,
  "phoneNumber" text,
  "phoneCountryCode" text,
  "phoneSetupCompleted" boolean,
  "phoneVerified" boolean,
  "accessStatus" text CONSTRAINT "ck_users_accessStatus_enum" CHECK ("accessStatus" IN ('available', 'country_restricted', 'waitlisted')),
  "disappearingMode" text,
  "disappearingCustomValue" double precision,
  "disappearingCustomUnit" text,
  "publicIdentityType" text CONSTRAINT "ck_users_publicIdentityType_enum" CHECK ("publicIdentityType" IN ('display_name', 'username', 'both')),
  "dateOfBirth" text,
  "birthDateVisibility" text CONSTRAINT "ck_users_birthDateVisibility_enum" CHECK ("birthDateVisibility" IN ('public', 'age_only', 'private')),
  "notificationPrefs" jsonb CONSTRAINT "ck_users_notificationPrefs_shape" CHECK ("notificationPrefs" IS NULL OR (jsonb_typeof("notificationPrefs") = 'object')),
  "verificationTier" text CONSTRAINT "ck_users_verificationTier_enum" CHECK ("verificationTier" IN ('none', 'verified', 'priority', 'creator')),
  "verificationStatus" text CONSTRAINT "ck_users_verificationStatus_enum" CHECK ("verificationStatus" IN ('inactive', 'active', 'expired', 'cancelled')),
  "verificationExpiresAt" double precision,
  "creatorCategory" text,
  "creatorType" text CONSTRAINT "ck_users_creatorType_enum" CHECK ("creatorType" IN ('manga', 'short_movie')),
  "mangaPublisherName" text,
  "mangaCreatorAbout" text,
  "shortMovieStudioName" text,
  "shortMovieCreatorAbout" text,
  "creatorAccountStatus" text CONSTRAINT "ck_users_creatorAccountStatus_enum" CHECK ("creatorAccountStatus" IN ('active', 'suspended', 'closed')),
  "creatorLevel" double precision,
  "creatorEarnings" double precision,
  "creatorPendingEarnings" double precision,
  "creatorAchievements" jsonb CONSTRAINT "ck_users_creatorAchievements_shape" CHECK ("creatorAchievements" IS NULL OR (jsonb_typeof("creatorAchievements") = 'array')),
  "creatorPriorityWeight" double precision,
  "is_test_account" boolean
);
COMMENT ON TABLE public."users" IS 'Convex source table: users. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."users" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."users" TO service_role;
CREATE TABLE public."authIdentities" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "provider" text NOT NULL CONSTRAINT "ck_authIdentities_provider_enum" CHECK ("provider" IN ('firebase', 'playsole')),
  "issuer" text NOT NULL,
  "subject" text NOT NULL,
  "tokenIdentifier" text NOT NULL,
  "method" text,
  "emailNormalized" text,
  "emailVerified" boolean NOT NULL,
  "linkedAt" double precision NOT NULL
);
COMMENT ON TABLE public."authIdentities" IS 'Convex source table: authIdentities. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."authIdentities" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."authIdentities" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."authIdentities" TO service_role;
CREATE TABLE public."authLinkChallenges" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "token" text NOT NULL,
  "userId" text NOT NULL,
  "initiatingTokenIdentifier" text,
  "initiatingIssuer" text,
  "initiatingSubject" text,
  "targetProvider" text NOT NULL CONSTRAINT "ck_authLinkChallenges_targetProvider_enum" CHECK ("targetProvider" IN ('firebase', 'playsole')),
  "createdAt" double precision NOT NULL,
  "expiresAt" double precision NOT NULL,
  "consumedAt" double precision
);
COMMENT ON TABLE public."authLinkChallenges" IS 'Convex source table: authLinkChallenges. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."authLinkChallenges" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."authLinkChallenges" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."authLinkChallenges" TO service_role;
CREATE TABLE public."authMigrationState" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "key" text NOT NULL,
  "emailNormalizedAt" double precision,
  "authIdentitiesBackfilledAt" double precision
);
COMMENT ON TABLE public."authMigrationState" IS 'Convex source table: authMigrationState. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."authMigrationState" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."authMigrationState" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."authMigrationState" TO service_role;
CREATE TABLE public."emailSendLimits" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "key" text NOT NULL,
  "sentAt" double precision NOT NULL
);
COMMENT ON TABLE public."emailSendLimits" IS 'Convex source table: emailSendLimits. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."emailSendLimits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."emailSendLimits" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."emailSendLimits" TO service_role;
CREATE TABLE public."authIdentityBackfillConflicts" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "tokenIdentifier" text NOT NULL,
  "notedAt" double precision NOT NULL
);
COMMENT ON TABLE public."authIdentityBackfillConflicts" IS 'Convex source table: authIdentityBackfillConflicts. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."authIdentityBackfillConflicts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."authIdentityBackfillConflicts" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."authIdentityBackfillConflicts" TO service_role;
CREATE TABLE public."waitlist" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "email" text,
  "phoneNumber" text NOT NULL,
  "countryCode" text NOT NULL,
  "countryName" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_waitlist_status_enum" CHECK ("status" IN ('active', 'notified')),
  "notifiedAt" double precision,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."waitlist" IS 'Convex source table: waitlist. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."waitlist" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."waitlist" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."waitlist" TO service_role;
CREATE TABLE public."posts" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "authorId" text NOT NULL,
  "text" text NOT NULL,
  "mediaUrl" text,
  "mediaStorageId" text,
  "mediaType" text CONSTRAINT "ck_posts_mediaType_enum" CHECK ("mediaType" IN ('image', 'video')),
  "location" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "createdAt" double precision NOT NULL,
  "likesCount" double precision NOT NULL,
  "commentsCount" double precision NOT NULL,
  "repostsCount" double precision NOT NULL,
  "audience" text CONSTRAINT "ck_posts_audience_enum" CHECK ("audience" IN ('everyone', 'closeFriends', 'community', 'group', 'page', 'nearby', 'anime', 'interest')),
  "replyPermission" text CONSTRAINT "ck_posts_replyPermission_enum" CHECK ("replyPermission" IN ('everyone', 'followers', 'following', 'friends', 'closeFriends', 'sameInterests', 'mentioned')),
  "gifUrl" text,
  "pollQuestion" text,
  "pollOptions" jsonb CONSTRAINT "ck_posts_pollOptions_shape" CHECK ("pollOptions" IS NULL OR (jsonb_typeof("pollOptions") = 'array')),
  "pageRefId" text,
  "groupRefId" text,
  "rallyRefId" text,
  "mediaWidth" double precision,
  "mediaHeight" double precision,
  "moderationStatus" text CONSTRAINT "ck_posts_moderationStatus_enum" CHECK ("moderationStatus" IN ('removed', 'flagged', 'safe')),
  "removedAt" double precision,
  "removedBy" text,
  "removalReason" text,
  "removalReasonCode" text,
  "removalReasonId" text,
  "violationLevel" text,
  "moderationNote" text,
  "contentTopics" jsonb CONSTRAINT "ck_posts_contentTopics_shape" CHECK ("contentTopics" IS NULL OR (jsonb_typeof("contentTopics") = 'array')),
  "muxUploadId" text,
  "muxAssetId" text,
  "muxPlaybackId" text,
  "mediaStatus" text CONSTRAINT "ck_posts_mediaStatus_enum" CHECK ("mediaStatus" IN ('uploading', 'processing', 'ready', 'failed')),
  "mediaProcessingError" text,
  "soundId" text,
  "soundTitle" text,
  "soundAuthorName" text,
  "soundAudioUrl" text,
  "soundStartOffset" double precision,
  "soundVolume" double precision,
  "originalAudioVolume" double precision,
  "locationAccuracy" double precision,
  "locationCapturedAt" double precision,
  "locationCountry" text,
  "locationState" text,
  "locationCity" text,
  "locationNeighborhood" text,
  "locationStatus" text CONSTRAINT "ck_posts_locationStatus_enum" CHECK ("locationStatus" IN ('verified', 'approximate', 'unverified')),
  "nearbyEnabled" boolean
);
COMMENT ON TABLE public."posts" IS 'Convex source table: posts. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."posts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."posts" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."posts" TO service_role;
CREATE TABLE public."comments" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "postId" text NOT NULL,
  "authorId" text NOT NULL,
  "parentCommentId" text,
  "text" text NOT NULL,
  "createdAt" double precision NOT NULL,
  "likesCount" double precision NOT NULL,
  "mediaUrl" text,
  "mediaStorageId" text,
  "mediaType" text CONSTRAINT "ck_comments_mediaType_enum" CHECK ("mediaType" IN ('image', 'voice', 'gif', 'sticker')),
  "duration" double precision,
  "isDeleted" boolean
);
COMMENT ON TABLE public."comments" IS 'Convex source table: comments. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."comments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."comments" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."comments" TO service_role;
CREATE TABLE public."likes" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "targetType" text NOT NULL CONSTRAINT "ck_likes_targetType_enum" CHECK ("targetType" IN ('post', 'comment', 'reply')),
  "targetId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."likes" IS 'Convex source table: likes. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."likes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."likes" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."likes" TO service_role;
CREATE TABLE public."follows" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "followerId" text NOT NULL,
  "followingId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."follows" IS 'Convex source table: follows. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."follows" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."follows" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."follows" TO service_role;
CREATE TABLE public."pages" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "ownerId" text NOT NULL,
  "name" text NOT NULL,
  "username" text NOT NULL,
  "type" text NOT NULL CONSTRAINT "ck_pages_type_enum" CHECK ("type" IN ('business', 'organization', 'club', 'community')),
  "badge" text CONSTRAINT "ck_pages_badge_enum" CHECK ("badge" IN ('BIZ', 'ORG', 'CLUB', 'COMMUNITY')),
  "businessType" text CONSTRAINT "ck_pages_businessType_enum" CHECK ("businessType" IN ('commerce', 'subscription', 'hybrid')),
  "activeTools" jsonb CONSTRAINT "ck_pages_activeTools_shape" CHECK ("activeTools" IS NULL OR (jsonb_typeof("activeTools") = 'array')),
  "description" text,
  "partnerType" text CONSTRAINT "ck_pages_partnerType_enum" CHECK ("partnerType" IN ('COMMERCE_PARTNER', 'API_PARTNER')),
  "partnerStatus" text CONSTRAINT "ck_pages_partnerStatus_enum" CHECK ("partnerStatus" IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
  "ownerStatus" text CONSTRAINT "ck_pages_ownerStatus_enum" CHECK ("ownerStatus" IN ('ASSIGNED', 'UNASSIGNED')),
  "integrationStatus" text,
  "externalPartnerId" text,
  "globalDiscoveryStatus" text CONSTRAINT "ck_pages_globalDiscoveryStatus_enum" CHECK ("globalDiscoveryStatus" IN ('global', 'national', 'regional', 'local')),
  "serviceAreas" jsonb CONSTRAINT "ck_pages_serviceAreas_shape" CHECK ("serviceAreas" IS NULL OR (jsonb_typeof("serviceAreas") = 'array')),
  "isOnlineBusiness" boolean,
  "location" text NOT NULL,
  "avatar" text,
  "coverImage" text,
  "category" text,
  "aboutInfo" jsonb CONSTRAINT "ck_pages_aboutInfo_shape" CHECK ("aboutInfo" IS NULL OR (jsonb_typeof("aboutInfo") = 'object')),
  "followersCount" double precision NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."pages" IS 'Convex source table: pages. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."pages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."pages" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."pages" TO service_role;
CREATE TABLE public."pageMembers" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "userId" text NOT NULL,
  "role" text NOT NULL CONSTRAINT "ck_pageMembers_role_enum" CHECK ("role" IN ('owner', 'admin', 'staff', 'editor')),
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."pageMembers" IS 'Convex source table: pageMembers. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."pageMembers" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."pageMembers" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."pageMembers" TO service_role;
CREATE TABLE public."pageExtensions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "category" text NOT NULL,
  "data" jsonb NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."pageExtensions" IS 'Convex source table: pageExtensions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."pageExtensions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."pageExtensions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."pageExtensions" TO service_role;
CREATE TABLE public."pageLocations" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "name" text NOT NULL,
  "location" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "isPrimary" boolean NOT NULL,
  "address" text,
  "phone" text,
  "hours" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."pageLocations" IS 'Convex source table: pageLocations. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."pageLocations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."pageLocations" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."pageLocations" TO service_role;
CREATE TABLE public."pageFollowers" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "pageId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."pageFollowers" IS 'Convex source table: pageFollowers. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."pageFollowers" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."pageFollowers" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."pageFollowers" TO service_role;
CREATE TABLE public."conversations" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userA" text NOT NULL,
  "userB" text,
  "pageB" text,
  "groupChatId" text,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."conversations" IS 'Convex source table: conversations. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."conversations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."conversations" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."conversations" TO service_role;
CREATE TABLE public."groupChats" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "name" text NOT NULL,
  "username" text,
  "description" text,
  "creatorId" text NOT NULL,
  "memberIds" jsonb NOT NULL CONSTRAINT "ck_groupChats_memberIds_shape" CHECK ("memberIds" IS NULL OR (jsonb_typeof("memberIds") = 'array')),
  "avatarUrl" text,
  "coverImage" text,
  "category" text,
  "rules" jsonb CONSTRAINT "ck_groupChats_rules_shape" CHECK ("rules" IS NULL OR (jsonb_typeof("rules") = 'array')),
  "interests" jsonb NOT NULL CONSTRAINT "ck_groupChats_interests_shape" CHECK ("interests" IS NULL OR (jsonb_typeof("interests") = 'array')),
  "visibility" text CONSTRAINT "ck_groupChats_visibility_enum" CHECK ("visibility" IN ('public', 'private_discoverable', 'private_hidden')),
  "communityEnabled" boolean,
  "communityFeatures" jsonb CONSTRAINT "ck_groupChats_communityFeatures_shape" CHECK ("communityFeatures" IS NULL OR (jsonb_typeof("communityFeatures") = 'object')),
  "publishingPermissions" jsonb CONSTRAINT "ck_groupChats_publishingPermissions_shape" CHECK ("publishingPermissions" IS NULL OR (jsonb_typeof("publishingPermissions") = 'object')),
  "isChatroom" boolean,
  "allowPublicPreview" boolean,
  "roomIcon" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."groupChats" IS 'Convex source table: groupChats. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."groupChats" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."groupChats" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."groupChats" TO service_role;
CREATE TABLE public."groupMembers" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "groupId" text NOT NULL,
  "userId" text NOT NULL,
  "role" text NOT NULL CONSTRAINT "ck_groupMembers_role_enum" CHECK ("role" IN ('owner', 'admin', 'moderator', 'member')),
  "joinedAt" double precision NOT NULL
);
COMMENT ON TABLE public."groupMembers" IS 'Convex source table: groupMembers. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."groupMembers" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."groupMembers" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."groupMembers" TO service_role;
CREATE TABLE public."groupJoinRequests" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "groupId" text NOT NULL,
  "userId" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_groupJoinRequests_status_enum" CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "message" text,
  "createdAt" double precision NOT NULL,
  "reviewedAt" double precision,
  "reviewedBy" text
);
COMMENT ON TABLE public."groupJoinRequests" IS 'Convex source table: groupJoinRequests. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."groupJoinRequests" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."groupJoinRequests" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."groupJoinRequests" TO service_role;
CREATE TABLE public."groupInvitations" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "groupId" text NOT NULL,
  "inviterId" text NOT NULL,
  "invitedUserId" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_groupInvitations_status_enum" CHECK ("status" IN ('pending', 'accepted', 'rejected')),
  "createdAt" double precision NOT NULL,
  "respondedAt" double precision
);
COMMENT ON TABLE public."groupInvitations" IS 'Convex source table: groupInvitations. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."groupInvitations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."groupInvitations" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."groupInvitations" TO service_role;
CREATE TABLE public."groupFollowers" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "groupId" text NOT NULL,
  "userId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."groupFollowers" IS 'Convex source table: groupFollowers. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."groupFollowers" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."groupFollowers" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."groupFollowers" TO service_role;
CREATE TABLE public."groupCycles" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "name" text NOT NULL,
  "description" text,
  "creatorId" text NOT NULL,
  "memberIds" jsonb NOT NULL CONSTRAINT "ck_groupCycles_memberIds_shape" CHECK ("memberIds" IS NULL OR (jsonb_typeof("memberIds") = 'array')),
  "interests" jsonb NOT NULL CONSTRAINT "ck_groupCycles_interests_shape" CHECK ("interests" IS NULL OR (jsonb_typeof("interests") = 'array')),
  "avatarUrl" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."groupCycles" IS 'Convex source table: groupCycles. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."groupCycles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."groupCycles" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."groupCycles" TO service_role;
CREATE TABLE public."messages" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "conversationId" text NOT NULL,
  "senderId" text NOT NULL,
  "pageSenderId" text,
  "text" text NOT NULL,
  "isRead" boolean,
  "readAt" double precision,
  "replyToMessageId" text,
  "isEdited" boolean,
  "type" text CONSTRAINT "ck_messages_type_enum" CHECK ("type" IN ('text', 'image', 'video', 'call')),
  "callId" text,
  "callType" text CONSTRAINT "ck_messages_callType_enum" CHECK ("callType" IN ('voice', 'video')),
  "callDuration" double precision,
  "callStatus" text,
  "mediaStorageId" text,
  "mimeType" text,
  "fileName" text,
  "fileSize" double precision,
  "audioStorageId" text,
  "audioDuration" double precision,
  "viewOnce" boolean,
  "viewOnceOpened" boolean,
  "viewedAt" double precision,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."messages" IS 'Convex source table: messages. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."messages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."messages" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."messages" TO service_role;
CREATE TABLE public."calls" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "callerId" text NOT NULL,
  "recipientId" text NOT NULL,
  "conversationId" text,
  "type" text NOT NULL CONSTRAINT "ck_calls_type_enum" CHECK ("type" IN ('voice', 'video')),
  "status" text NOT NULL CONSTRAINT "ck_calls_status_enum" CHECK ("status" IN ('calling', 'ringing', 'connected', 'completed', 'missed', 'declined', 'canceled', 'failed')),
  "channelName" text NOT NULL,
  "callerUid" double precision NOT NULL,
  "recipientUid" double precision NOT NULL,
  "startedAt" double precision NOT NULL,
  "connectedAt" double precision,
  "endedAt" double precision,
  "duration" double precision,
  "endReason" text
);
COMMENT ON TABLE public."calls" IS 'Convex source table: calls. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."calls" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."calls" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."calls" TO service_role;
CREATE TABLE public."notifications" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "recipientId" text NOT NULL,
  "actorId" text NOT NULL,
  "type" text NOT NULL CONSTRAINT "ck_notifications_type_enum" CHECK ("type" IN ('like', 'comment', 'reply', 'comment_like', 'reply_like', 'follow', 'rally_join', 'system_alert', 'message', 'subscription_joined', 'subscription_renewal', 'subscription_cancelled', 'subscription_payment_failed', 'missed_call', 'incoming_call', 'ad_submitted', 'ad_payment_confirmed', 'ad_approved', 'ad_rejected', 'ad_paused', 'ad_completed')),
  "postId" text,
  "commentId" text,
  "conversationId" text,
  "messageId" text,
  "targetExcerpt" text,
  "isRead" boolean NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."notifications" IS 'Convex source table: notifications. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."notifications" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."notifications" TO service_role;
CREATE TABLE public."drafts" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "authorId" text NOT NULL,
  "text" text NOT NULL,
  "mediaUrl" text,
  "mediaType" text CONSTRAINT "ck_drafts_mediaType_enum" CHECK ("mediaType" IN ('image', 'video')),
  "audience" text CONSTRAINT "ck_drafts_audience_enum" CHECK ("audience" IN ('everyone', 'closeFriends', 'community', 'page', 'nearby', 'anime', 'interest')),
  "replyPermission" text CONSTRAINT "ck_drafts_replyPermission_enum" CHECK ("replyPermission" IN ('everyone', 'followers', 'following', 'friends', 'closeFriends', 'sameInterests', 'mentioned')),
  "gifUrl" text,
  "pollQuestion" text,
  "pollOptions" jsonb CONSTRAINT "ck_drafts_pollOptions_shape" CHECK ("pollOptions" IS NULL OR (jsonb_typeof("pollOptions") = 'array')),
  "pageRefId" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."drafts" IS 'Convex source table: drafts. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."drafts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."drafts" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."drafts" TO service_role;
CREATE TABLE public."products" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "price" double precision NOT NULL,
  "currency" text NOT NULL,
  "category" text,
  "stockQuantity" double precision,
  "inStock" boolean NOT NULL,
  "image" text,
  "images" jsonb CONSTRAINT "ck_products_images_shape" CHECK ("images" IS NULL OR (jsonb_typeof("images") = 'array')),
  "status" text,
  "externalProductId" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."products" IS 'Convex source table: products. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."products" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."products" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."products" TO service_role;
CREATE TABLE public."cartItems" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "productId" text NOT NULL,
  "quantity" double precision NOT NULL,
  "selectedOptions" jsonb,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."cartItems" IS 'Convex source table: cartItems. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."cartItems" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."cartItems" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."cartItems" TO service_role;
CREATE TABLE public."orders" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "buyerId" text NOT NULL,
  "pageId" text NOT NULL,
  "totalAmount" double precision NOT NULL,
  "currency" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_orders_status_enum" CHECK ("status" IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'processing', 'confirmed')),
  "shippingAddress" jsonb,
  "externalOrderId" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."orders" IS 'Convex source table: orders. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."orders" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."orders" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."orders" TO service_role;
CREATE TABLE public."orderItems" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "orderId" text NOT NULL,
  "productId" text NOT NULL,
  "quantity" double precision NOT NULL,
  "priceAtPurchase" double precision NOT NULL,
  "selectedOptions" jsonb
);
COMMENT ON TABLE public."orderItems" IS 'Convex source table: orderItems. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."orderItems" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."orderItems" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."orderItems" TO service_role;
CREATE TABLE public."auctions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "productId" text NOT NULL,
  "startingBid" double precision NOT NULL,
  "currentBid" double precision NOT NULL,
  "currency" text NOT NULL,
  "endsAt" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_auctions_status_enum" CHECK ("status" IN ('active', 'upcoming', 'ended', 'cancelled')),
  "externalAuctionId" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."auctions" IS 'Convex source table: auctions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."auctions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."auctions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."auctions" TO service_role;
CREATE TABLE public."auctionBids" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "auctionId" text NOT NULL,
  "userId" text NOT NULL,
  "bidAmount" double precision NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."auctionBids" IS 'Convex source table: auctionBids. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."auctionBids" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."auctionBids" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."auctionBids" TO service_role;
CREATE TABLE public."cryptoWallets" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "walletAddress" text NOT NULL,
  "provider" text NOT NULL,
  "network" text,
  "isConnected" boolean NOT NULL,
  "lastConnectedAt" double precision NOT NULL
);
COMMENT ON TABLE public."cryptoWallets" IS 'Convex source table: cryptoWallets. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."cryptoWallets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."cryptoWallets" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."cryptoWallets" TO service_role;
CREATE TABLE public."userWallets" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "balance" double precision NOT NULL,
  "currency" text NOT NULL,
  "accountNumber" text,
  "accountName" text,
  "bankName" text,
  "walletPin" text,
  "pinResetOtp" text,
  "pinResetExpiresAt" double precision,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."userWallets" IS 'Convex source table: userWallets. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."userWallets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."userWallets" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."userWallets" TO service_role;
CREATE TABLE public."walletTransactions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "walletId" text NOT NULL,
  "userId" text NOT NULL,
  "relatedUserId" text,
  "relatedUserName" text,
  "relatedUserUsername" text,
  "amount" double precision NOT NULL,
  "fee" double precision,
  "currency" text,
  "assetType" text CONSTRAINT "ck_walletTransactions_assetType_enum" CHECK ("assetType" IN ('LALAO_CREDITS', 'CRYPTO')),
  "blockchainNetwork" text,
  "transactionHash" text,
  "paymentProvider" text,
  "providerTransactionId" text,
  "type" text NOT NULL CONSTRAINT "ck_walletTransactions_type_enum" CHECK ("type" IN ('deposit', 'withdrawal', 'subscription_payment', 'product_order', 'tournament_fee', 'prize_payout', 'transfer_out', 'MARKET_PURCHASE', 'MARKET_REFUND', 'gift_sent', 'page_payment')),
  "status" text NOT NULL CONSTRAINT "ck_walletTransactions_status_enum" CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'reversed', 'cancelled')),
  "description" text NOT NULL,
  "reference" text,
  "relatedPageId" text,
  "metadata" jsonb,
  "receiptNumber" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."walletTransactions" IS 'Convex source table: walletTransactions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."walletTransactions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."walletTransactions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."walletTransactions" TO service_role;
CREATE TABLE public."marketTransactions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "type" text NOT NULL,
  "category" text NOT NULL,
  "provider" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_marketTransactions_status_enum" CHECK ("status" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'REVERSED')),
  "requestId" text NOT NULL,
  "providerOrderId" text,
  "amount" double precision NOT NULL,
  "providerAmount" double precision,
  "providerDiscount" double precision,
  "platformFee" double precision NOT NULL,
  "totalAmount" double precision NOT NULL,
  "currency" text NOT NULL,
  "recipient" text NOT NULL,
  "customerId" text,
  "customerName" text,
  "phone" text,
  "network" text,
  "variationId" text,
  "productName" text,
  "productDescription" text,
  "token" text,
  "units" text,
  "meterType" text,
  "metadata" jsonb,
  "errorCode" text,
  "errorMessage" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL,
  "completedAt" double precision,
  "refundedAt" double precision
);
COMMENT ON TABLE public."marketTransactions" IS 'Convex source table: marketTransactions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."marketTransactions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."marketTransactions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."marketTransactions" TO service_role;
CREATE TABLE public."subscriptionPlatforms" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo" text NOT NULL,
  "category" text NOT NULL,
  "website" text,
  "description" text,
  "active" boolean NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."subscriptionPlatforms" IS 'Convex source table: subscriptionPlatforms. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."subscriptionPlatforms" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."subscriptionPlatforms" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."subscriptionPlatforms" TO service_role;
CREATE TABLE public."subscriptionListings" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "platformId" text,
  "platformName" text,
  "platformLogo" text,
  "name" text NOT NULL,
  "description" text,
  "category" text NOT NULL,
  "totalAccountCost" double precision NOT NULL,
  "currency" text NOT NULL,
  "billingCycle" text NOT NULL CONSTRAINT "ck_subscriptionListings_billingCycle_enum" CHECK ("billingCycle" IN ('monthly', 'quarterly', 'yearly', '3_months', '6_months', '12_months')),
  "durationMonths" double precision,
  "totalCapacity" double precision NOT NULL,
  "defaultSlotPrice" double precision NOT NULL,
  "allowDifferentSlotPrices" boolean NOT NULL,
  "accountEmail" text,
  "providerTag" text,
  "privateNotes" text,
  "memberInstructions" text,
  "eligibilityRules" text,
  "cancellationPolicy" text,
  "renewalRules" text,
  "gracePeriodDays" double precision,
  "benefits" jsonb NOT NULL CONSTRAINT "ck_subscriptionListings_benefits_shape" CHECK ("benefits" IS NULL OR (jsonb_typeof("benefits") = 'array')),
  "active" boolean NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."subscriptionListings" IS 'Convex source table: subscriptionListings. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."subscriptionListings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."subscriptionListings" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."subscriptionListings" TO service_role;
CREATE TABLE public."subscriptionSlots" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "subscriptionId" text NOT NULL,
  "pageId" text NOT NULL,
  "slotNumber" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_subscriptionSlots_status_enum" CHECK ("status" IN ('available', 'reserved', 'occupied', 'paused')),
  "currentMemberId" text,
  "reservedForUserId" text,
  "reservationExpiresAt" double precision,
  "priceOverride" double precision,
  "role" text CONSTRAINT "ck_subscriptionSlots_role_enum" CHECK ("role" IN ('Head of Family', 'Member')),
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."subscriptionSlots" IS 'Convex source table: subscriptionSlots. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."subscriptionSlots" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."subscriptionSlots" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."subscriptionSlots" TO service_role;
CREATE TABLE public."subscriptionReservations" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "subscriptionId" text NOT NULL,
  "slotId" text NOT NULL,
  "userId" text NOT NULL,
  "amount" double precision NOT NULL,
  "currency" text NOT NULL,
  "durationMonths" double precision,
  "status" text NOT NULL CONSTRAINT "ck_subscriptionReservations_status_enum" CHECK ("status" IN ('pending', 'completed', 'expired', 'cancelled')),
  "paymentMethod" text NOT NULL CONSTRAINT "ck_subscriptionReservations_paymentMethod_enum" CHECK ("paymentMethod" IN ('wallet', 'paystack')),
  "paystackReference" text,
  "expiresAt" double precision NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."subscriptionReservations" IS 'Convex source table: subscriptionReservations. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."subscriptionReservations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."subscriptionReservations" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."subscriptionReservations" TO service_role;
CREATE TABLE public."subscriptionMemberships" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "pageId" text NOT NULL,
  "subscriptionId" text NOT NULL,
  "slotId" text NOT NULL,
  "role" text NOT NULL CONSTRAINT "ck_subscriptionMemberships_role_enum" CHECK ("role" IN ('Head of Family', 'Member')),
  "status" text NOT NULL CONSTRAINT "ck_subscriptionMemberships_status_enum" CHECK ("status" IN ('pending', 'active', 'cancelled', 'past_due', 'expired')),
  "amount" double precision,
  "currency" text,
  "durationMonths" double precision,
  "paymentMethod" text CONSTRAINT "ck_subscriptionMemberships_paymentMethod_enum" CHECK ("paymentMethod" IN ('wallet', 'paystack')),
  "lastPaymentReference" text,
  "lastPaymentStatus" text,
  "startedAt" double precision,
  "currentPeriodStart" double precision,
  "currentPeriodEnd" double precision,
  "nextRenewalDate" double precision,
  "cancelAtPeriodEnd" boolean NOT NULL,
  "autoRenew" boolean,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."subscriptionMemberships" IS 'Convex source table: subscriptionMemberships. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."subscriptionMemberships" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."subscriptionMemberships" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."subscriptionMemberships" TO service_role;
CREATE TABLE public."subscriptionAuditLogs" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "subscriptionId" text,
  "performedByUserId" text NOT NULL,
  "action" text NOT NULL,
  "details" text NOT NULL,
  "metadata" jsonb,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."subscriptionAuditLogs" IS 'Convex source table: subscriptionAuditLogs. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."subscriptionAuditLogs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."subscriptionAuditLogs" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."subscriptionAuditLogs" TO service_role;
CREATE TABLE public."creatorSubscriptions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "tier" text NOT NULL CONSTRAINT "ck_creatorSubscriptions_tier_enum" CHECK ("tier" IN ('verified', 'priority', 'creator')),
  "status" text NOT NULL CONSTRAINT "ck_creatorSubscriptions_status_enum" CHECK ("status" IN ('pending', 'active', 'cancelled', 'expired')),
  "price" double precision NOT NULL,
  "currency" text NOT NULL,
  "paymentMethod" text NOT NULL,
  "paystackReference" text,
  "bachsReference" text,
  "bachsCheckoutId" text,
  "bachsCheckoutUrl" text,
  "bachsProductId" text,
  "bachsSubscriptionId" text,
  "billingStatus" text,
  "cancelAtPeriodEnd" boolean NOT NULL,
  "startedAt" double precision NOT NULL,
  "expiresAt" double precision NOT NULL,
  "cancelledAt" double precision,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."creatorSubscriptions" IS 'Convex source table: creatorSubscriptions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."creatorSubscriptions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."creatorSubscriptions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."creatorSubscriptions" TO service_role;
CREATE TABLE public."creatorApplications" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "creatorType" text NOT NULL CONSTRAINT "ck_creatorApplications_creatorType_enum" CHECK ("creatorType" IN ('manga', 'short_movie')),
  "publisherName" text NOT NULL,
  "portfolioUrl" text NOT NULL,
  "sampleChapterUrl" text,
  "about" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_creatorApplications_status_enum" CHECK ("status" IN ('pending', 'approved', 'rejected')),
  "reviewNote" text,
  "reviewedBy" text,
  "submittedAt" double precision NOT NULL,
  "reviewedAt" double precision,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."creatorApplications" IS 'Convex source table: creatorApplications. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."creatorApplications" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."creatorApplications" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."creatorApplications" TO service_role;
CREATE TABLE public."platformSettings" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "key" text NOT NULL,
  "value" text NOT NULL,
  "updatedAt" double precision NOT NULL,
  "updatedBy" text
);
COMMENT ON TABLE public."platformSettings" IS 'Convex source table: platformSettings. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."platformSettings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."platformSettings" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."platformSettings" TO service_role;
CREATE TABLE public."auditLog" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "actorId" text NOT NULL,
  "action" text NOT NULL,
  "target" text,
  "before" text,
  "after" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."auditLog" IS 'Convex source table: auditLog. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."auditLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."auditLog" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."auditLog" TO service_role;
CREATE TABLE public."communitySuggestions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "suggestedByUserId" text NOT NULL,
  "communityName" text NOT NULL,
  "description" text NOT NULL,
  "category" text,
  "location" text,
  "website" text,
  "reason" text,
  "additionalInfo" text,
  "status" text NOT NULL CONSTRAINT "ck_communitySuggestions_status_enum" CHECK ("status" IN ('pending', 'under_review', 'approved', 'rejected')),
  "reviewedAt" double precision,
  "reviewedBy" text,
  "adminNotes" text,
  "publishedPageId" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."communitySuggestions" IS 'Convex source table: communitySuggestions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."communitySuggestions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."communitySuggestions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."communitySuggestions" TO service_role;
CREATE TABLE public."adminSessions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "token" text NOT NULL,
  "expiresAt" double precision NOT NULL
);
COMMENT ON TABLE public."adminSessions" IS 'Convex source table: adminSessions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."adminSessions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."adminSessions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."adminSessions" TO service_role;
CREATE TABLE public."fcmTokens" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "token" text NOT NULL,
  "userAgent" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."fcmTokens" IS 'Convex source table: fcmTokens. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."fcmTokens" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."fcmTokens" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."fcmTokens" TO service_role;
CREATE TABLE public."pushSubscriptions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "deviceId" text,
  "browser" text,
  "platform" text,
  "userAgent" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL,
  "lastUsedAt" double precision,
  "isActive" boolean NOT NULL,
  "provider" text NOT NULL
);
COMMENT ON TABLE public."pushSubscriptions" IS 'Convex source table: pushSubscriptions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."pushSubscriptions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."pushSubscriptions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."pushSubscriptions" TO service_role;
CREATE TABLE public."reports" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "reporterId" text NOT NULL,
  "targetType" text NOT NULL CONSTRAINT "ck_reports_targetType_enum" CHECK ("targetType" IN ('post', 'user', 'page', 'comment', 'reply', 'product', 'event', 'message', 'roomyListing', 'other')),
  "targetId" text NOT NULL,
  "reason" text NOT NULL,
  "description" text,
  "priority" text NOT NULL CONSTRAINT "ck_reports_priority_enum" CHECK ("priority" IN ('low', 'normal', 'high', 'critical')),
  "status" text NOT NULL CONSTRAINT "ck_reports_status_enum" CHECK ("status" IN ('pending', 'under_review', 'resolved', 'dismissed', 'resolved_violation', 'resolved_no_violation', 'escalated')),
  "assignedTo" text,
  "resolvedAt" double precision,
  "resolvedBy" text,
  "resolution" text,
  "resolutionNote" text,
  "moderationReasonId" text,
  "moderationReasonCode" text,
  "violationLevel" text,
  "userNotificationMessage" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."reports" IS 'Convex source table: reports. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."reports" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."reports" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."reports" TO service_role;
CREATE TABLE public."moderationReasons" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "code" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "userMessage" text NOT NULL,
  "defaultSeverity" text NOT NULL CONSTRAINT "ck_moderationReasons_defaultSeverity_enum" CHECK ("defaultSeverity" IN ('low', 'medium', 'high', 'critical')),
  "enabled" boolean NOT NULL,
  "sortOrder" double precision NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."moderationReasons" IS 'Convex source table: moderationReasons. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."moderationReasons" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."moderationReasons" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."moderationReasons" TO service_role;
CREATE TABLE public."topics" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "slug" text NOT NULL,
  "displayName" text NOT NULL,
  "description" text NOT NULL,
  "category" text,
  "displayOrder" double precision NOT NULL,
  "defaultEnabled" boolean NOT NULL,
  "userSelectable" boolean NOT NULL,
  "homeEnabled" boolean NOT NULL,
  "icon" text,
  "isSensitive" boolean,
  "requiresExplicitOptIn" boolean,
  "requiresCreatorConfirmation" boolean,
  "allowAutoSuggestion" boolean,
  "allowPublicAnalytics" boolean,
  "active" boolean NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."topics" IS 'Convex source table: topics. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."topics" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."topics" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."topics" TO service_role;
CREATE TABLE public."roomyProfiles" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "university" text,
  "campus" text,
  "preferredLocation" text,
  "preferredAreas" jsonb CONSTRAINT "ck_roomyProfiles_preferredAreas_shape" CHECK ("preferredAreas" IS NULL OR (jsonb_typeof("preferredAreas") = 'array')),
  "budget" double precision,
  "currency" text,
  "roomType" text,
  "moveInPeriod" text,
  "roommatePreferences" text,
  "roommatesWanted" double precision,
  "lifestyle" jsonb CONSTRAINT "ck_roomyProfiles_lifestyle_shape" CHECK ("lifestyle" IS NULL OR (jsonb_typeof("lifestyle") = 'array')),
  "bio" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."roomyProfiles" IS 'Convex source table: roomyProfiles. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."roomyProfiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."roomyProfiles" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."roomyProfiles" TO service_role;
CREATE TABLE public."roomyListings" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "type" text NOT NULL CONSTRAINT "ck_roomyListings_type_enum" CHECK ("type" IN ('room_offered', 'room_wanted', 'roommate_wanted')),
  "status" text NOT NULL CONSTRAINT "ck_roomyListings_status_enum" CHECK ("status" IN ('active', 'filled', 'inactive', 'removed')),
  "title" text,
  "description" text NOT NULL,
  "price" double precision,
  "currency" text,
  "location" text NOT NULL,
  "university" text,
  "campus" text,
  "area" text,
  "roomType" text,
  "availabilityDate" text,
  "amenities" jsonb CONSTRAINT "ck_roomyListings_amenities_shape" CHECK ("amenities" IS NULL OR (jsonb_typeof("amenities") = 'array')),
  "photos" jsonb CONSTRAINT "ck_roomyListings_photos_shape" CHECK ("photos" IS NULL OR (jsonb_typeof("photos") = 'array')),
  "roommatesNeeded" double precision,
  "preferences" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."roomyListings" IS 'Convex source table: roomyListings. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."roomyListings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."roomyListings" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."roomyListings" TO service_role;
CREATE TABLE public."roomySaves" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "listingId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."roomySaves" IS 'Convex source table: roomySaves. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."roomySaves" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."roomySaves" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."roomySaves" TO service_role;
CREATE TABLE public."roomyInspections" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "requesterId" text NOT NULL,
  "ownerId" text NOT NULL,
  "listingId" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_roomyInspections_status_enum" CHECK ("status" IN ('pending', 'accepted', 'declined', 'rescheduled')),
  "proposedDate" text NOT NULL,
  "message" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."roomyInspections" IS 'Convex source table: roomyInspections. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."roomyInspections" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."roomyInspections" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."roomyInspections" TO service_role;
CREATE TABLE public."recommendations" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "targetId" text NOT NULL,
  "targetType" text NOT NULL CONSTRAINT "ck_recommendations_targetType_enum" CHECK ("targetType" IN ('user', 'page', 'community')),
  "category" text NOT NULL,
  "priority" double precision NOT NULL,
  "active" boolean NOT NULL,
  "addedBy" text,
  "reason" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."recommendations" IS 'Convex source table: recommendations. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."recommendations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."recommendations" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."recommendations" TO service_role;
CREATE TABLE public."recommendationInteractions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "recommendationType" text NOT NULL,
  "targetId" text NOT NULL,
  "action" text NOT NULL CONSTRAINT "ck_recommendationInteractions_action_enum" CHECK ("action" IN ('shown', 'clicked', 'dismissed', 'followed', 'liked', 'opened')),
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."recommendationInteractions" IS 'Convex source table: recommendationInteractions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."recommendationInteractions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."recommendationInteractions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."recommendationInteractions" TO service_role;
CREATE TABLE public."recommendationDismissals" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "targetId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."recommendationDismissals" IS 'Convex source table: recommendationDismissals. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."recommendationDismissals" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."recommendationDismissals" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."recommendationDismissals" TO service_role;
CREATE TABLE public."rallies" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "creatorId" text NOT NULL,
  "postId" text,
  "type" text CONSTRAINT "ck_rallies_type_enum" CHECK ("type" IN ('ASK', 'HELP', 'JOIN')),
  "title" text NOT NULL,
  "description" text NOT NULL,
  "location" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "distanceMeters" double precision,
  "eventDate" text,
  "eventTime" text,
  "timeDate" text,
  "category" text CONSTRAINT "ck_rallies_category_enum" CHECK ("category" IN ('Sports', 'Help', 'Meetup', 'Initiative', 'Civic', 'General')),
  "status" text NOT NULL CONSTRAINT "ck_rallies_status_enum" CHECK ("status" IN ('active', 'completed')),
  "peopleNeeded" double precision,
  "maxNeeded" double precision,
  "compensationType" text CONSTRAINT "ck_rallies_compensationType_enum" CHECK ("compensationType" IN ('free', 'paying', 'charging', 'other')),
  "compensationAmount" text,
  "participantCount" double precision,
  "urgency" text CONSTRAINT "ck_rallies_urgency_enum" CHECK ("urgency" IN ('normal', 'urgent')),
  "tags" jsonb CONSTRAINT "ck_rallies_tags_shape" CHECK ("tags" IS NULL OR (jsonb_typeof("tags") = 'array')),
  "groupRefId" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision
);
COMMENT ON TABLE public."rallies" IS 'Convex source table: rallies. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."rallies" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rallies" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rallies" TO service_role;
CREATE TABLE public."rallyParticipants" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "rallyId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."rallyParticipants" IS 'Convex source table: rallyParticipants. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."rallyParticipants" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rallyParticipants" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rallyParticipants" TO service_role;
CREATE TABLE public."pageEvents" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "pageId" text NOT NULL,
  "title" text NOT NULL,
  "type" text NOT NULL,
  "coverImage" text,
  "date" text NOT NULL,
  "time" text NOT NULL,
  "location" text NOT NULL,
  "isOnline" boolean NOT NULL,
  "registrationStatus" text NOT NULL,
  "isTournament" boolean,
  "isTicketed" boolean,
  "ticketPrice" double precision,
  "prizePool" double precision,
  "prizeCurrency" text,
  "description" text,
  "availableTickets" double precision,
  "totalTickets" double precision,
  "rules" text,
  "schedule" jsonb,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."pageEvents" IS 'Convex source table: pageEvents. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."pageEvents" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."pageEvents" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."pageEvents" TO service_role;
CREATE TABLE public."apiPartners" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "contactName" text,
  "contactEmail" text,
  "company" text,
  "type" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_apiPartners_status_enum" CHECK ("status" IN ('active', 'suspended', 'pending')),
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."apiPartners" IS 'Convex source table: apiPartners. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."apiPartners" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."apiPartners" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."apiPartners" TO service_role;
CREATE TABLE public."apiPlans" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "partnerId" text NOT NULL,
  "name" text NOT NULL,
  "monthlyPrice" double precision NOT NULL,
  "currency" text NOT NULL,
  "eventLimit" double precision NOT NULL,
  "requestLimit" double precision NOT NULL,
  "requestsPerMinute" double precision NOT NULL,
  "billingCycle" text NOT NULL CONSTRAINT "ck_apiPlans_billingCycle_enum" CHECK ("billingCycle" IN ('monthly', 'yearly')),
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."apiPlans" IS 'Convex source table: apiPlans. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."apiPlans" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."apiPlans" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."apiPlans" TO service_role;
CREATE TABLE public."apiCredentials" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "partnerId" text NOT NULL,
  "environment" text NOT NULL CONSTRAINT "ck_apiCredentials_environment_enum" CHECK ("environment" IN ('test', 'live')),
  "keyHash" text NOT NULL,
  "prefix" text NOT NULL,
  "createdAt" double precision NOT NULL,
  "lastUsedAt" double precision,
  "revokedAt" double precision
);
COMMENT ON TABLE public."apiCredentials" IS 'Convex source table: apiCredentials. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."apiCredentials" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."apiCredentials" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."apiCredentials" TO service_role;
CREATE TABLE public."apiPermissions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "partnerId" text NOT NULL,
  "permission" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."apiPermissions" IS 'Convex source table: apiPermissions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."apiPermissions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."apiPermissions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."apiPermissions" TO service_role;
CREATE TABLE public."apiUsage" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "partnerId" text NOT NULL,
  "environment" text NOT NULL CONSTRAINT "ck_apiUsage_environment_enum" CHECK ("environment" IN ('test', 'live')),
  "endpoint" text NOT NULL,
  "method" text NOT NULL,
  "statusCode" double precision NOT NULL,
  "responseTimeMs" double precision NOT NULL,
  "timestamp" double precision NOT NULL,
  "monthKey" text NOT NULL
);
COMMENT ON TABLE public."apiUsage" IS 'Convex source table: apiUsage. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."apiUsage" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."apiUsage" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."apiUsage" TO service_role;
CREATE TABLE public."apiBilling" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "partnerId" text NOT NULL,
  "billingPeriod" text NOT NULL,
  "amount" double precision NOT NULL,
  "currency" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_apiBilling_status_enum" CHECK ("status" IN ('paid', 'pending', 'overdue', 'suspended')),
  "dueDate" double precision NOT NULL,
  "paidAt" double precision,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."apiBilling" IS 'Convex source table: apiBilling. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."apiBilling" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."apiBilling" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."apiBilling" TO service_role;
CREATE TABLE public."partnerEvents" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "partnerId" text NOT NULL,
  "externalId" text NOT NULL,
  "lalaoEventId" text,
  "title" text NOT NULL,
  "description" text,
  "category" text,
  "date" text NOT NULL,
  "time" text NOT NULL,
  "locationName" text,
  "city" text,
  "country" text,
  "latitude" double precision,
  "longitude" double precision,
  "imageUrl" text,
  "price" double precision,
  "currency" text,
  "ticketUrl" text,
  "organizerName" text,
  "status" text NOT NULL CONSTRAINT "ck_partnerEvents_status_enum" CHECK ("status" IN ('active', 'cancelled', 'draft')),
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."partnerEvents" IS 'Convex source table: partnerEvents. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."partnerEvents" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."partnerEvents" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."partnerEvents" TO service_role;
CREATE TABLE public."cycleStories" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "authorId" text NOT NULL,
  "groupCycleId" text,
  "mediaType" text NOT NULL CONSTRAINT "ck_cycleStories_mediaType_enum" CHECK ("mediaType" IN ('image', 'video', 'audio', 'text')),
  "mediaUrl" text,
  "mediaStorageId" text,
  "text" text,
  "caption" text,
  "backgroundColor" text,
  "textColor" text,
  "location" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "audience" text CONSTRAINT "ck_cycleStories_audience_enum" CHECK ("audience" IN ('community', 'nearby', 'friends')),
  "excludedUserIds" jsonb CONSTRAINT "ck_cycleStories_excludedUserIds_shape" CHECK ("excludedUserIds" IS NULL OR (jsonb_typeof("excludedUserIds") = 'array')),
  "duration" double precision,
  "viewsCount" double precision NOT NULL,
  "likesCount" double precision NOT NULL,
  "createdAt" double precision NOT NULL,
  "expiresAt" double precision NOT NULL
);
COMMENT ON TABLE public."cycleStories" IS 'Convex source table: cycleStories. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."cycleStories" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."cycleStories" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."cycleStories" TO service_role;
CREATE TABLE public."cycleStoryInteractions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "storyId" text NOT NULL,
  "userId" text NOT NULL,
  "type" text NOT NULL CONSTRAINT "ck_cycleStoryInteractions_type_enum" CHECK ("type" IN ('view', 'like', 'reply')),
  "replyText" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."cycleStoryInteractions" IS 'Convex source table: cycleStoryInteractions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."cycleStoryInteractions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."cycleStoryInteractions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."cycleStoryInteractions" TO service_role;
CREATE TABLE public."betaTesters" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "lalaoUsername" text NOT NULL,
  "device" text NOT NULL,
  "androidVersion" text NOT NULL,
  "registrationDate" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_betaTesters_status_enum" CHECK ("status" IN ('active', 'pending', 'inactive'))
);
COMMENT ON TABLE public."betaTesters" IS 'Convex source table: betaTesters. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."betaTesters" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."betaTesters" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."betaTesters" TO service_role;
CREATE TABLE public."betaFeedback" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "testerId" text,
  "testerName" text NOT NULL,
  "testerEmail" text NOT NULL,
  "lalaoUsername" text,
  "type" text NOT NULL CONSTRAINT "ck_betaFeedback_type_enum" CHECK ("type" IN ('bug', 'suggestion', 'general')),
  "feature" text NOT NULL,
  "description" text NOT NULL,
  "device" text NOT NULL,
  "priority" text NOT NULL CONSTRAINT "ck_betaFeedback_priority_enum" CHECK ("priority" IN ('low', 'medium', 'high', 'critical')),
  "attachments" jsonb CONSTRAINT "ck_betaFeedback_attachments_shape" CHECK ("attachments" IS NULL OR (jsonb_typeof("attachments") = 'array')),
  "status" text NOT NULL CONSTRAINT "ck_betaFeedback_status_enum" CHECK ("status" IN ('open', 'in_review', 'resolved', 'closed')),
  "date" double precision NOT NULL,
  "internalNotes" text
);
COMMENT ON TABLE public."betaFeedback" IS 'Convex source table: betaFeedback. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."betaFeedback" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."betaFeedback" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."betaFeedback" TO service_role;
CREATE TABLE public."betaReleases" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "version" text NOT NULL,
  "releaseDate" double precision NOT NULL,
  "apkUrl" text NOT NULL,
  "fileSize" text NOT NULL,
  "minAndroidVersion" text NOT NULL,
  "releaseNotes" text NOT NULL,
  "isCurrent" boolean NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_betaReleases_status_enum" CHECK ("status" IN ('active', 'archived'))
);
COMMENT ON TABLE public."betaReleases" IS 'Convex source table: betaReleases. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."betaReleases" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."betaReleases" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."betaReleases" TO service_role;
CREATE TABLE public."betaSettings" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "openLalaoUrl" text NOT NULL,
  "betaCommunityUrl" text NOT NULL,
  "faqs" jsonb NOT NULL CONSTRAINT "ck_betaSettings_faqs_shape" CHECK ("faqs" IS NULL OR (jsonb_typeof("faqs") = 'array'))
);
COMMENT ON TABLE public."betaSettings" IS 'Convex source table: betaSettings. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."betaSettings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."betaSettings" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."betaSettings" TO service_role;
CREATE TABLE public."sounds" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "creatorId" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "category" text NOT NULL CONSTRAINT "ck_sounds_category_enum" CHECK ("category" IN ('music', 'original', 'effects', 'voice')),
  "genre" text,
  "tags" jsonb CONSTRAINT "ck_sounds_tags_shape" CHECK ("tags" IS NULL OR (jsonb_typeof("tags") = 'array')),
  "duration" double precision NOT NULL,
  "audioUrl" text NOT NULL,
  "audioStorageId" text,
  "coverUrl" text,
  "waveform" jsonb CONSTRAINT "ck_sounds_waveform_shape" CHECK ("waveform" IS NULL OR (jsonb_typeof("waveform") = 'array')),
  "visibility" text NOT NULL CONSTRAINT "ck_sounds_visibility_enum" CHECK ("visibility" IN ('public', 'private')),
  "isOfficial" boolean,
  "usageCount" double precision NOT NULL,
  "favoritesCount" double precision NOT NULL,
  "license" text,
  "moderationStatus" text CONSTRAINT "ck_sounds_moderationStatus_enum" CHECK ("moderationStatus" IN ('safe', 'flagged', 'removed')),
  "isDeleted" boolean,
  "deletedAt" double precision,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."sounds" IS 'Convex source table: sounds. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."sounds" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."sounds" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."sounds" TO service_role;
CREATE TABLE public."soundFavourites" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "soundId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."soundFavourites" IS 'Convex source table: soundFavourites. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."soundFavourites" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."soundFavourites" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."soundFavourites" TO service_role;
CREATE TABLE public."plumProfiles" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "displayName" text NOT NULL,
  "age" double precision NOT NULL,
  "gender" text NOT NULL,
  "datingPreferences" jsonb NOT NULL CONSTRAINT "ck_plumProfiles_datingPreferences_shape" CHECK ("datingPreferences" IS NULL OR (jsonb_typeof("datingPreferences") = 'array')),
  "bio" text NOT NULL,
  "interests" jsonb NOT NULL CONSTRAINT "ck_plumProfiles_interests_shape" CHECK ("interests" IS NULL OR (jsonb_typeof("interests") = 'array')),
  "datingIntentions" text NOT NULL,
  "datingGoal" text CONSTRAINT "ck_plumProfiles_datingGoal_enum" CHECK ("datingGoal" IN ('long_term', 'marriage', 'casual', 'short_term', 'friendship_first', 'open')),
  "additionalDatingInfo" text,
  "broadLocation" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "mainPhoto" text,
  "publicPhotos" jsonb NOT NULL CONSTRAINT "ck_plumProfiles_publicPhotos_shape" CHECK ("publicPhotos" IS NULL OR (jsonb_typeof("publicPhotos") = 'array')),
  "privatePhotos" jsonb NOT NULL CONSTRAINT "ck_plumProfiles_privatePhotos_shape" CHECK ("privatePhotos" IS NULL OR (jsonb_typeof("privatePhotos") = 'array')),
  "isAgeConfirmed" boolean NOT NULL,
  "ageConfirmedAt" double precision NOT NULL,
  "showOnMap" boolean NOT NULL,
  "profileVisibility" text NOT NULL CONSTRAINT "ck_plumProfiles_profileVisibility_enum" CHECK ("profileVisibility" IN ('active', 'hidden', 'deactivated')),
  "flashesReceivedCount" double precision,
  "giftsReceivedCount" double precision,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."plumProfiles" IS 'Convex source table: plumProfiles. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."plumProfiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."plumProfiles" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."plumProfiles" TO service_role;
CREATE TABLE public."plumPrivatePhotoAccess" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "ownerId" text NOT NULL,
  "viewerId" text NOT NULL,
  "grantedAt" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_plumPrivatePhotoAccess_status_enum" CHECK ("status" IN ('granted', 'revoked'))
);
COMMENT ON TABLE public."plumPrivatePhotoAccess" IS 'Convex source table: plumPrivatePhotoAccess. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."plumPrivatePhotoAccess" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."plumPrivatePhotoAccess" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."plumPrivatePhotoAccess" TO service_role;
CREATE TABLE public."plumFlashes" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "senderId" text NOT NULL,
  "receiverId" text NOT NULL,
  "note" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."plumFlashes" IS 'Convex source table: plumFlashes. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."plumFlashes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."plumFlashes" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."plumFlashes" TO service_role;
CREATE TABLE public."plumGifts" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "senderId" text NOT NULL,
  "receiverId" text NOT NULL,
  "giftId" text NOT NULL,
  "giftName" text NOT NULL,
  "giftIcon" text NOT NULL,
  "amountLC" double precision NOT NULL,
  "message" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."plumGifts" IS 'Convex source table: plumGifts. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."plumGifts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."plumGifts" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."plumGifts" TO service_role;
CREATE TABLE public."plumReports" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "reporterId" text NOT NULL,
  "reportedUserId" text NOT NULL,
  "reason" text NOT NULL,
  "details" text,
  "createdAt" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_plumReports_status_enum" CHECK ("status" IN ('pending', 'reviewed', 'dismissed'))
);
COMMENT ON TABLE public."plumReports" IS 'Convex source table: plumReports. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."plumReports" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."plumReports" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."plumReports" TO service_role;
CREATE TABLE public."plumFavorites" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "targetUserId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."plumFavorites" IS 'Convex source table: plumFavorites. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."plumFavorites" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."plumFavorites" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."plumFavorites" TO service_role;
CREATE TABLE public."plumInterests" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "senderId" text NOT NULL,
  "receiverId" text NOT NULL,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."plumInterests" IS 'Convex source table: plumInterests. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."plumInterests" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."plumInterests" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."plumInterests" TO service_role;
CREATE TABLE public."userTopicPreferences" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "topicSlug" text NOT NULL,
  "preference" text NOT NULL CONSTRAINT "ck_userTopicPreferences_preference_enum" CHECK ("preference" IN ('interested', 'reduced', 'excluded')),
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."userTopicPreferences" IS 'Convex source table: userTopicPreferences. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."userTopicPreferences" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."userTopicPreferences" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."userTopicPreferences" TO service_role;
CREATE TABLE public."userPagePreferences" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "pageSlugOrId" text NOT NULL,
  "hiddenFromRecommendations" boolean NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."userPagePreferences" IS 'Convex source table: userPagePreferences. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."userPagePreferences" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."userPagePreferences" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."userPagePreferences" TO service_role;
CREATE TABLE public."recentSearches" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "query" text NOT NULL,
  "type" text NOT NULL CONSTRAINT "ck_recentSearches_type_enum" CHECK ("type" IN ('keyword', 'person', 'page', 'shop', 'content', 'event')),
  "entityId" text,
  "title" text,
  "subtitle" text,
  "avatarUrl" text,
  "isVerified" boolean,
  "verificationTier" text,
  "timestamp" double precision NOT NULL
);
COMMENT ON TABLE public."recentSearches" IS 'Convex source table: recentSearches. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."recentSearches" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."recentSearches" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."recentSearches" TO service_role;
CREATE TABLE public."adCampaigns" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "pageId" text,
  "name" text NOT NULL,
  "objective" text NOT NULL CONSTRAINT "ck_adCampaigns_objective_enum" CHECK ("objective" IN ('reach', 'website_visits', 'engagement', 'local_discovery')),
  "format" text NOT NULL CONSTRAINT "ck_adCampaigns_format_enum" CHECK ("format" IN ('sponsored_post', 'promoted_post', 'image_ad', 'video_ad')),
  "status" text NOT NULL CONSTRAINT "ck_adCampaigns_status_enum" CHECK ("status" IN ('draft', 'pending_payment', 'pending_review', 'approved', 'scheduled', 'active', 'paused', 'rejected', 'completed', 'cancelled', 'payment_failed')),
  "moderationStatus" text NOT NULL CONSTRAINT "ck_adCampaigns_moderationStatus_enum" CHECK ("moderationStatus" IN ('unreviewed', 'auto_flagged', 'pending_admin', 'approved', 'rejected', 'suspended')),
  "moderationReason" text,
  "reviewNote" text,
  "reviewedBy" text,
  "reviewedAt" double precision,
  "promotedPostId" text,
  "creative" jsonb NOT NULL CONSTRAINT "ck_adCampaigns_creative_shape" CHECK ("creative" IS NULL OR (jsonb_typeof("creative") = 'object')),
  "targeting" jsonb NOT NULL CONSTRAINT "ck_adCampaigns_targeting_shape" CHECK ("targeting" IS NULL OR (jsonb_typeof("targeting") = 'object')),
  "budget" jsonb NOT NULL CONSTRAINT "ck_adCampaigns_budget_shape" CHECK ("budget" IS NULL OR (jsonb_typeof("budget") = 'object')),
  "schedule" jsonb NOT NULL CONSTRAINT "ck_adCampaigns_schedule_shape" CHECK ("schedule" IS NULL OR (jsonb_typeof("schedule") = 'object')),
  "impressionsCount" double precision NOT NULL,
  "clicksCount" double precision NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."adCampaigns" IS 'Convex source table: adCampaigns. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."adCampaigns" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."adCampaigns" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."adCampaigns" TO service_role;
CREATE TABLE public."adPayments" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "campaignId" text NOT NULL,
  "userId" text NOT NULL,
  "amountKobo" double precision NOT NULL,
  "currency" text NOT NULL,
  "reference" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_adPayments_status_enum" CHECK ("status" IN ('pending', 'successful', 'failed', 'refunded')),
  "paystackAccessCode" text,
  "paystackTransactionId" text,
  "bachsCheckoutId" text,
  "paymentProvider" text,
  "paidAt" double precision,
  "gatewayResponse" text,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."adPayments" IS 'Convex source table: adPayments. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."adPayments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."adPayments" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."adPayments" TO service_role;
CREATE TABLE public."bachsWebhookEvents" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "eventId" text NOT NULL,
  "eventType" text NOT NULL,
  "processedAt" double precision NOT NULL
);
COMMENT ON TABLE public."bachsWebhookEvents" IS 'Convex source table: bachsWebhookEvents. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."bachsWebhookEvents" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."bachsWebhookEvents" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."bachsWebhookEvents" TO service_role;
CREATE TABLE public."adEvents" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "campaignId" text NOT NULL,
  "eventType" text NOT NULL CONSTRAINT "ck_adEvents_eventType_enum" CHECK ("eventType" IN ('impression', 'click')),
  "viewerUserId" text,
  "viewerSessionId" text NOT NULL,
  "chargeKobo" double precision NOT NULL,
  "timestamp" double precision NOT NULL,
  "dateBucket" text NOT NULL,
  "locationName" text
);
COMMENT ON TABLE public."adEvents" IS 'Convex source table: adEvents. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."adEvents" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."adEvents" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."adEvents" TO service_role;
CREATE TABLE public."adModerationLogs" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "campaignId" text NOT NULL,
  "reviewerId" text NOT NULL,
  "action" text NOT NULL CONSTRAINT "ck_adModerationLogs_action_enum" CHECK ("action" IN ('auto_flag', 'approved', 'rejected', 'suspended', 'resumed')),
  "reason" text,
  "note" text,
  "timestamp" double precision NOT NULL
);
COMMENT ON TABLE public."adModerationLogs" IS 'Convex source table: adModerationLogs. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."adModerationLogs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."adModerationLogs" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."adModerationLogs" TO service_role;
CREATE TABLE public."userRewardBalances" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "availablePoints" double precision NOT NULL,
  "pendingPoints" double precision NOT NULL,
  "lifetimePoints" double precision NOT NULL,
  "totalEarned" double precision NOT NULL,
  "totalRedeemed" double precision NOT NULL,
  "lastUpdatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."userRewardBalances" IS 'Convex source table: userRewardBalances. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."userRewardBalances" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."userRewardBalances" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."userRewardBalances" TO service_role;
CREATE TABLE public."rewardTransactions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "type" text NOT NULL CONSTRAINT "ck_rewardTransactions_type_enum" CHECK ("type" IN ('earn_purchase', 'earn_referral', 'earn_bonus', 'redeem_reward', 'reverse_purchase', 'adjustment')),
  "description" text NOT NULL,
  "amount" double precision NOT NULL,
  "pointsBefore" double precision NOT NULL,
  "pointsAfter" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_rewardTransactions_status_enum" CHECK ("status" IN ('pending', 'completed', 'reversed')),
  "relatedTransactionId" text,
  "relatedRedemptionId" text,
  "relatedReferralId" text,
  "idempotencyKey" text,
  "metadata" jsonb,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."rewardTransactions" IS 'Convex source table: rewardTransactions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."rewardTransactions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rewardTransactions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rewardTransactions" TO service_role;
CREATE TABLE public."rewardCatalogue" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "name" text NOT NULL,
  "description" text NOT NULL,
  "type" text NOT NULL CONSTRAINT "ck_rewardCatalogue_type_enum" CHECK ("type" IN ('gift_card', 'airtime', 'data_bundle', 'voucher', 'partner_offer', 'other')),
  "imageUrl" text,
  "pointsCost" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_rewardCatalogue_status_enum" CHECK ("status" IN ('active', 'inactive', 'archived')),
  "stockLimit" double precision,
  "stockRemaining" double precision,
  "availabilityStart" double precision,
  "availabilityEnd" double precision,
  "eligibilityRequirements" jsonb,
  "fulfillmentInstructions" text,
  "providerIntegration" jsonb,
  "createdBy" text NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL,
  "updatedBy" text
);
COMMENT ON TABLE public."rewardCatalogue" IS 'Convex source table: rewardCatalogue. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."rewardCatalogue" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rewardCatalogue" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rewardCatalogue" TO service_role;
CREATE TABLE public."rewardRedemptions" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "rewardId" text NOT NULL,
  "rewardName" text NOT NULL,
  "rewardType" text NOT NULL,
  "pointsCost" double precision NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_rewardRedemptions_status_enum" CHECK ("status" IN ('pending', 'approved', 'fulfilled', 'rejected', 'cancelled')),
  "rejectionReason" text,
  "fulfillmentReference" text,
  "fulfilledAt" double precision,
  "fulfilledBy" text,
  "idempotencyKey" text NOT NULL,
  "metadata" jsonb,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."rewardRedemptions" IS 'Convex source table: rewardRedemptions. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."rewardRedemptions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rewardRedemptions" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rewardRedemptions" TO service_role;
CREATE TABLE public."referralCodes" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "userId" text NOT NULL,
  "code" text NOT NULL,
  "isActive" boolean NOT NULL,
  "totalReferrals" double precision NOT NULL,
  "qualifiedReferrals" double precision NOT NULL,
  "totalPointsEarned" double precision NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."referralCodes" IS 'Convex source table: referralCodes. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."referralCodes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."referralCodes" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."referralCodes" TO service_role;
CREATE TABLE public."referralRelationships" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "referrerId" text NOT NULL,
  "referredUserId" text NOT NULL,
  "referralCode" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "ck_referralRelationships_status_enum" CHECK ("status" IN ('invited', 'registered', 'qualified', 'rewarded')),
  "qualificationRequirement" text NOT NULL,
  "qualificationCompletedAt" double precision,
  "rewardAwardedAt" double precision,
  "rewardPoints" double precision NOT NULL,
  "createdAt" double precision NOT NULL,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."referralRelationships" IS 'Convex source table: referralRelationships. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."referralRelationships" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."referralRelationships" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."referralRelationships" TO service_role;
CREATE TABLE public."rewardConfiguration" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "key" text NOT NULL,
  "value" text NOT NULL,
  "description" text NOT NULL,
  "updatedBy" text,
  "updatedAt" double precision NOT NULL
);
COMMENT ON TABLE public."rewardConfiguration" IS 'Convex source table: rewardConfiguration. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."rewardConfiguration" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rewardConfiguration" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rewardConfiguration" TO service_role;
CREATE TABLE public."rewardAdminAudit" (
  "_id" text PRIMARY KEY,
  "_creationTime" double precision NOT NULL DEFAULT (extract(epoch from clock_timestamp()) * 1000),
  "actorId" text NOT NULL,
  "action" text NOT NULL,
  "target" text,
  "before" text,
  "after" text,
  "createdAt" double precision NOT NULL
);
COMMENT ON TABLE public."rewardAdminAudit" IS 'Convex source table: rewardAdminAudit. RLS is enabled and no client policies are granted in this foundation.';
ALTER TABLE public."rewardAdminAudit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."rewardAdminAudit" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rewardAdminAudit" TO service_role;

-- Scalar v.id relationships are explicit, non-cascading and initially deferred.
ALTER TABLE public."authIdentities" ADD CONSTRAINT "fk_authIdentities_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."authLinkChallenges" ADD CONSTRAINT "fk_authLinkChallenges_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."authIdentityBackfillConflicts" ADD CONSTRAINT "fk_authIdentityBackfillConflicts_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."waitlist" ADD CONSTRAINT "fk_waitlist_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."posts" ADD CONSTRAINT "fk_posts_authorId_users" FOREIGN KEY ("authorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."posts" ADD CONSTRAINT "fk_posts_removedBy_users" FOREIGN KEY ("removedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."posts" ADD CONSTRAINT "fk_posts_removalReasonId_moderationReasons" FOREIGN KEY ("removalReasonId") REFERENCES public."moderationReasons" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."comments" ADD CONSTRAINT "fk_comments_postId_posts" FOREIGN KEY ("postId") REFERENCES public."posts" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."comments" ADD CONSTRAINT "fk_comments_authorId_users" FOREIGN KEY ("authorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."comments" ADD CONSTRAINT "fk_comments_parentCommentId_comments" FOREIGN KEY ("parentCommentId") REFERENCES public."comments" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."likes" ADD CONSTRAINT "fk_likes_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."follows" ADD CONSTRAINT "fk_follows_followerId_users" FOREIGN KEY ("followerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."follows" ADD CONSTRAINT "fk_follows_followingId_users" FOREIGN KEY ("followingId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pages" ADD CONSTRAINT "fk_pages_ownerId_users" FOREIGN KEY ("ownerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pageMembers" ADD CONSTRAINT "fk_pageMembers_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pageMembers" ADD CONSTRAINT "fk_pageMembers_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pageExtensions" ADD CONSTRAINT "fk_pageExtensions_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pageLocations" ADD CONSTRAINT "fk_pageLocations_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pageFollowers" ADD CONSTRAINT "fk_pageFollowers_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pageFollowers" ADD CONSTRAINT "fk_pageFollowers_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."conversations" ADD CONSTRAINT "fk_conversations_userA_users" FOREIGN KEY ("userA") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."conversations" ADD CONSTRAINT "fk_conversations_userB_users" FOREIGN KEY ("userB") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."conversations" ADD CONSTRAINT "fk_conversations_pageB_pages" FOREIGN KEY ("pageB") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."conversations" ADD CONSTRAINT "fk_conversations_groupChatId_groupChats" FOREIGN KEY ("groupChatId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupChats" ADD CONSTRAINT "fk_groupChats_creatorId_users" FOREIGN KEY ("creatorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupMembers" ADD CONSTRAINT "fk_groupMembers_groupId_groupChats" FOREIGN KEY ("groupId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupMembers" ADD CONSTRAINT "fk_groupMembers_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupJoinRequests" ADD CONSTRAINT "fk_groupJoinRequests_groupId_groupChats" FOREIGN KEY ("groupId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupJoinRequests" ADD CONSTRAINT "fk_groupJoinRequests_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupJoinRequests" ADD CONSTRAINT "fk_groupJoinRequests_reviewedBy_users" FOREIGN KEY ("reviewedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupInvitations" ADD CONSTRAINT "fk_groupInvitations_groupId_groupChats" FOREIGN KEY ("groupId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupInvitations" ADD CONSTRAINT "fk_groupInvitations_inviterId_users" FOREIGN KEY ("inviterId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupInvitations" ADD CONSTRAINT "fk_groupInvitations_invitedUserId_users" FOREIGN KEY ("invitedUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupFollowers" ADD CONSTRAINT "fk_groupFollowers_groupId_groupChats" FOREIGN KEY ("groupId") REFERENCES public."groupChats" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupFollowers" ADD CONSTRAINT "fk_groupFollowers_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."groupCycles" ADD CONSTRAINT "fk_groupCycles_creatorId_users" FOREIGN KEY ("creatorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messages" ADD CONSTRAINT "fk_messages_conversationId_conversations" FOREIGN KEY ("conversationId") REFERENCES public."conversations" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messages" ADD CONSTRAINT "fk_messages_senderId_users" FOREIGN KEY ("senderId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messages" ADD CONSTRAINT "fk_messages_pageSenderId_pages" FOREIGN KEY ("pageSenderId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messages" ADD CONSTRAINT "fk_messages_replyToMessageId_messages" FOREIGN KEY ("replyToMessageId") REFERENCES public."messages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."messages" ADD CONSTRAINT "fk_messages_callId_calls" FOREIGN KEY ("callId") REFERENCES public."calls" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."calls" ADD CONSTRAINT "fk_calls_callerId_users" FOREIGN KEY ("callerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."calls" ADD CONSTRAINT "fk_calls_recipientId_users" FOREIGN KEY ("recipientId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."calls" ADD CONSTRAINT "fk_calls_conversationId_conversations" FOREIGN KEY ("conversationId") REFERENCES public."conversations" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."notifications" ADD CONSTRAINT "fk_notifications_recipientId_users" FOREIGN KEY ("recipientId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."notifications" ADD CONSTRAINT "fk_notifications_actorId_users" FOREIGN KEY ("actorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."notifications" ADD CONSTRAINT "fk_notifications_postId_posts" FOREIGN KEY ("postId") REFERENCES public."posts" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."notifications" ADD CONSTRAINT "fk_notifications_commentId_comments" FOREIGN KEY ("commentId") REFERENCES public."comments" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."notifications" ADD CONSTRAINT "fk_notifications_conversationId_conversations" FOREIGN KEY ("conversationId") REFERENCES public."conversations" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."notifications" ADD CONSTRAINT "fk_notifications_messageId_messages" FOREIGN KEY ("messageId") REFERENCES public."messages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."drafts" ADD CONSTRAINT "fk_drafts_authorId_users" FOREIGN KEY ("authorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."products" ADD CONSTRAINT "fk_products_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cartItems" ADD CONSTRAINT "fk_cartItems_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cartItems" ADD CONSTRAINT "fk_cartItems_productId_products" FOREIGN KEY ("productId") REFERENCES public."products" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."orders" ADD CONSTRAINT "fk_orders_buyerId_users" FOREIGN KEY ("buyerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."orders" ADD CONSTRAINT "fk_orders_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."orderItems" ADD CONSTRAINT "fk_orderItems_orderId_orders" FOREIGN KEY ("orderId") REFERENCES public."orders" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."orderItems" ADD CONSTRAINT "fk_orderItems_productId_products" FOREIGN KEY ("productId") REFERENCES public."products" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."auctions" ADD CONSTRAINT "fk_auctions_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."auctions" ADD CONSTRAINT "fk_auctions_productId_products" FOREIGN KEY ("productId") REFERENCES public."products" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."auctionBids" ADD CONSTRAINT "fk_auctionBids_auctionId_auctions" FOREIGN KEY ("auctionId") REFERENCES public."auctions" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."auctionBids" ADD CONSTRAINT "fk_auctionBids_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cryptoWallets" ADD CONSTRAINT "fk_cryptoWallets_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."userWallets" ADD CONSTRAINT "fk_userWallets_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."walletTransactions" ADD CONSTRAINT "fk_walletTransactions_walletId_userWallets" FOREIGN KEY ("walletId") REFERENCES public."userWallets" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."walletTransactions" ADD CONSTRAINT "fk_walletTransactions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."walletTransactions" ADD CONSTRAINT "fk_walletTransactions_relatedUserId_users" FOREIGN KEY ("relatedUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."walletTransactions" ADD CONSTRAINT "fk_walletTransactions_relatedPageId_pages" FOREIGN KEY ("relatedPageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."marketTransactions" ADD CONSTRAINT "fk_marketTransactions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionListings" ADD CONSTRAINT "fk_subscriptionListings_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionListings" ADD CONSTRAINT "fk_subscriptionListings_platformId_subscriptionPlatforms" FOREIGN KEY ("platformId") REFERENCES public."subscriptionPlatforms" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionSlots" ADD CONSTRAINT "fk_subscriptionSlots_subscriptionId_subscriptionListings" FOREIGN KEY ("subscriptionId") REFERENCES public."subscriptionListings" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionSlots" ADD CONSTRAINT "fk_subscriptionSlots_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionSlots" ADD CONSTRAINT "fk_subscriptionSlots_currentMemberId_users" FOREIGN KEY ("currentMemberId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionSlots" ADD CONSTRAINT "fk_subscriptionSlots_reservedForUserId_users" FOREIGN KEY ("reservedForUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionReservations" ADD CONSTRAINT "fk_subscriptionReservations_subscriptionId_subscr_bebbe60b" FOREIGN KEY ("subscriptionId") REFERENCES public."subscriptionListings" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionReservations" ADD CONSTRAINT "fk_subscriptionReservations_slotId_subscriptionSlots" FOREIGN KEY ("slotId") REFERENCES public."subscriptionSlots" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionReservations" ADD CONSTRAINT "fk_subscriptionReservations_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionMemberships" ADD CONSTRAINT "fk_subscriptionMemberships_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionMemberships" ADD CONSTRAINT "fk_subscriptionMemberships_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionMemberships" ADD CONSTRAINT "fk_subscriptionMemberships_subscriptionId_subscri_44dbdf3d" FOREIGN KEY ("subscriptionId") REFERENCES public."subscriptionListings" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionMemberships" ADD CONSTRAINT "fk_subscriptionMemberships_slotId_subscriptionSlots" FOREIGN KEY ("slotId") REFERENCES public."subscriptionSlots" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionAuditLogs" ADD CONSTRAINT "fk_subscriptionAuditLogs_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionAuditLogs" ADD CONSTRAINT "fk_subscriptionAuditLogs_subscriptionId_subscript_e073cee0" FOREIGN KEY ("subscriptionId") REFERENCES public."subscriptionListings" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."subscriptionAuditLogs" ADD CONSTRAINT "fk_subscriptionAuditLogs_performedByUserId_users" FOREIGN KEY ("performedByUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."creatorSubscriptions" ADD CONSTRAINT "fk_creatorSubscriptions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."creatorApplications" ADD CONSTRAINT "fk_creatorApplications_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."creatorApplications" ADD CONSTRAINT "fk_creatorApplications_reviewedBy_users" FOREIGN KEY ("reviewedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."platformSettings" ADD CONSTRAINT "fk_platformSettings_updatedBy_users" FOREIGN KEY ("updatedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."auditLog" ADD CONSTRAINT "fk_auditLog_actorId_users" FOREIGN KEY ("actorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."communitySuggestions" ADD CONSTRAINT "fk_communitySuggestions_suggestedByUserId_users" FOREIGN KEY ("suggestedByUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."communitySuggestions" ADD CONSTRAINT "fk_communitySuggestions_reviewedBy_users" FOREIGN KEY ("reviewedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."communitySuggestions" ADD CONSTRAINT "fk_communitySuggestions_publishedPageId_pages" FOREIGN KEY ("publishedPageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adminSessions" ADD CONSTRAINT "fk_adminSessions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."fcmTokens" ADD CONSTRAINT "fk_fcmTokens_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pushSubscriptions" ADD CONSTRAINT "fk_pushSubscriptions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."reports" ADD CONSTRAINT "fk_reports_reporterId_users" FOREIGN KEY ("reporterId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."reports" ADD CONSTRAINT "fk_reports_assignedTo_users" FOREIGN KEY ("assignedTo") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."reports" ADD CONSTRAINT "fk_reports_resolvedBy_users" FOREIGN KEY ("resolvedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."reports" ADD CONSTRAINT "fk_reports_moderationReasonId_moderationReasons" FOREIGN KEY ("moderationReasonId") REFERENCES public."moderationReasons" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomyProfiles" ADD CONSTRAINT "fk_roomyProfiles_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomyListings" ADD CONSTRAINT "fk_roomyListings_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomySaves" ADD CONSTRAINT "fk_roomySaves_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomySaves" ADD CONSTRAINT "fk_roomySaves_listingId_roomyListings" FOREIGN KEY ("listingId") REFERENCES public."roomyListings" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomyInspections" ADD CONSTRAINT "fk_roomyInspections_requesterId_users" FOREIGN KEY ("requesterId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomyInspections" ADD CONSTRAINT "fk_roomyInspections_ownerId_users" FOREIGN KEY ("ownerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."roomyInspections" ADD CONSTRAINT "fk_roomyInspections_listingId_roomyListings" FOREIGN KEY ("listingId") REFERENCES public."roomyListings" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."recommendations" ADD CONSTRAINT "fk_recommendations_addedBy_users" FOREIGN KEY ("addedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."recommendationInteractions" ADD CONSTRAINT "fk_recommendationInteractions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."recommendationDismissals" ADD CONSTRAINT "fk_recommendationDismissals_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rallies" ADD CONSTRAINT "fk_rallies_creatorId_users" FOREIGN KEY ("creatorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rallies" ADD CONSTRAINT "fk_rallies_postId_posts" FOREIGN KEY ("postId") REFERENCES public."posts" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rallyParticipants" ADD CONSTRAINT "fk_rallyParticipants_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rallyParticipants" ADD CONSTRAINT "fk_rallyParticipants_rallyId_rallies" FOREIGN KEY ("rallyId") REFERENCES public."rallies" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pageEvents" ADD CONSTRAINT "fk_pageEvents_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."apiPlans" ADD CONSTRAINT "fk_apiPlans_partnerId_apiPartners" FOREIGN KEY ("partnerId") REFERENCES public."apiPartners" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."apiCredentials" ADD CONSTRAINT "fk_apiCredentials_partnerId_apiPartners" FOREIGN KEY ("partnerId") REFERENCES public."apiPartners" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."apiPermissions" ADD CONSTRAINT "fk_apiPermissions_partnerId_apiPartners" FOREIGN KEY ("partnerId") REFERENCES public."apiPartners" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."apiUsage" ADD CONSTRAINT "fk_apiUsage_partnerId_apiPartners" FOREIGN KEY ("partnerId") REFERENCES public."apiPartners" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."apiBilling" ADD CONSTRAINT "fk_apiBilling_partnerId_apiPartners" FOREIGN KEY ("partnerId") REFERENCES public."apiPartners" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."partnerEvents" ADD CONSTRAINT "fk_partnerEvents_partnerId_apiPartners" FOREIGN KEY ("partnerId") REFERENCES public."apiPartners" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cycleStories" ADD CONSTRAINT "fk_cycleStories_authorId_users" FOREIGN KEY ("authorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cycleStories" ADD CONSTRAINT "fk_cycleStories_groupCycleId_groupCycles" FOREIGN KEY ("groupCycleId") REFERENCES public."groupCycles" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cycleStoryInteractions" ADD CONSTRAINT "fk_cycleStoryInteractions_storyId_cycleStories" FOREIGN KEY ("storyId") REFERENCES public."cycleStories" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."cycleStoryInteractions" ADD CONSTRAINT "fk_cycleStoryInteractions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."betaTesters" ADD CONSTRAINT "fk_betaTesters_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."betaFeedback" ADD CONSTRAINT "fk_betaFeedback_testerId_betaTesters" FOREIGN KEY ("testerId") REFERENCES public."betaTesters" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."sounds" ADD CONSTRAINT "fk_sounds_creatorId_users" FOREIGN KEY ("creatorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."soundFavourites" ADD CONSTRAINT "fk_soundFavourites_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."soundFavourites" ADD CONSTRAINT "fk_soundFavourites_soundId_sounds" FOREIGN KEY ("soundId") REFERENCES public."sounds" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumProfiles" ADD CONSTRAINT "fk_plumProfiles_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumPrivatePhotoAccess" ADD CONSTRAINT "fk_plumPrivatePhotoAccess_ownerId_users" FOREIGN KEY ("ownerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumPrivatePhotoAccess" ADD CONSTRAINT "fk_plumPrivatePhotoAccess_viewerId_users" FOREIGN KEY ("viewerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumFlashes" ADD CONSTRAINT "fk_plumFlashes_senderId_users" FOREIGN KEY ("senderId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumFlashes" ADD CONSTRAINT "fk_plumFlashes_receiverId_users" FOREIGN KEY ("receiverId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumGifts" ADD CONSTRAINT "fk_plumGifts_senderId_users" FOREIGN KEY ("senderId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumGifts" ADD CONSTRAINT "fk_plumGifts_receiverId_users" FOREIGN KEY ("receiverId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumReports" ADD CONSTRAINT "fk_plumReports_reporterId_users" FOREIGN KEY ("reporterId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumReports" ADD CONSTRAINT "fk_plumReports_reportedUserId_users" FOREIGN KEY ("reportedUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumFavorites" ADD CONSTRAINT "fk_plumFavorites_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumFavorites" ADD CONSTRAINT "fk_plumFavorites_targetUserId_users" FOREIGN KEY ("targetUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumInterests" ADD CONSTRAINT "fk_plumInterests_senderId_users" FOREIGN KEY ("senderId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."plumInterests" ADD CONSTRAINT "fk_plumInterests_receiverId_users" FOREIGN KEY ("receiverId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."userTopicPreferences" ADD CONSTRAINT "fk_userTopicPreferences_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."userPagePreferences" ADD CONSTRAINT "fk_userPagePreferences_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."recentSearches" ADD CONSTRAINT "fk_recentSearches_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adCampaigns" ADD CONSTRAINT "fk_adCampaigns_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adCampaigns" ADD CONSTRAINT "fk_adCampaigns_pageId_pages" FOREIGN KEY ("pageId") REFERENCES public."pages" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adCampaigns" ADD CONSTRAINT "fk_adCampaigns_reviewedBy_users" FOREIGN KEY ("reviewedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adCampaigns" ADD CONSTRAINT "fk_adCampaigns_promotedPostId_posts" FOREIGN KEY ("promotedPostId") REFERENCES public."posts" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adPayments" ADD CONSTRAINT "fk_adPayments_campaignId_adCampaigns" FOREIGN KEY ("campaignId") REFERENCES public."adCampaigns" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adPayments" ADD CONSTRAINT "fk_adPayments_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adEvents" ADD CONSTRAINT "fk_adEvents_campaignId_adCampaigns" FOREIGN KEY ("campaignId") REFERENCES public."adCampaigns" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adEvents" ADD CONSTRAINT "fk_adEvents_viewerUserId_users" FOREIGN KEY ("viewerUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adModerationLogs" ADD CONSTRAINT "fk_adModerationLogs_campaignId_adCampaigns" FOREIGN KEY ("campaignId") REFERENCES public."adCampaigns" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."adModerationLogs" ADD CONSTRAINT "fk_adModerationLogs_reviewerId_users" FOREIGN KEY ("reviewerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."userRewardBalances" ADD CONSTRAINT "fk_userRewardBalances_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardTransactions" ADD CONSTRAINT "fk_rewardTransactions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardTransactions" ADD CONSTRAINT "fk_rewardTransactions_relatedTransactionId_wallet_8c707197" FOREIGN KEY ("relatedTransactionId") REFERENCES public."walletTransactions" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardTransactions" ADD CONSTRAINT "fk_rewardTransactions_relatedRedemptionId_rewardR_d3f66141" FOREIGN KEY ("relatedRedemptionId") REFERENCES public."rewardRedemptions" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardTransactions" ADD CONSTRAINT "fk_rewardTransactions_relatedReferralId_referralR_a902d2ce" FOREIGN KEY ("relatedReferralId") REFERENCES public."referralRelationships" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardCatalogue" ADD CONSTRAINT "fk_rewardCatalogue_createdBy_users" FOREIGN KEY ("createdBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardCatalogue" ADD CONSTRAINT "fk_rewardCatalogue_updatedBy_users" FOREIGN KEY ("updatedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardRedemptions" ADD CONSTRAINT "fk_rewardRedemptions_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardRedemptions" ADD CONSTRAINT "fk_rewardRedemptions_rewardId_rewardCatalogue" FOREIGN KEY ("rewardId") REFERENCES public."rewardCatalogue" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardRedemptions" ADD CONSTRAINT "fk_rewardRedemptions_fulfilledBy_users" FOREIGN KEY ("fulfilledBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."referralCodes" ADD CONSTRAINT "fk_referralCodes_userId_users" FOREIGN KEY ("userId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."referralRelationships" ADD CONSTRAINT "fk_referralRelationships_referrerId_users" FOREIGN KEY ("referrerId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."referralRelationships" ADD CONSTRAINT "fk_referralRelationships_referredUserId_users" FOREIGN KEY ("referredUserId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardConfiguration" ADD CONSTRAINT "fk_rewardConfiguration_updatedBy_users" FOREIGN KEY ("updatedBy") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."rewardAdminAudit" ADD CONSTRAINT "fk_rewardAdminAudit_actorId_users" FOREIGN KEY ("actorId") REFERENCES public."users" ("_id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;

-- Convex indexes are non-unique unless guarded by a verified application invariant.
CREATE INDEX "idx_users_by_token" ON public."users" ("tokenIdentifier");
CREATE INDEX "idx_users_by_email" ON public."users" ("email");
CREATE INDEX "idx_users_by_email_normalized" ON public."users" ("emailNormalized");
CREATE INDEX "idx_users_by_username" ON public."users" ("username");
CREATE INDEX "idx_users_by_role" ON public."users" ("role");
CREATE INDEX "idx_users_by_test_account" ON public."users" ("is_test_account");
CREATE INDEX "sidx_users_search_username" ON public."users" USING GIN (to_tsvector('simple', coalesce("username"::text, '')));
CREATE INDEX "sidx_users_search_name" ON public."users" USING GIN (to_tsvector('simple', coalesce("name"::text, '')));
CREATE INDEX "sidx_users_search_email" ON public."users" USING GIN (to_tsvector('simple', coalesce("email"::text, '')));
CREATE INDEX "sidx_users_search_phone" ON public."users" USING GIN (to_tsvector('simple', coalesce("phone"::text, '')));
CREATE INDEX "idx_authIdentities_by_token_identifier" ON public."authIdentities" ("tokenIdentifier");
CREATE INDEX "idx_authIdentities_by_issuer_subject" ON public."authIdentities" ("issuer", "subject");
CREATE INDEX "idx_authIdentities_by_user" ON public."authIdentities" ("userId");
CREATE INDEX "idx_authIdentities_by_email_normalized" ON public."authIdentities" ("emailNormalized");
CREATE INDEX "idx_authLinkChallenges_by_token" ON public."authLinkChallenges" ("token");
CREATE INDEX "idx_authMigrationState_by_key" ON public."authMigrationState" ("key");
CREATE INDEX "idx_emailSendLimits_by_key" ON public."emailSendLimits" ("key");
CREATE INDEX "idx_authIdentityBackfillConflicts_by_user" ON public."authIdentityBackfillConflicts" ("userId");
CREATE INDEX "idx_waitlist_by_user" ON public."waitlist" ("userId");
CREATE INDEX "idx_waitlist_by_country" ON public."waitlist" ("countryCode");
CREATE INDEX "idx_posts_by_author" ON public."posts" ("authorId");
CREATE INDEX "idx_posts_by_created" ON public."posts" ("createdAt");
CREATE INDEX "idx_posts_by_group_ref" ON public."posts" ("groupRefId");
CREATE INDEX "idx_posts_by_sound" ON public."posts" ("soundId");
CREATE INDEX "idx_posts_by_nearby_created" ON public."posts" ("nearbyEnabled", "createdAt");
CREATE INDEX "sidx_posts_search_text" ON public."posts" USING GIN (to_tsvector('simple', coalesce("text"::text, '')));
CREATE INDEX "idx_comments_by_post" ON public."comments" ("postId");
CREATE INDEX "idx_comments_by_parent" ON public."comments" ("parentCommentId");
CREATE INDEX "idx_comments_by_author" ON public."comments" ("authorId");
CREATE INDEX "idx_likes_by_user_target" ON public."likes" ("userId", "targetType", "targetId");
CREATE INDEX "idx_likes_by_target" ON public."likes" ("targetType", "targetId");
CREATE INDEX "idx_follows_by_follower" ON public."follows" ("followerId");
CREATE INDEX "idx_follows_by_following" ON public."follows" ("followingId");
CREATE INDEX "idx_follows_by_follower_following" ON public."follows" ("followerId", "followingId");
CREATE INDEX "idx_pages_by_owner" ON public."pages" ("ownerId");
CREATE INDEX "idx_pages_by_username" ON public."pages" ("username");
CREATE INDEX "sidx_pages_search_name" ON public."pages" USING GIN (to_tsvector('simple', coalesce("name"::text, '')));
CREATE INDEX "sidx_pages_search_category" ON public."pages" USING GIN (to_tsvector('simple', coalesce("category"::text, '')));
CREATE INDEX "idx_pageMembers_by_page" ON public."pageMembers" ("pageId");
CREATE INDEX "idx_pageMembers_by_user" ON public."pageMembers" ("userId");
CREATE INDEX "idx_pageMembers_by_page_user" ON public."pageMembers" ("pageId", "userId");
CREATE INDEX "idx_pageExtensions_by_page" ON public."pageExtensions" ("pageId");
CREATE INDEX "idx_pageExtensions_by_category" ON public."pageExtensions" ("category");
CREATE INDEX "idx_pageLocations_by_page" ON public."pageLocations" ("pageId");
CREATE INDEX "idx_pageFollowers_by_page_user" ON public."pageFollowers" ("pageId", "userId");
CREATE INDEX "idx_pageFollowers_by_user" ON public."pageFollowers" ("userId");
CREATE INDEX "idx_conversations_by_user_a" ON public."conversations" ("userA");
CREATE INDEX "idx_conversations_by_user_b" ON public."conversations" ("userB");
CREATE INDEX "idx_conversations_by_page_b" ON public."conversations" ("pageB");
CREATE INDEX "idx_conversations_by_group_chat" ON public."conversations" ("groupChatId");
CREATE INDEX "idx_groupChats_by_creator" ON public."groupChats" ("creatorId");
CREATE INDEX "idx_groupChats_by_username" ON public."groupChats" ("username");
CREATE INDEX "idx_groupChats_by_visibility" ON public."groupChats" ("visibility");
CREATE INDEX "idx_groupChats_by_is_chatroom" ON public."groupChats" ("isChatroom");
CREATE INDEX "idx_groupMembers_by_group" ON public."groupMembers" ("groupId");
CREATE INDEX "idx_groupMembers_by_user" ON public."groupMembers" ("userId");
CREATE INDEX "idx_groupMembers_by_group_user" ON public."groupMembers" ("groupId", "userId");
CREATE INDEX "idx_groupMembers_by_group_role" ON public."groupMembers" ("groupId", "role");
CREATE INDEX "idx_groupJoinRequests_by_group_status" ON public."groupJoinRequests" ("groupId", "status");
CREATE INDEX "idx_groupJoinRequests_by_user_status" ON public."groupJoinRequests" ("userId", "status");
CREATE INDEX "idx_groupJoinRequests_by_group_user" ON public."groupJoinRequests" ("groupId", "userId");
CREATE INDEX "idx_groupInvitations_by_group_status" ON public."groupInvitations" ("groupId", "status");
CREATE INDEX "idx_groupInvitations_by_invited_user_status" ON public."groupInvitations" ("invitedUserId", "status");
CREATE INDEX "idx_groupInvitations_by_group_invited_user" ON public."groupInvitations" ("groupId", "invitedUserId");
CREATE INDEX "idx_groupFollowers_by_group_user" ON public."groupFollowers" ("groupId", "userId");
CREATE INDEX "idx_groupFollowers_by_user" ON public."groupFollowers" ("userId");
CREATE INDEX "idx_groupFollowers_by_group" ON public."groupFollowers" ("groupId");
CREATE INDEX "idx_groupCycles_by_creator" ON public."groupCycles" ("creatorId");
CREATE INDEX "idx_messages_by_conversation" ON public."messages" ("conversationId");
CREATE INDEX "idx_messages_by_sender" ON public."messages" ("senderId");
CREATE INDEX "idx_messages_by_conversation_read" ON public."messages" ("conversationId", "isRead");
CREATE INDEX "idx_calls_by_caller" ON public."calls" ("callerId");
CREATE INDEX "idx_calls_by_recipient" ON public."calls" ("recipientId");
CREATE INDEX "idx_calls_by_conversation" ON public."calls" ("conversationId");
CREATE INDEX "idx_calls_by_recipient_status" ON public."calls" ("recipientId", "status");
CREATE INDEX "idx_calls_by_caller_status" ON public."calls" ("callerId", "status");
CREATE INDEX "idx_calls_by_channel" ON public."calls" ("channelName");
CREATE INDEX "idx_notifications_by_recipient" ON public."notifications" ("recipientId");
CREATE INDEX "idx_notifications_by_recipient_read" ON public."notifications" ("recipientId", "isRead");
CREATE INDEX "idx_notifications_by_post" ON public."notifications" ("postId");
CREATE INDEX "idx_drafts_by_author" ON public."drafts" ("authorId");
CREATE INDEX "idx_products_by_page" ON public."products" ("pageId");
CREATE INDEX "idx_cartItems_by_user" ON public."cartItems" ("userId");
CREATE INDEX "idx_orders_by_buyer" ON public."orders" ("buyerId");
CREATE INDEX "idx_orders_by_page" ON public."orders" ("pageId");
CREATE INDEX "idx_orderItems_by_order" ON public."orderItems" ("orderId");
CREATE INDEX "idx_auctions_by_page" ON public."auctions" ("pageId");
CREATE INDEX "idx_auctions_by_product" ON public."auctions" ("productId");
CREATE INDEX "idx_auctionBids_by_auction" ON public."auctionBids" ("auctionId");
CREATE INDEX "idx_auctionBids_by_user" ON public."auctionBids" ("userId");
CREATE INDEX "idx_cryptoWallets_by_user" ON public."cryptoWallets" ("userId");
CREATE INDEX "idx_userWallets_by_user" ON public."userWallets" ("userId");
CREATE INDEX "idx_walletTransactions_by_wallet" ON public."walletTransactions" ("walletId");
CREATE INDEX "idx_walletTransactions_by_user" ON public."walletTransactions" ("userId");
CREATE INDEX "idx_walletTransactions_by_user_created" ON public."walletTransactions" ("userId", "createdAt");
CREATE INDEX "idx_walletTransactions_by_created" ON public."walletTransactions" ("createdAt");
CREATE INDEX "idx_walletTransactions_by_reference" ON public."walletTransactions" ("reference");
CREATE INDEX "idx_marketTransactions_by_user" ON public."marketTransactions" ("userId");
CREATE INDEX "idx_marketTransactions_by_user_created" ON public."marketTransactions" ("userId", "createdAt");
CREATE INDEX "idx_marketTransactions_by_request_id" ON public."marketTransactions" ("requestId");
CREATE INDEX "idx_marketTransactions_by_provider_order_id" ON public."marketTransactions" ("providerOrderId");
CREATE INDEX "idx_subscriptionPlatforms_by_slug" ON public."subscriptionPlatforms" ("slug");
CREATE INDEX "idx_subscriptionListings_by_page" ON public."subscriptionListings" ("pageId");
CREATE INDEX "idx_subscriptionSlots_by_subscription" ON public."subscriptionSlots" ("subscriptionId");
CREATE INDEX "idx_subscriptionSlots_by_page" ON public."subscriptionSlots" ("pageId");
CREATE INDEX "idx_subscriptionSlots_by_subscription_status" ON public."subscriptionSlots" ("subscriptionId", "status");
CREATE INDEX "idx_subscriptionReservations_by_user" ON public."subscriptionReservations" ("userId");
CREATE INDEX "idx_subscriptionReservations_by_slot" ON public."subscriptionReservations" ("slotId");
CREATE INDEX "idx_subscriptionReservations_by_reference" ON public."subscriptionReservations" ("paystackReference");
CREATE INDEX "idx_subscriptionReservations_by_status" ON public."subscriptionReservations" ("status");
CREATE INDEX "idx_subscriptionMemberships_by_user" ON public."subscriptionMemberships" ("userId");
CREATE INDEX "idx_subscriptionMemberships_by_page" ON public."subscriptionMemberships" ("pageId");
CREATE INDEX "idx_subscriptionMemberships_by_subscription" ON public."subscriptionMemberships" ("subscriptionId");
CREATE INDEX "idx_subscriptionMemberships_by_slot" ON public."subscriptionMemberships" ("slotId");
CREATE INDEX "idx_subscriptionMemberships_by_user_subscription" ON public."subscriptionMemberships" ("userId", "subscriptionId");
CREATE INDEX "idx_subscriptionMemberships_by_status" ON public."subscriptionMemberships" ("status");
CREATE INDEX "idx_subscriptionAuditLogs_by_page" ON public."subscriptionAuditLogs" ("pageId");
CREATE INDEX "idx_subscriptionAuditLogs_by_subscription" ON public."subscriptionAuditLogs" ("subscriptionId");
CREATE INDEX "idx_subscriptionAuditLogs_by_user" ON public."subscriptionAuditLogs" ("performedByUserId");
CREATE INDEX "idx_creatorSubscriptions_by_user" ON public."creatorSubscriptions" ("userId");
CREATE INDEX "idx_creatorSubscriptions_by_bachs_reference" ON public."creatorSubscriptions" ("bachsReference");
CREATE INDEX "idx_creatorSubscriptions_by_bachs_product" ON public."creatorSubscriptions" ("bachsProductId");
CREATE INDEX "idx_creatorSubscriptions_by_bachs_subscription" ON public."creatorSubscriptions" ("bachsSubscriptionId");
CREATE INDEX "idx_creatorSubscriptions_by_status" ON public."creatorSubscriptions" ("status");
CREATE INDEX "idx_creatorSubscriptions_by_tier" ON public."creatorSubscriptions" ("tier");
CREATE INDEX "idx_creatorSubscriptions_by_user_status" ON public."creatorSubscriptions" ("userId", "status");
CREATE INDEX "idx_creatorApplications_by_user" ON public."creatorApplications" ("userId");
CREATE INDEX "idx_creatorApplications_by_status" ON public."creatorApplications" ("status");
CREATE INDEX "idx_creatorApplications_by_user_status" ON public."creatorApplications" ("userId", "status");
CREATE INDEX "idx_platformSettings_by_key" ON public."platformSettings" ("key");
CREATE INDEX "idx_auditLog_by_actor" ON public."auditLog" ("actorId");
CREATE INDEX "idx_auditLog_by_created" ON public."auditLog" ("createdAt");
CREATE INDEX "idx_communitySuggestions_by_status" ON public."communitySuggestions" ("status");
CREATE INDEX "idx_communitySuggestions_by_user" ON public."communitySuggestions" ("suggestedByUserId");
CREATE INDEX "idx_communitySuggestions_by_created" ON public."communitySuggestions" ("createdAt");
CREATE INDEX "idx_adminSessions_by_token" ON public."adminSessions" ("token");
CREATE INDEX "idx_fcmTokens_by_user" ON public."fcmTokens" ("userId");
CREATE INDEX "idx_fcmTokens_by_token" ON public."fcmTokens" ("token");
CREATE INDEX "idx_pushSubscriptions_by_user" ON public."pushSubscriptions" ("userId");
CREATE INDEX "idx_pushSubscriptions_by_endpoint" ON public."pushSubscriptions" ("endpoint");
CREATE INDEX "idx_pushSubscriptions_by_user_active" ON public."pushSubscriptions" ("userId", "isActive");
CREATE INDEX "idx_reports_by_status" ON public."reports" ("status");
CREATE INDEX "idx_reports_by_priority" ON public."reports" ("priority");
CREATE INDEX "idx_reports_by_target" ON public."reports" ("targetType", "targetId");
CREATE INDEX "idx_reports_by_reporter" ON public."reports" ("reporterId");
CREATE INDEX "idx_reports_by_created" ON public."reports" ("createdAt");
CREATE INDEX "idx_moderationReasons_by_code" ON public."moderationReasons" ("code");
CREATE INDEX "idx_topics_by_slug" ON public."topics" ("slug");
CREATE INDEX "idx_topics_by_active_order" ON public."topics" ("active", "displayOrder");
CREATE INDEX "idx_topics_by_active" ON public."topics" ("active");
CREATE INDEX "idx_topics_by_sensitive" ON public."topics" ("isSensitive");
CREATE INDEX "idx_roomyProfiles_by_user" ON public."roomyProfiles" ("userId");
CREATE INDEX "idx_roomyListings_by_user" ON public."roomyListings" ("userId");
CREATE INDEX "idx_roomyListings_by_type" ON public."roomyListings" ("type");
CREATE INDEX "idx_roomyListings_by_status" ON public."roomyListings" ("status");
CREATE INDEX "idx_roomyListings_by_location" ON public."roomyListings" ("location");
CREATE INDEX "sidx_roomyListings_search_location" ON public."roomyListings" USING GIN (to_tsvector('simple', coalesce("location"::text, '')));
CREATE INDEX "sidx_roomyListings_search_description" ON public."roomyListings" USING GIN (to_tsvector('simple', coalesce("description"::text, '')));
CREATE INDEX "idx_roomySaves_by_user" ON public."roomySaves" ("userId");
CREATE INDEX "idx_roomySaves_by_listing" ON public."roomySaves" ("listingId");
CREATE INDEX "idx_roomySaves_by_user_listing" ON public."roomySaves" ("userId", "listingId");
CREATE INDEX "idx_roomyInspections_by_requester" ON public."roomyInspections" ("requesterId");
CREATE INDEX "idx_roomyInspections_by_owner" ON public."roomyInspections" ("ownerId");
CREATE INDEX "idx_roomyInspections_by_listing" ON public."roomyInspections" ("listingId");
CREATE INDEX "idx_recommendations_by_active_priority" ON public."recommendations" ("active", "priority");
CREATE INDEX "idx_recommendations_by_target" ON public."recommendations" ("targetId");
CREATE INDEX "idx_recommendationInteractions_by_user" ON public."recommendationInteractions" ("userId");
CREATE INDEX "idx_recommendationInteractions_by_user_target_action" ON public."recommendationInteractions" ("userId", "targetId", "action");
CREATE INDEX "idx_recommendationInteractions_by_target_action" ON public."recommendationInteractions" ("targetId", "action");
CREATE INDEX "idx_recommendationDismissals_by_user" ON public."recommendationDismissals" ("userId");
CREATE INDEX "idx_recommendationDismissals_by_user_target" ON public."recommendationDismissals" ("userId", "targetId");
CREATE INDEX "idx_rallies_by_creator" ON public."rallies" ("creatorId");
CREATE INDEX "idx_rallies_by_post" ON public."rallies" ("postId");
CREATE INDEX "idx_rallies_by_status" ON public."rallies" ("status");
CREATE INDEX "idx_rallies_by_group_ref" ON public."rallies" ("groupRefId");
CREATE INDEX "idx_rallyParticipants_by_user" ON public."rallyParticipants" ("userId");
CREATE INDEX "idx_rallyParticipants_by_rally" ON public."rallyParticipants" ("rallyId");
CREATE INDEX "idx_pageEvents_by_page" ON public."pageEvents" ("pageId");
CREATE INDEX "idx_apiPartners_by_slug" ON public."apiPartners" ("slug");
CREATE INDEX "idx_apiPlans_by_partner" ON public."apiPlans" ("partnerId");
CREATE INDEX "idx_apiCredentials_by_partner" ON public."apiCredentials" ("partnerId");
CREATE INDEX "idx_apiCredentials_by_keyHash" ON public."apiCredentials" ("keyHash");
CREATE INDEX "idx_apiPermissions_by_partner" ON public."apiPermissions" ("partnerId");
CREATE INDEX "idx_apiUsage_by_partner" ON public."apiUsage" ("partnerId");
CREATE INDEX "idx_apiUsage_by_partner_month" ON public."apiUsage" ("partnerId", "monthKey");
CREATE INDEX "idx_apiBilling_by_partner" ON public."apiBilling" ("partnerId");
CREATE INDEX "idx_partnerEvents_by_partner" ON public."partnerEvents" ("partnerId");
CREATE INDEX "idx_partnerEvents_by_externalId" ON public."partnerEvents" ("partnerId", "externalId");
CREATE INDEX "idx_cycleStories_by_author" ON public."cycleStories" ("authorId");
CREATE INDEX "idx_cycleStories_by_group_cycle" ON public."cycleStories" ("groupCycleId");
CREATE INDEX "idx_cycleStories_by_expires" ON public."cycleStories" ("expiresAt");
CREATE INDEX "idx_cycleStoryInteractions_by_story" ON public."cycleStoryInteractions" ("storyId");
CREATE INDEX "idx_cycleStoryInteractions_by_story_user_type" ON public."cycleStoryInteractions" ("storyId", "userId", "type");
CREATE INDEX "idx_betaTesters_by_email" ON public."betaTesters" ("email");
CREATE INDEX "idx_betaTesters_by_user" ON public."betaTesters" ("userId");
CREATE INDEX "idx_betaFeedback_by_status" ON public."betaFeedback" ("status");
CREATE INDEX "idx_betaFeedback_by_tester" ON public."betaFeedback" ("testerEmail");
CREATE INDEX "idx_betaReleases_by_status" ON public."betaReleases" ("status");
CREATE INDEX "idx_sounds_by_creator" ON public."sounds" ("creatorId");
CREATE INDEX "idx_sounds_by_category" ON public."sounds" ("category");
CREATE INDEX "idx_sounds_by_usage" ON public."sounds" ("usageCount");
CREATE INDEX "idx_sounds_by_created" ON public."sounds" ("createdAt");
CREATE INDEX "idx_sounds_by_visibility" ON public."sounds" ("visibility");
CREATE INDEX "sidx_sounds_search_sound" ON public."sounds" USING GIN (to_tsvector('simple', coalesce("title"::text, '')));
CREATE INDEX "idx_soundFavourites_by_user" ON public."soundFavourites" ("userId");
CREATE INDEX "idx_soundFavourites_by_sound" ON public."soundFavourites" ("soundId");
CREATE INDEX "idx_soundFavourites_by_user_sound" ON public."soundFavourites" ("userId", "soundId");
CREATE INDEX "idx_plumProfiles_by_user" ON public."plumProfiles" ("userId");
CREATE INDEX "idx_plumProfiles_by_visibility" ON public."plumProfiles" ("profileVisibility");
CREATE INDEX "idx_plumProfiles_by_gender" ON public."plumProfiles" ("gender");
CREATE INDEX "idx_plumProfiles_by_updated" ON public."plumProfiles" ("updatedAt");
CREATE INDEX "idx_plumPrivatePhotoAccess_by_owner" ON public."plumPrivatePhotoAccess" ("ownerId");
CREATE INDEX "idx_plumPrivatePhotoAccess_by_viewer" ON public."plumPrivatePhotoAccess" ("viewerId");
CREATE INDEX "idx_plumPrivatePhotoAccess_by_owner_viewer" ON public."plumPrivatePhotoAccess" ("ownerId", "viewerId");
CREATE INDEX "idx_plumFlashes_by_sender" ON public."plumFlashes" ("senderId");
CREATE INDEX "idx_plumFlashes_by_receiver" ON public."plumFlashes" ("receiverId");
CREATE INDEX "idx_plumFlashes_by_sender_receiver" ON public."plumFlashes" ("senderId", "receiverId");
CREATE INDEX "idx_plumGifts_by_sender" ON public."plumGifts" ("senderId");
CREATE INDEX "idx_plumGifts_by_receiver" ON public."plumGifts" ("receiverId");
CREATE INDEX "idx_plumReports_by_reporter" ON public."plumReports" ("reporterId");
CREATE INDEX "idx_plumReports_by_reported" ON public."plumReports" ("reportedUserId");
CREATE INDEX "idx_plumFavorites_by_user" ON public."plumFavorites" ("userId");
CREATE INDEX "idx_plumFavorites_by_target" ON public."plumFavorites" ("targetUserId");
CREATE INDEX "idx_plumFavorites_by_user_target" ON public."plumFavorites" ("userId", "targetUserId");
CREATE INDEX "idx_plumInterests_by_sender" ON public."plumInterests" ("senderId");
CREATE INDEX "idx_plumInterests_by_receiver" ON public."plumInterests" ("receiverId");
CREATE INDEX "idx_plumInterests_by_sender_receiver" ON public."plumInterests" ("senderId", "receiverId");
CREATE INDEX "idx_userTopicPreferences_by_user" ON public."userTopicPreferences" ("userId");
CREATE INDEX "idx_userTopicPreferences_by_user_topic" ON public."userTopicPreferences" ("userId", "topicSlug");
CREATE INDEX "idx_userTopicPreferences_by_user_preference" ON public."userTopicPreferences" ("userId", "preference");
CREATE INDEX "idx_userPagePreferences_by_user" ON public."userPagePreferences" ("userId");
CREATE INDEX "idx_userPagePreferences_by_user_page" ON public."userPagePreferences" ("userId", "pageSlugOrId");
CREATE INDEX "idx_recentSearches_by_user" ON public."recentSearches" ("userId");
CREATE INDEX "idx_recentSearches_by_user_time" ON public."recentSearches" ("userId", "timestamp");
CREATE INDEX "idx_recentSearches_by_user_query" ON public."recentSearches" ("userId", "query");
CREATE INDEX "idx_adCampaigns_by_user" ON public."adCampaigns" ("userId");
CREATE INDEX "idx_adCampaigns_by_status" ON public."adCampaigns" ("status");
CREATE INDEX "idx_adCampaigns_by_moderation" ON public."adCampaigns" ("moderationStatus");
CREATE INDEX "idx_adCampaigns_by_status_moderation" ON public."adCampaigns" ("status", "moderationStatus");
CREATE INDEX "idx_adCampaigns_by_promoted_post" ON public."adCampaigns" ("promotedPostId");
CREATE INDEX "idx_adPayments_by_reference" ON public."adPayments" ("reference");
CREATE INDEX "idx_adPayments_by_campaign" ON public."adPayments" ("campaignId");
CREATE INDEX "idx_adPayments_by_user" ON public."adPayments" ("userId");
CREATE INDEX "idx_bachsWebhookEvents_by_event_id" ON public."bachsWebhookEvents" ("eventId");
CREATE INDEX "idx_adEvents_by_campaign" ON public."adEvents" ("campaignId");
CREATE INDEX "idx_adEvents_by_campaign_date" ON public."adEvents" ("campaignId", "dateBucket");
CREATE INDEX "idx_adEvents_by_campaign_dedup" ON public."adEvents" ("campaignId", "eventType", "viewerSessionId", "dateBucket");
CREATE INDEX "idx_adModerationLogs_by_campaign" ON public."adModerationLogs" ("campaignId");
CREATE INDEX "idx_userRewardBalances_by_user" ON public."userRewardBalances" ("userId");
CREATE INDEX "idx_rewardTransactions_by_user" ON public."rewardTransactions" ("userId");
CREATE INDEX "idx_rewardTransactions_by_user_created" ON public."rewardTransactions" ("userId", "createdAt");
CREATE INDEX "idx_rewardTransactions_by_type" ON public."rewardTransactions" ("type");
CREATE INDEX "idx_rewardTransactions_by_idempotency" ON public."rewardTransactions" ("idempotencyKey");
CREATE INDEX "idx_rewardCatalogue_by_type" ON public."rewardCatalogue" ("type");
CREATE INDEX "idx_rewardCatalogue_by_status" ON public."rewardCatalogue" ("status");
CREATE INDEX "idx_rewardRedemptions_by_user" ON public."rewardRedemptions" ("userId");
CREATE INDEX "idx_rewardRedemptions_by_user_created" ON public."rewardRedemptions" ("userId", "createdAt");
CREATE INDEX "idx_rewardRedemptions_by_status" ON public."rewardRedemptions" ("status");
CREATE INDEX "idx_rewardRedemptions_by_reward" ON public."rewardRedemptions" ("rewardId");
CREATE INDEX "idx_rewardRedemptions_by_idempotency" ON public."rewardRedemptions" ("idempotencyKey");
CREATE INDEX "idx_referralCodes_by_user" ON public."referralCodes" ("userId");
CREATE INDEX "idx_referralCodes_by_code" ON public."referralCodes" ("code");
CREATE INDEX "idx_referralRelationships_by_referrer" ON public."referralRelationships" ("referrerId");
CREATE INDEX "idx_referralRelationships_by_referred" ON public."referralRelationships" ("referredUserId");
CREATE INDEX "idx_referralRelationships_by_code" ON public."referralRelationships" ("referralCode");
CREATE INDEX "idx_referralRelationships_by_status" ON public."referralRelationships" ("status");
CREATE INDEX "idx_rewardConfiguration_by_key" ON public."rewardConfiguration" ("key");
CREATE INDEX "idx_rewardAdminAudit_by_actor" ON public."rewardAdminAudit" ("actorId");
CREATE INDEX "idx_rewardAdminAudit_by_created" ON public."rewardAdminAudit" ("createdAt");

COMMENT ON COLUMN public."users"."tokenIdentifier" IS 'Convex validator: string';
COMMENT ON COLUMN public."users"."email" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."emailNormalized" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."phone" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."name" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."username" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."avatarUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."avatarStorageId" IS 'Convex relationship target _storage; external object-storage mapping unresolved. Validator: optional(union(id(_storage),null))';
COMMENT ON COLUMN public."users"."bio" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."pronouns" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."userType" IS 'Convex validator: optional(union(literal("person"),literal("business"),literal("organization"),literal("club"),literal("community")))';
COMMENT ON COLUMN public."users"."locationName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."locationSub" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."latitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."longitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."radiusKm" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."interests" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."users"."homeFeedPreferences" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."users"."onboardingStep" IS 'Convex validator: union(literal("pending"),literal("name"),literal("profile"),literal("pronouns"),literal("location"),literal("interests"),literal("complete"))';
COMMENT ON COLUMN public."users"."followersCount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."followingCount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."users"."updatedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."users"."lastSignInProvider" IS 'Convex validator: optional(union(literal("firebase"),literal("playsole")))';
COMMENT ON COLUMN public."users"."lastSignInMethod" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."role" IS 'Convex validator: optional(union(literal("user"),literal("moderator"),literal("editor"),literal("admin"),literal("super_admin")))';
COMMENT ON COLUMN public."users"."suspended" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."users"."countryCode" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."countryName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."phoneNumber" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."phoneCountryCode" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."phoneSetupCompleted" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."users"."phoneVerified" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."users"."accessStatus" IS 'Convex validator: optional(union(literal("available"),literal("country_restricted"),literal("waitlisted")))';
COMMENT ON COLUMN public."users"."disappearingMode" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."disappearingCustomValue" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."disappearingCustomUnit" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."publicIdentityType" IS 'Convex validator: optional(union(literal("display_name"),literal("username"),literal("both")))';
COMMENT ON COLUMN public."users"."dateOfBirth" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."birthDateVisibility" IS 'Convex validator: optional(union(literal("public"),literal("age_only"),literal("private")))';
COMMENT ON COLUMN public."users"."notificationPrefs" IS 'Convex validator: optional(object({messages:optional(boolean),cycles:optional(boolean),likes:optional(boolean),comments:optional(boolean),follows:optional(boolean),mentions:optional(boolean),desktop:optional(boolean)}))';
COMMENT ON COLUMN public."users"."verificationTier" IS 'Convex validator: optional(union(literal("none"),literal("verified"),literal("priority"),literal("creator")))';
COMMENT ON COLUMN public."users"."verificationStatus" IS 'Convex validator: optional(union(literal("inactive"),literal("active"),literal("expired"),literal("cancelled")))';
COMMENT ON COLUMN public."users"."verificationExpiresAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."creatorCategory" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."creatorType" IS 'Convex validator: optional(union(literal("manga"),literal("short_movie")))';
COMMENT ON COLUMN public."users"."mangaPublisherName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."mangaCreatorAbout" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."shortMovieStudioName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."shortMovieCreatorAbout" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."users"."creatorAccountStatus" IS 'Convex validator: optional(union(literal("active"),literal("suspended"),literal("closed")))';
COMMENT ON COLUMN public."users"."creatorLevel" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."creatorEarnings" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."creatorPendingEarnings" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."creatorAchievements" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."users"."creatorPriorityWeight" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."users"."is_test_account" IS 'Convex validator: optional(boolean)';
COMMENT ON INDEX public."idx_users_by_token" IS 'Convex non-unique index by_token on users(tokenIdentifier)';
COMMENT ON INDEX public."idx_users_by_email" IS 'Convex non-unique index by_email on users(email)';
COMMENT ON INDEX public."idx_users_by_email_normalized" IS 'Convex non-unique index by_email_normalized on users(emailNormalized)';
COMMENT ON INDEX public."idx_users_by_username" IS 'Convex non-unique index by_username on users(username)';
COMMENT ON INDEX public."idx_users_by_role" IS 'Convex non-unique index by_role on users(role)';
COMMENT ON INDEX public."idx_users_by_test_account" IS 'Convex non-unique index by_test_account on users(is_test_account)';
COMMENT ON INDEX public."sidx_users_search_username" IS 'Convex full-text search index search_username; searchable field username; filter fields ';
COMMENT ON INDEX public."sidx_users_search_name" IS 'Convex full-text search index search_name; searchable field name; filter fields ';
COMMENT ON INDEX public."sidx_users_search_email" IS 'Convex full-text search index search_email; searchable field email; filter fields ';
COMMENT ON INDEX public."sidx_users_search_phone" IS 'Convex full-text search index search_phone; searchable field phone; filter fields ';
COMMENT ON COLUMN public."authIdentities"."provider" IS 'Convex validator: union(literal("firebase"),literal("playsole"))';
COMMENT ON COLUMN public."authIdentities"."issuer" IS 'Convex validator: string';
COMMENT ON COLUMN public."authIdentities"."subject" IS 'Convex validator: string';
COMMENT ON COLUMN public."authIdentities"."tokenIdentifier" IS 'Convex validator: string';
COMMENT ON COLUMN public."authIdentities"."method" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."authIdentities"."emailNormalized" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."authIdentities"."emailVerified" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."authIdentities"."linkedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_authIdentities_by_token_identifier" IS 'Convex non-unique index by_token_identifier on authIdentities(tokenIdentifier)';
COMMENT ON INDEX public."idx_authIdentities_by_issuer_subject" IS 'Convex non-unique index by_issuer_subject on authIdentities(issuer,subject)';
COMMENT ON INDEX public."idx_authIdentities_by_user" IS 'Convex non-unique index by_user on authIdentities(userId)';
COMMENT ON INDEX public."idx_authIdentities_by_email_normalized" IS 'Convex non-unique index by_email_normalized on authIdentities(emailNormalized)';
COMMENT ON COLUMN public."authLinkChallenges"."token" IS 'Convex validator: string';
COMMENT ON COLUMN public."authLinkChallenges"."initiatingTokenIdentifier" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."authLinkChallenges"."initiatingIssuer" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."authLinkChallenges"."initiatingSubject" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."authLinkChallenges"."targetProvider" IS 'Convex validator: union(literal("firebase"),literal("playsole"))';
COMMENT ON COLUMN public."authLinkChallenges"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."authLinkChallenges"."expiresAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."authLinkChallenges"."consumedAt" IS 'Convex validator: optional(float64)';
COMMENT ON INDEX public."idx_authLinkChallenges_by_token" IS 'Convex non-unique index by_token on authLinkChallenges(token)';
COMMENT ON COLUMN public."authMigrationState"."key" IS 'Convex validator: string';
COMMENT ON COLUMN public."authMigrationState"."emailNormalizedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."authMigrationState"."authIdentitiesBackfilledAt" IS 'Convex validator: optional(float64)';
COMMENT ON INDEX public."idx_authMigrationState_by_key" IS 'Convex non-unique index by_key on authMigrationState(key)';
COMMENT ON COLUMN public."emailSendLimits"."key" IS 'Convex validator: string';
COMMENT ON COLUMN public."emailSendLimits"."sentAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_emailSendLimits_by_key" IS 'Convex non-unique index by_key on emailSendLimits(key)';
COMMENT ON COLUMN public."authIdentityBackfillConflicts"."tokenIdentifier" IS 'Convex validator: string';
COMMENT ON COLUMN public."authIdentityBackfillConflicts"."notedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_authIdentityBackfillConflicts_by_user" IS 'Convex non-unique index by_user on authIdentityBackfillConflicts(userId)';
COMMENT ON COLUMN public."waitlist"."email" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."waitlist"."phoneNumber" IS 'Convex validator: string';
COMMENT ON COLUMN public."waitlist"."countryCode" IS 'Convex validator: string';
COMMENT ON COLUMN public."waitlist"."countryName" IS 'Convex validator: string';
COMMENT ON COLUMN public."waitlist"."status" IS 'Convex validator: union(literal("active"),literal("notified"))';
COMMENT ON COLUMN public."waitlist"."notifiedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."waitlist"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_waitlist_by_user" IS 'Convex non-unique index by_user on waitlist(userId)';
COMMENT ON INDEX public."idx_waitlist_by_country" IS 'Convex non-unique index by_country on waitlist(countryCode)';
COMMENT ON COLUMN public."posts"."text" IS 'Convex validator: string';
COMMENT ON COLUMN public."posts"."mediaUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."mediaStorageId" IS 'Convex relationship target _storage; external object-storage mapping unresolved. Validator: optional(id(_storage))';
COMMENT ON COLUMN public."posts"."mediaType" IS 'Convex validator: optional(union(literal("image"),literal("video")))';
COMMENT ON COLUMN public."posts"."location" IS 'Convex validator: string';
COMMENT ON COLUMN public."posts"."latitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."longitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."posts"."likesCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."posts"."commentsCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."posts"."repostsCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."posts"."audience" IS 'Convex validator: optional(union(literal("everyone"),literal("closeFriends"),literal("community"),literal("group"),literal("page"),literal("nearby"),literal("anime"),literal("interest")))';
COMMENT ON COLUMN public."posts"."replyPermission" IS 'Convex validator: optional(union(literal("everyone"),literal("followers"),literal("following"),literal("friends"),literal("closeFriends"),literal("sameInterests"),literal("mentioned")))';
COMMENT ON COLUMN public."posts"."gifUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."pollQuestion" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."pollOptions" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."posts"."pageRefId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."groupRefId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."rallyRefId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."mediaWidth" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."mediaHeight" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."moderationStatus" IS 'Convex validator: optional(union(literal("removed"),literal("flagged"),literal("safe")))';
COMMENT ON COLUMN public."posts"."removedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."removalReason" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."removalReasonCode" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."violationLevel" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."moderationNote" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."contentTopics" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."posts"."muxUploadId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."muxAssetId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."muxPlaybackId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."mediaStatus" IS 'Convex validator: optional(union(literal("uploading"),literal("processing"),literal("ready"),literal("failed")))';
COMMENT ON COLUMN public."posts"."mediaProcessingError" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."soundId" IS 'Polymorphic Convex relationship retained as text without an FK. Validator: optional(union(id(sounds),string))';
COMMENT ON COLUMN public."posts"."soundTitle" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."soundAuthorName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."soundAudioUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."soundStartOffset" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."soundVolume" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."originalAudioVolume" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."locationAccuracy" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."locationCapturedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."posts"."locationCountry" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."locationState" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."locationCity" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."locationNeighborhood" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."posts"."locationStatus" IS 'Convex validator: optional(union(literal("verified"),literal("approximate"),literal("unverified")))';
COMMENT ON COLUMN public."posts"."nearbyEnabled" IS 'Convex validator: optional(boolean)';
COMMENT ON INDEX public."idx_posts_by_author" IS 'Convex non-unique index by_author on posts(authorId)';
COMMENT ON INDEX public."idx_posts_by_created" IS 'Convex non-unique index by_created on posts(createdAt)';
COMMENT ON INDEX public."idx_posts_by_group_ref" IS 'Convex non-unique index by_group_ref on posts(groupRefId)';
COMMENT ON INDEX public."idx_posts_by_sound" IS 'Convex non-unique index by_sound on posts(soundId)';
COMMENT ON INDEX public."idx_posts_by_nearby_created" IS 'Convex non-unique index by_nearby_created on posts(nearbyEnabled,createdAt)';
COMMENT ON INDEX public."sidx_posts_search_text" IS 'Convex full-text search index search_text; searchable field text; filter fields ';
COMMENT ON COLUMN public."comments"."text" IS 'Convex validator: string';
COMMENT ON COLUMN public."comments"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."comments"."likesCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."comments"."mediaUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."comments"."mediaStorageId" IS 'Convex relationship target _storage; external object-storage mapping unresolved. Validator: optional(id(_storage))';
COMMENT ON COLUMN public."comments"."mediaType" IS 'Convex validator: optional(union(literal("image"),literal("voice"),literal("gif"),literal("sticker")))';
COMMENT ON COLUMN public."comments"."duration" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."comments"."isDeleted" IS 'Convex validator: optional(boolean)';
COMMENT ON INDEX public."idx_comments_by_post" IS 'Convex non-unique index by_post on comments(postId)';
COMMENT ON INDEX public."idx_comments_by_parent" IS 'Convex non-unique index by_parent on comments(parentCommentId)';
COMMENT ON INDEX public."idx_comments_by_author" IS 'Convex non-unique index by_author on comments(authorId)';
COMMENT ON COLUMN public."likes"."targetType" IS 'Convex validator: union(literal("post"),literal("comment"),literal("reply"))';
COMMENT ON COLUMN public."likes"."targetId" IS 'Convex validator: string';
COMMENT ON COLUMN public."likes"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_likes_by_user_target" IS 'Convex non-unique index by_user_target on likes(userId,targetType,targetId)';
COMMENT ON INDEX public."idx_likes_by_target" IS 'Convex non-unique index by_target on likes(targetType,targetId)';
COMMENT ON COLUMN public."follows"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_follows_by_follower" IS 'Convex non-unique index by_follower on follows(followerId)';
COMMENT ON INDEX public."idx_follows_by_following" IS 'Convex non-unique index by_following on follows(followingId)';
COMMENT ON INDEX public."idx_follows_by_follower_following" IS 'Convex non-unique index by_follower_following on follows(followerId,followingId)';
COMMENT ON COLUMN public."pages"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."pages"."username" IS 'Convex validator: string';
COMMENT ON COLUMN public."pages"."type" IS 'Convex validator: union(literal("business"),literal("organization"),literal("club"),literal("community"))';
COMMENT ON COLUMN public."pages"."badge" IS 'Convex validator: optional(union(literal("BIZ"),literal("ORG"),literal("CLUB"),literal("COMMUNITY")))';
COMMENT ON COLUMN public."pages"."businessType" IS 'Convex validator: optional(union(literal("commerce"),literal("subscription"),literal("hybrid")))';
COMMENT ON COLUMN public."pages"."activeTools" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."pages"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pages"."partnerType" IS 'Convex validator: optional(union(literal("COMMERCE_PARTNER"),literal("API_PARTNER")))';
COMMENT ON COLUMN public."pages"."partnerStatus" IS 'Convex validator: optional(union(literal("ACTIVE"),literal("PENDING"),literal("SUSPENDED")))';
COMMENT ON COLUMN public."pages"."ownerStatus" IS 'Convex validator: optional(union(literal("ASSIGNED"),literal("UNASSIGNED")))';
COMMENT ON COLUMN public."pages"."integrationStatus" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pages"."externalPartnerId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pages"."globalDiscoveryStatus" IS 'Convex validator: optional(union(literal("global"),literal("national"),literal("regional"),literal("local")))';
COMMENT ON COLUMN public."pages"."serviceAreas" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."pages"."isOnlineBusiness" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."pages"."location" IS 'Convex validator: string';
COMMENT ON COLUMN public."pages"."avatar" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pages"."coverImage" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pages"."category" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pages"."aboutInfo" IS 'Convex validator: optional(object({address:optional(string),phone:optional(string),email:optional(string),website:optional(string),hours:optional(string),founded:optional(string)}))';
COMMENT ON COLUMN public."pages"."followersCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."pages"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."pages"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_pages_by_owner" IS 'Convex non-unique index by_owner on pages(ownerId)';
COMMENT ON INDEX public."idx_pages_by_username" IS 'Convex non-unique index by_username on pages(username)';
COMMENT ON INDEX public."sidx_pages_search_name" IS 'Convex full-text search index search_name; searchable field name; filter fields ';
COMMENT ON INDEX public."sidx_pages_search_category" IS 'Convex full-text search index search_category; searchable field category; filter fields ';
COMMENT ON COLUMN public."pageMembers"."role" IS 'Convex validator: union(literal("owner"),literal("admin"),literal("staff"),literal("editor"))';
COMMENT ON COLUMN public."pageMembers"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."pageMembers"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_pageMembers_by_page" IS 'Convex non-unique index by_page on pageMembers(pageId)';
COMMENT ON INDEX public."idx_pageMembers_by_user" IS 'Convex non-unique index by_user on pageMembers(userId)';
COMMENT ON INDEX public."idx_pageMembers_by_page_user" IS 'Convex non-unique index by_page_user on pageMembers(pageId,userId)';
COMMENT ON COLUMN public."pageExtensions"."category" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageExtensions"."data" IS 'Convex validator: any';
COMMENT ON COLUMN public."pageExtensions"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."pageExtensions"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_pageExtensions_by_page" IS 'Convex non-unique index by_page on pageExtensions(pageId)';
COMMENT ON INDEX public."idx_pageExtensions_by_category" IS 'Convex non-unique index by_category on pageExtensions(category)';
COMMENT ON COLUMN public."pageLocations"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageLocations"."location" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageLocations"."latitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."pageLocations"."longitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."pageLocations"."isPrimary" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."pageLocations"."address" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pageLocations"."phone" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pageLocations"."hours" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pageLocations"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."pageLocations"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_pageLocations_by_page" IS 'Convex non-unique index by_page on pageLocations(pageId)';
COMMENT ON COLUMN public."pageFollowers"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_pageFollowers_by_page_user" IS 'Convex non-unique index by_page_user on pageFollowers(pageId,userId)';
COMMENT ON INDEX public."idx_pageFollowers_by_user" IS 'Convex non-unique index by_user on pageFollowers(userId)';
COMMENT ON COLUMN public."conversations"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_conversations_by_user_a" IS 'Convex non-unique index by_user_a on conversations(userA)';
COMMENT ON INDEX public."idx_conversations_by_user_b" IS 'Convex non-unique index by_user_b on conversations(userB)';
COMMENT ON INDEX public."idx_conversations_by_page_b" IS 'Convex non-unique index by_page_b on conversations(pageB)';
COMMENT ON INDEX public."idx_conversations_by_group_chat" IS 'Convex non-unique index by_group_chat on conversations(groupChatId)';
COMMENT ON COLUMN public."groupChats"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."groupChats"."username" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupChats"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupChats"."memberIds" IS 'Contains an array of Convex IDs referencing users; retained as JSONB; relational join migration unresolved. Validator: array(id(users))';
COMMENT ON COLUMN public."groupChats"."avatarUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupChats"."coverImage" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupChats"."category" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupChats"."rules" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."groupChats"."interests" IS 'Convex validator: array(string)';
COMMENT ON COLUMN public."groupChats"."visibility" IS 'Convex validator: optional(union(literal("public"),literal("private_discoverable"),literal("private_hidden")))';
COMMENT ON COLUMN public."groupChats"."communityEnabled" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."groupChats"."communityFeatures" IS 'Convex validator: optional(object({posts:boolean,replies:boolean,media:boolean,rallies:boolean}))';
COMMENT ON COLUMN public."groupChats"."publishingPermissions" IS 'Convex validator: optional(object({canPost:string,canReply:string,canUploadMedia:string,canCreateRallies:string}))';
COMMENT ON COLUMN public."groupChats"."isChatroom" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."groupChats"."allowPublicPreview" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."groupChats"."roomIcon" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupChats"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."groupChats"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_groupChats_by_creator" IS 'Convex non-unique index by_creator on groupChats(creatorId)';
COMMENT ON INDEX public."idx_groupChats_by_username" IS 'Convex non-unique index by_username on groupChats(username)';
COMMENT ON INDEX public."idx_groupChats_by_visibility" IS 'Convex non-unique index by_visibility on groupChats(visibility)';
COMMENT ON INDEX public."idx_groupChats_by_is_chatroom" IS 'Convex non-unique index by_is_chatroom on groupChats(isChatroom)';
COMMENT ON COLUMN public."groupMembers"."role" IS 'Convex validator: union(literal("owner"),literal("admin"),literal("moderator"),literal("member"))';
COMMENT ON COLUMN public."groupMembers"."joinedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_groupMembers_by_group" IS 'Convex non-unique index by_group on groupMembers(groupId)';
COMMENT ON INDEX public."idx_groupMembers_by_user" IS 'Convex non-unique index by_user on groupMembers(userId)';
COMMENT ON INDEX public."idx_groupMembers_by_group_user" IS 'Convex non-unique index by_group_user on groupMembers(groupId,userId)';
COMMENT ON INDEX public."idx_groupMembers_by_group_role" IS 'Convex non-unique index by_group_role on groupMembers(groupId,role)';
COMMENT ON COLUMN public."groupJoinRequests"."status" IS 'Convex validator: union(literal("pending"),literal("approved"),literal("rejected"))';
COMMENT ON COLUMN public."groupJoinRequests"."message" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupJoinRequests"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."groupJoinRequests"."reviewedAt" IS 'Convex validator: optional(float64)';
COMMENT ON INDEX public."idx_groupJoinRequests_by_group_status" IS 'Convex non-unique index by_group_status on groupJoinRequests(groupId,status)';
COMMENT ON INDEX public."idx_groupJoinRequests_by_user_status" IS 'Convex non-unique index by_user_status on groupJoinRequests(userId,status)';
COMMENT ON INDEX public."idx_groupJoinRequests_by_group_user" IS 'Convex non-unique index by_group_user on groupJoinRequests(groupId,userId)';
COMMENT ON COLUMN public."groupInvitations"."status" IS 'Convex validator: union(literal("pending"),literal("accepted"),literal("rejected"))';
COMMENT ON COLUMN public."groupInvitations"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."groupInvitations"."respondedAt" IS 'Convex validator: optional(float64)';
COMMENT ON INDEX public."idx_groupInvitations_by_group_status" IS 'Convex non-unique index by_group_status on groupInvitations(groupId,status)';
COMMENT ON INDEX public."idx_groupInvitations_by_invited_user_status" IS 'Convex non-unique index by_invited_user_status on groupInvitations(invitedUserId,status)';
COMMENT ON INDEX public."idx_groupInvitations_by_group_invited_user" IS 'Convex non-unique index by_group_invited_user on groupInvitations(groupId,invitedUserId)';
COMMENT ON COLUMN public."groupFollowers"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_groupFollowers_by_group_user" IS 'Convex non-unique index by_group_user on groupFollowers(groupId,userId)';
COMMENT ON INDEX public."idx_groupFollowers_by_user" IS 'Convex non-unique index by_user on groupFollowers(userId)';
COMMENT ON INDEX public."idx_groupFollowers_by_group" IS 'Convex non-unique index by_group on groupFollowers(groupId)';
COMMENT ON COLUMN public."groupCycles"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."groupCycles"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupCycles"."memberIds" IS 'Contains an array of Convex IDs referencing users; retained as JSONB; relational join migration unresolved. Validator: array(id(users))';
COMMENT ON COLUMN public."groupCycles"."interests" IS 'Convex validator: array(string)';
COMMENT ON COLUMN public."groupCycles"."avatarUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."groupCycles"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."groupCycles"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_groupCycles_by_creator" IS 'Convex non-unique index by_creator on groupCycles(creatorId)';
COMMENT ON COLUMN public."messages"."text" IS 'Convex validator: string';
COMMENT ON COLUMN public."messages"."isRead" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."messages"."readAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."messages"."isEdited" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."messages"."type" IS 'Convex validator: optional(union(literal("text"),literal("image"),literal("video"),literal("call")))';
COMMENT ON COLUMN public."messages"."callType" IS 'Convex validator: optional(union(literal("voice"),literal("video")))';
COMMENT ON COLUMN public."messages"."callDuration" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."messages"."callStatus" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."messages"."mediaStorageId" IS 'Convex relationship target _storage; external object-storage mapping unresolved. Validator: optional(id(_storage))';
COMMENT ON COLUMN public."messages"."mimeType" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."messages"."fileName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."messages"."fileSize" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."messages"."audioStorageId" IS 'Convex relationship target _storage; external object-storage mapping unresolved. Validator: optional(id(_storage))';
COMMENT ON COLUMN public."messages"."audioDuration" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."messages"."viewOnce" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."messages"."viewOnceOpened" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."messages"."viewedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."messages"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_messages_by_conversation" IS 'Convex non-unique index by_conversation on messages(conversationId)';
COMMENT ON INDEX public."idx_messages_by_sender" IS 'Convex non-unique index by_sender on messages(senderId)';
COMMENT ON INDEX public."idx_messages_by_conversation_read" IS 'Convex non-unique index by_conversation_read on messages(conversationId,isRead)';
COMMENT ON COLUMN public."calls"."type" IS 'Convex validator: union(literal("voice"),literal("video"))';
COMMENT ON COLUMN public."calls"."status" IS 'Convex validator: union(literal("calling"),literal("ringing"),literal("connected"),literal("completed"),literal("missed"),literal("declined"),literal("canceled"),literal("failed"))';
COMMENT ON COLUMN public."calls"."channelName" IS 'Convex validator: string';
COMMENT ON COLUMN public."calls"."callerUid" IS 'Convex validator: float64';
COMMENT ON COLUMN public."calls"."recipientUid" IS 'Convex validator: float64';
COMMENT ON COLUMN public."calls"."startedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."calls"."connectedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."calls"."endedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."calls"."duration" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."calls"."endReason" IS 'Convex validator: optional(string)';
COMMENT ON INDEX public."idx_calls_by_caller" IS 'Convex non-unique index by_caller on calls(callerId)';
COMMENT ON INDEX public."idx_calls_by_recipient" IS 'Convex non-unique index by_recipient on calls(recipientId)';
COMMENT ON INDEX public."idx_calls_by_conversation" IS 'Convex non-unique index by_conversation on calls(conversationId)';
COMMENT ON INDEX public."idx_calls_by_recipient_status" IS 'Convex non-unique index by_recipient_status on calls(recipientId,status)';
COMMENT ON INDEX public."idx_calls_by_caller_status" IS 'Convex non-unique index by_caller_status on calls(callerId,status)';
COMMENT ON INDEX public."idx_calls_by_channel" IS 'Convex non-unique index by_channel on calls(channelName)';
COMMENT ON COLUMN public."notifications"."type" IS 'Convex validator: union(literal("like"),literal("comment"),literal("reply"),literal("comment_like"),literal("reply_like"),literal("follow"),literal("rally_join"),literal("system_alert"),literal("message"),literal("subscription_joined"),literal("subscription_renewal"),literal("subscription_cancelled"),literal("subscription_payment_failed"),literal("missed_call"),literal("incoming_call"),literal("ad_submitted"),literal("ad_payment_confirmed"),literal("ad_approved"),literal("ad_rejected"),literal("ad_paused"),literal("ad_completed"))';
COMMENT ON COLUMN public."notifications"."targetExcerpt" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."notifications"."isRead" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."notifications"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_notifications_by_recipient" IS 'Convex non-unique index by_recipient on notifications(recipientId)';
COMMENT ON INDEX public."idx_notifications_by_recipient_read" IS 'Convex non-unique index by_recipient_read on notifications(recipientId,isRead)';
COMMENT ON INDEX public."idx_notifications_by_post" IS 'Convex non-unique index by_post on notifications(postId)';
COMMENT ON COLUMN public."drafts"."text" IS 'Convex validator: string';
COMMENT ON COLUMN public."drafts"."mediaUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."drafts"."mediaType" IS 'Convex validator: optional(union(literal("image"),literal("video")))';
COMMENT ON COLUMN public."drafts"."audience" IS 'Convex validator: optional(union(literal("everyone"),literal("closeFriends"),literal("community"),literal("page"),literal("nearby"),literal("anime"),literal("interest")))';
COMMENT ON COLUMN public."drafts"."replyPermission" IS 'Convex validator: optional(union(literal("everyone"),literal("followers"),literal("following"),literal("friends"),literal("closeFriends"),literal("sameInterests"),literal("mentioned")))';
COMMENT ON COLUMN public."drafts"."gifUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."drafts"."pollQuestion" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."drafts"."pollOptions" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."drafts"."pageRefId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."drafts"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."drafts"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_drafts_by_author" IS 'Convex non-unique index by_author on drafts(authorId)';
COMMENT ON COLUMN public."products"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."products"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."products"."price" IS 'Convex validator: float64';
COMMENT ON COLUMN public."products"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."products"."category" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."products"."stockQuantity" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."products"."inStock" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."products"."image" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."products"."images" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."products"."status" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."products"."externalProductId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."products"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."products"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_products_by_page" IS 'Convex non-unique index by_page on products(pageId)';
COMMENT ON COLUMN public."cartItems"."quantity" IS 'Convex validator: float64';
COMMENT ON COLUMN public."cartItems"."selectedOptions" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."cartItems"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_cartItems_by_user" IS 'Convex non-unique index by_user on cartItems(userId)';
COMMENT ON COLUMN public."orders"."totalAmount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."orders"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."orders"."status" IS 'Convex validator: union(literal("pending"),literal("paid"),literal("shipped"),literal("delivered"),literal("cancelled"),literal("processing"),literal("confirmed"))';
COMMENT ON COLUMN public."orders"."shippingAddress" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."orders"."externalOrderId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."orders"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_orders_by_buyer" IS 'Convex non-unique index by_buyer on orders(buyerId)';
COMMENT ON INDEX public."idx_orders_by_page" IS 'Convex non-unique index by_page on orders(pageId)';
COMMENT ON COLUMN public."orderItems"."quantity" IS 'Convex validator: float64';
COMMENT ON COLUMN public."orderItems"."priceAtPurchase" IS 'Convex validator: float64';
COMMENT ON COLUMN public."orderItems"."selectedOptions" IS 'Convex validator: optional(any)';
COMMENT ON INDEX public."idx_orderItems_by_order" IS 'Convex non-unique index by_order on orderItems(orderId)';
COMMENT ON COLUMN public."auctions"."startingBid" IS 'Convex validator: float64';
COMMENT ON COLUMN public."auctions"."currentBid" IS 'Convex validator: float64';
COMMENT ON COLUMN public."auctions"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."auctions"."endsAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."auctions"."status" IS 'Convex validator: union(literal("active"),literal("upcoming"),literal("ended"),literal("cancelled"))';
COMMENT ON COLUMN public."auctions"."externalAuctionId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."auctions"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_auctions_by_page" IS 'Convex non-unique index by_page on auctions(pageId)';
COMMENT ON INDEX public."idx_auctions_by_product" IS 'Convex non-unique index by_product on auctions(productId)';
COMMENT ON COLUMN public."auctionBids"."bidAmount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."auctionBids"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_auctionBids_by_auction" IS 'Convex non-unique index by_auction on auctionBids(auctionId)';
COMMENT ON INDEX public."idx_auctionBids_by_user" IS 'Convex non-unique index by_user on auctionBids(userId)';
COMMENT ON COLUMN public."cryptoWallets"."walletAddress" IS 'Convex validator: string';
COMMENT ON COLUMN public."cryptoWallets"."provider" IS 'Convex validator: string';
COMMENT ON COLUMN public."cryptoWallets"."network" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."cryptoWallets"."isConnected" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."cryptoWallets"."lastConnectedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_cryptoWallets_by_user" IS 'Convex non-unique index by_user on cryptoWallets(userId)';
COMMENT ON COLUMN public."userWallets"."balance" IS 'Convex validator: float64';
COMMENT ON COLUMN public."userWallets"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."userWallets"."accountNumber" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."userWallets"."accountName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."userWallets"."bankName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."userWallets"."walletPin" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."userWallets"."pinResetOtp" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."userWallets"."pinResetExpiresAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."userWallets"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_userWallets_by_user" IS 'Convex non-unique index by_user on userWallets(userId)';
COMMENT ON COLUMN public."walletTransactions"."relatedUserName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."relatedUserUsername" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."amount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."walletTransactions"."fee" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."walletTransactions"."currency" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."assetType" IS 'Convex validator: optional(union(literal("LALAO_CREDITS"),literal("CRYPTO")))';
COMMENT ON COLUMN public."walletTransactions"."blockchainNetwork" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."transactionHash" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."paymentProvider" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."providerTransactionId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."type" IS 'Convex validator: union(literal("deposit"),literal("withdrawal"),literal("subscription_payment"),literal("product_order"),literal("tournament_fee"),literal("prize_payout"),literal("transfer_out"),literal("MARKET_PURCHASE"),literal("MARKET_REFUND"),literal("gift_sent"),literal("page_payment"))';
COMMENT ON COLUMN public."walletTransactions"."status" IS 'Convex validator: union(literal("pending"),literal("processing"),literal("completed"),literal("failed"),literal("refunded"),literal("reversed"),literal("cancelled"))';
COMMENT ON COLUMN public."walletTransactions"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."walletTransactions"."reference" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."metadata" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."walletTransactions"."receiptNumber" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."walletTransactions"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_walletTransactions_by_wallet" IS 'Convex non-unique index by_wallet on walletTransactions(walletId)';
COMMENT ON INDEX public."idx_walletTransactions_by_user" IS 'Convex non-unique index by_user on walletTransactions(userId)';
COMMENT ON INDEX public."idx_walletTransactions_by_user_created" IS 'Convex non-unique index by_user_created on walletTransactions(userId,createdAt)';
COMMENT ON INDEX public."idx_walletTransactions_by_created" IS 'Convex non-unique index by_created on walletTransactions(createdAt)';
COMMENT ON INDEX public."idx_walletTransactions_by_reference" IS 'Convex non-unique index by_reference on walletTransactions(reference)';
COMMENT ON COLUMN public."marketTransactions"."type" IS 'Convex validator: string';
COMMENT ON COLUMN public."marketTransactions"."category" IS 'Convex validator: string';
COMMENT ON COLUMN public."marketTransactions"."provider" IS 'Convex validator: string';
COMMENT ON COLUMN public."marketTransactions"."status" IS 'Convex validator: union(literal("PENDING"),literal("PROCESSING"),literal("COMPLETED"),literal("FAILED"),literal("REFUNDED"),literal("REVERSED"))';
COMMENT ON COLUMN public."marketTransactions"."requestId" IS 'Convex validator: string';
COMMENT ON COLUMN public."marketTransactions"."providerOrderId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."amount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."marketTransactions"."providerAmount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."marketTransactions"."providerDiscount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."marketTransactions"."platformFee" IS 'Convex validator: float64';
COMMENT ON COLUMN public."marketTransactions"."totalAmount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."marketTransactions"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."marketTransactions"."recipient" IS 'Convex validator: string';
COMMENT ON COLUMN public."marketTransactions"."customerId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."customerName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."phone" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."network" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."variationId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."productName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."productDescription" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."token" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."units" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."meterType" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."metadata" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."marketTransactions"."errorCode" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."errorMessage" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."marketTransactions"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."marketTransactions"."updatedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."marketTransactions"."completedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."marketTransactions"."refundedAt" IS 'Convex validator: optional(float64)';
COMMENT ON INDEX public."idx_marketTransactions_by_user" IS 'Convex non-unique index by_user on marketTransactions(userId)';
COMMENT ON INDEX public."idx_marketTransactions_by_user_created" IS 'Convex non-unique index by_user_created on marketTransactions(userId,createdAt)';
COMMENT ON INDEX public."idx_marketTransactions_by_request_id" IS 'Convex non-unique index by_request_id on marketTransactions(requestId)';
COMMENT ON INDEX public."idx_marketTransactions_by_provider_order_id" IS 'Convex non-unique index by_provider_order_id on marketTransactions(providerOrderId)';
COMMENT ON COLUMN public."subscriptionPlatforms"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionPlatforms"."slug" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionPlatforms"."logo" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionPlatforms"."category" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionPlatforms"."website" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionPlatforms"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionPlatforms"."active" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."subscriptionPlatforms"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionPlatforms"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_subscriptionPlatforms_by_slug" IS 'Convex non-unique index by_slug on subscriptionPlatforms(slug)';
COMMENT ON COLUMN public."subscriptionListings"."platformName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."platformLogo" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionListings"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."category" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionListings"."totalAccountCost" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionListings"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionListings"."billingCycle" IS 'Convex validator: union(literal("monthly"),literal("quarterly"),literal("yearly"),literal("3_months"),literal("6_months"),literal("12_months"))';
COMMENT ON COLUMN public."subscriptionListings"."durationMonths" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionListings"."totalCapacity" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionListings"."defaultSlotPrice" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionListings"."allowDifferentSlotPrices" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."subscriptionListings"."accountEmail" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."providerTag" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."privateNotes" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."memberInstructions" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."eligibilityRules" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."cancellationPolicy" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."renewalRules" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionListings"."gracePeriodDays" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionListings"."benefits" IS 'Convex validator: array(string)';
COMMENT ON COLUMN public."subscriptionListings"."active" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."subscriptionListings"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionListings"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_subscriptionListings_by_page" IS 'Convex non-unique index by_page on subscriptionListings(pageId)';
COMMENT ON COLUMN public."subscriptionSlots"."slotNumber" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionSlots"."status" IS 'Convex validator: union(literal("available"),literal("reserved"),literal("occupied"),literal("paused"))';
COMMENT ON COLUMN public."subscriptionSlots"."reservationExpiresAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionSlots"."priceOverride" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionSlots"."role" IS 'Convex validator: optional(union(literal("Head of Family"),literal("Member")))';
COMMENT ON COLUMN public."subscriptionSlots"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionSlots"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_subscriptionSlots_by_subscription" IS 'Convex non-unique index by_subscription on subscriptionSlots(subscriptionId)';
COMMENT ON INDEX public."idx_subscriptionSlots_by_page" IS 'Convex non-unique index by_page on subscriptionSlots(pageId)';
COMMENT ON INDEX public."idx_subscriptionSlots_by_subscription_status" IS 'Convex non-unique index by_subscription_status on subscriptionSlots(subscriptionId,status)';
COMMENT ON COLUMN public."subscriptionReservations"."amount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionReservations"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionReservations"."durationMonths" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionReservations"."status" IS 'Convex validator: union(literal("pending"),literal("completed"),literal("expired"),literal("cancelled"))';
COMMENT ON COLUMN public."subscriptionReservations"."paymentMethod" IS 'Convex validator: union(literal("wallet"),literal("paystack"))';
COMMENT ON COLUMN public."subscriptionReservations"."paystackReference" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionReservations"."expiresAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionReservations"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionReservations"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_subscriptionReservations_by_user" IS 'Convex non-unique index by_user on subscriptionReservations(userId)';
COMMENT ON INDEX public."idx_subscriptionReservations_by_slot" IS 'Convex non-unique index by_slot on subscriptionReservations(slotId)';
COMMENT ON INDEX public."idx_subscriptionReservations_by_reference" IS 'Convex non-unique index by_reference on subscriptionReservations(paystackReference)';
COMMENT ON INDEX public."idx_subscriptionReservations_by_status" IS 'Convex non-unique index by_status on subscriptionReservations(status)';
COMMENT ON COLUMN public."subscriptionMemberships"."role" IS 'Convex validator: union(literal("Head of Family"),literal("Member"))';
COMMENT ON COLUMN public."subscriptionMemberships"."status" IS 'Convex validator: union(literal("pending"),literal("active"),literal("cancelled"),literal("past_due"),literal("expired"))';
COMMENT ON COLUMN public."subscriptionMemberships"."amount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionMemberships"."currency" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionMemberships"."durationMonths" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionMemberships"."paymentMethod" IS 'Convex validator: optional(union(literal("wallet"),literal("paystack")))';
COMMENT ON COLUMN public."subscriptionMemberships"."lastPaymentReference" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionMemberships"."lastPaymentStatus" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionMemberships"."startedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionMemberships"."currentPeriodStart" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionMemberships"."currentPeriodEnd" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionMemberships"."nextRenewalDate" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."subscriptionMemberships"."cancelAtPeriodEnd" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."subscriptionMemberships"."autoRenew" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."subscriptionMemberships"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."subscriptionMemberships"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_subscriptionMemberships_by_user" IS 'Convex non-unique index by_user on subscriptionMemberships(userId)';
COMMENT ON INDEX public."idx_subscriptionMemberships_by_page" IS 'Convex non-unique index by_page on subscriptionMemberships(pageId)';
COMMENT ON INDEX public."idx_subscriptionMemberships_by_subscription" IS 'Convex non-unique index by_subscription on subscriptionMemberships(subscriptionId)';
COMMENT ON INDEX public."idx_subscriptionMemberships_by_slot" IS 'Convex non-unique index by_slot on subscriptionMemberships(slotId)';
COMMENT ON INDEX public."idx_subscriptionMemberships_by_user_subscription" IS 'Convex non-unique index by_user_subscription on subscriptionMemberships(userId,subscriptionId)';
COMMENT ON INDEX public."idx_subscriptionMemberships_by_status" IS 'Convex non-unique index by_status on subscriptionMemberships(status)';
COMMENT ON COLUMN public."subscriptionAuditLogs"."action" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionAuditLogs"."details" IS 'Convex validator: string';
COMMENT ON COLUMN public."subscriptionAuditLogs"."metadata" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."subscriptionAuditLogs"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_subscriptionAuditLogs_by_page" IS 'Convex non-unique index by_page on subscriptionAuditLogs(pageId)';
COMMENT ON INDEX public."idx_subscriptionAuditLogs_by_subscription" IS 'Convex non-unique index by_subscription on subscriptionAuditLogs(subscriptionId)';
COMMENT ON INDEX public."idx_subscriptionAuditLogs_by_user" IS 'Convex non-unique index by_user on subscriptionAuditLogs(performedByUserId)';
COMMENT ON COLUMN public."creatorSubscriptions"."tier" IS 'Convex validator: union(literal("verified"),literal("priority"),literal("creator"))';
COMMENT ON COLUMN public."creatorSubscriptions"."status" IS 'Convex validator: union(literal("pending"),literal("active"),literal("cancelled"),literal("expired"))';
COMMENT ON COLUMN public."creatorSubscriptions"."price" IS 'Convex validator: float64';
COMMENT ON COLUMN public."creatorSubscriptions"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."creatorSubscriptions"."paymentMethod" IS 'Convex validator: string';
COMMENT ON COLUMN public."creatorSubscriptions"."paystackReference" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorSubscriptions"."bachsReference" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorSubscriptions"."bachsCheckoutId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorSubscriptions"."bachsCheckoutUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorSubscriptions"."bachsProductId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorSubscriptions"."bachsSubscriptionId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorSubscriptions"."billingStatus" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorSubscriptions"."cancelAtPeriodEnd" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."creatorSubscriptions"."startedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."creatorSubscriptions"."expiresAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."creatorSubscriptions"."cancelledAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."creatorSubscriptions"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."creatorSubscriptions"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_creatorSubscriptions_by_user" IS 'Convex non-unique index by_user on creatorSubscriptions(userId)';
COMMENT ON INDEX public."idx_creatorSubscriptions_by_bachs_reference" IS 'Convex non-unique index by_bachs_reference on creatorSubscriptions(bachsReference)';
COMMENT ON INDEX public."idx_creatorSubscriptions_by_bachs_product" IS 'Convex non-unique index by_bachs_product on creatorSubscriptions(bachsProductId)';
COMMENT ON INDEX public."idx_creatorSubscriptions_by_bachs_subscription" IS 'Convex non-unique index by_bachs_subscription on creatorSubscriptions(bachsSubscriptionId)';
COMMENT ON INDEX public."idx_creatorSubscriptions_by_status" IS 'Convex non-unique index by_status on creatorSubscriptions(status)';
COMMENT ON INDEX public."idx_creatorSubscriptions_by_tier" IS 'Convex non-unique index by_tier on creatorSubscriptions(tier)';
COMMENT ON INDEX public."idx_creatorSubscriptions_by_user_status" IS 'Convex non-unique index by_user_status on creatorSubscriptions(userId,status)';
COMMENT ON COLUMN public."creatorApplications"."creatorType" IS 'Convex validator: union(literal("manga"),literal("short_movie"))';
COMMENT ON COLUMN public."creatorApplications"."publisherName" IS 'Convex validator: string';
COMMENT ON COLUMN public."creatorApplications"."portfolioUrl" IS 'Convex validator: string';
COMMENT ON COLUMN public."creatorApplications"."sampleChapterUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorApplications"."about" IS 'Convex validator: string';
COMMENT ON COLUMN public."creatorApplications"."status" IS 'Convex validator: union(literal("pending"),literal("approved"),literal("rejected"))';
COMMENT ON COLUMN public."creatorApplications"."reviewNote" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."creatorApplications"."submittedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."creatorApplications"."reviewedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."creatorApplications"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_creatorApplications_by_user" IS 'Convex non-unique index by_user on creatorApplications(userId)';
COMMENT ON INDEX public."idx_creatorApplications_by_status" IS 'Convex non-unique index by_status on creatorApplications(status)';
COMMENT ON INDEX public."idx_creatorApplications_by_user_status" IS 'Convex non-unique index by_user_status on creatorApplications(userId,status)';
COMMENT ON COLUMN public."platformSettings"."key" IS 'Convex validator: string';
COMMENT ON COLUMN public."platformSettings"."value" IS 'Convex validator: string';
COMMENT ON COLUMN public."platformSettings"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_platformSettings_by_key" IS 'Convex non-unique index by_key on platformSettings(key)';
COMMENT ON COLUMN public."auditLog"."action" IS 'Convex validator: string';
COMMENT ON COLUMN public."auditLog"."target" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."auditLog"."before" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."auditLog"."after" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."auditLog"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_auditLog_by_actor" IS 'Convex non-unique index by_actor on auditLog(actorId)';
COMMENT ON INDEX public."idx_auditLog_by_created" IS 'Convex non-unique index by_created on auditLog(createdAt)';
COMMENT ON COLUMN public."communitySuggestions"."communityName" IS 'Convex validator: string';
COMMENT ON COLUMN public."communitySuggestions"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."communitySuggestions"."category" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."communitySuggestions"."location" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."communitySuggestions"."website" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."communitySuggestions"."reason" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."communitySuggestions"."additionalInfo" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."communitySuggestions"."status" IS 'Convex validator: union(literal("pending"),literal("under_review"),literal("approved"),literal("rejected"))';
COMMENT ON COLUMN public."communitySuggestions"."reviewedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."communitySuggestions"."adminNotes" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."communitySuggestions"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."communitySuggestions"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_communitySuggestions_by_status" IS 'Convex non-unique index by_status on communitySuggestions(status)';
COMMENT ON INDEX public."idx_communitySuggestions_by_user" IS 'Convex non-unique index by_user on communitySuggestions(suggestedByUserId)';
COMMENT ON INDEX public."idx_communitySuggestions_by_created" IS 'Convex non-unique index by_created on communitySuggestions(createdAt)';
COMMENT ON COLUMN public."adminSessions"."token" IS 'Convex validator: string';
COMMENT ON COLUMN public."adminSessions"."expiresAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_adminSessions_by_token" IS 'Convex non-unique index by_token on adminSessions(token)';
COMMENT ON COLUMN public."fcmTokens"."token" IS 'Convex validator: string';
COMMENT ON COLUMN public."fcmTokens"."userAgent" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."fcmTokens"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."fcmTokens"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_fcmTokens_by_user" IS 'Convex non-unique index by_user on fcmTokens(userId)';
COMMENT ON INDEX public."idx_fcmTokens_by_token" IS 'Convex non-unique index by_token on fcmTokens(token)';
COMMENT ON COLUMN public."pushSubscriptions"."endpoint" IS 'Convex validator: string';
COMMENT ON COLUMN public."pushSubscriptions"."p256dh" IS 'Convex validator: string';
COMMENT ON COLUMN public."pushSubscriptions"."auth" IS 'Convex validator: string';
COMMENT ON COLUMN public."pushSubscriptions"."deviceId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pushSubscriptions"."browser" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pushSubscriptions"."platform" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pushSubscriptions"."userAgent" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pushSubscriptions"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."pushSubscriptions"."updatedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."pushSubscriptions"."lastUsedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."pushSubscriptions"."isActive" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."pushSubscriptions"."provider" IS 'Convex validator: string';
COMMENT ON INDEX public."idx_pushSubscriptions_by_user" IS 'Convex non-unique index by_user on pushSubscriptions(userId)';
COMMENT ON INDEX public."idx_pushSubscriptions_by_endpoint" IS 'Convex non-unique index by_endpoint on pushSubscriptions(endpoint)';
COMMENT ON INDEX public."idx_pushSubscriptions_by_user_active" IS 'Convex non-unique index by_user_active on pushSubscriptions(userId,isActive)';
COMMENT ON COLUMN public."reports"."targetType" IS 'Convex validator: union(literal("post"),literal("user"),literal("page"),literal("comment"),literal("reply"),literal("product"),literal("event"),literal("message"),literal("roomyListing"),literal("other"))';
COMMENT ON COLUMN public."reports"."targetId" IS 'Convex validator: string';
COMMENT ON COLUMN public."reports"."reason" IS 'Convex validator: string';
COMMENT ON COLUMN public."reports"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."reports"."priority" IS 'Convex validator: union(literal("low"),literal("normal"),literal("high"),literal("critical"))';
COMMENT ON COLUMN public."reports"."status" IS 'Convex validator: union(literal("pending"),literal("under_review"),literal("resolved"),literal("dismissed"),literal("resolved_violation"),literal("resolved_no_violation"),literal("escalated"))';
COMMENT ON COLUMN public."reports"."resolvedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."reports"."resolution" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."reports"."resolutionNote" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."reports"."moderationReasonCode" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."reports"."violationLevel" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."reports"."userNotificationMessage" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."reports"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."reports"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_reports_by_status" IS 'Convex non-unique index by_status on reports(status)';
COMMENT ON INDEX public."idx_reports_by_priority" IS 'Convex non-unique index by_priority on reports(priority)';
COMMENT ON INDEX public."idx_reports_by_target" IS 'Convex non-unique index by_target on reports(targetType,targetId)';
COMMENT ON INDEX public."idx_reports_by_reporter" IS 'Convex non-unique index by_reporter on reports(reporterId)';
COMMENT ON INDEX public."idx_reports_by_created" IS 'Convex non-unique index by_created on reports(createdAt)';
COMMENT ON COLUMN public."moderationReasons"."code" IS 'Convex validator: string';
COMMENT ON COLUMN public."moderationReasons"."title" IS 'Convex validator: string';
COMMENT ON COLUMN public."moderationReasons"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."moderationReasons"."userMessage" IS 'Convex validator: string';
COMMENT ON COLUMN public."moderationReasons"."defaultSeverity" IS 'Convex validator: union(literal("low"),literal("medium"),literal("high"),literal("critical"))';
COMMENT ON COLUMN public."moderationReasons"."enabled" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."moderationReasons"."sortOrder" IS 'Convex validator: float64';
COMMENT ON COLUMN public."moderationReasons"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."moderationReasons"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_moderationReasons_by_code" IS 'Convex non-unique index by_code on moderationReasons(code)';
COMMENT ON COLUMN public."topics"."slug" IS 'Convex validator: string';
COMMENT ON COLUMN public."topics"."displayName" IS 'Convex validator: string';
COMMENT ON COLUMN public."topics"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."topics"."category" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."topics"."displayOrder" IS 'Convex validator: float64';
COMMENT ON COLUMN public."topics"."defaultEnabled" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."topics"."userSelectable" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."topics"."homeEnabled" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."topics"."icon" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."topics"."isSensitive" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."topics"."requiresExplicitOptIn" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."topics"."requiresCreatorConfirmation" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."topics"."allowAutoSuggestion" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."topics"."allowPublicAnalytics" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."topics"."active" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."topics"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."topics"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_topics_by_slug" IS 'Convex non-unique index by_slug on topics(slug)';
COMMENT ON INDEX public."idx_topics_by_active_order" IS 'Convex non-unique index by_active_order on topics(active,displayOrder)';
COMMENT ON INDEX public."idx_topics_by_active" IS 'Convex non-unique index by_active on topics(active)';
COMMENT ON INDEX public."idx_topics_by_sensitive" IS 'Convex non-unique index by_sensitive on topics(isSensitive)';
COMMENT ON COLUMN public."roomyProfiles"."university" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."campus" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."preferredLocation" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."preferredAreas" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."roomyProfiles"."budget" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."roomyProfiles"."currency" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."roomType" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."moveInPeriod" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."roommatePreferences" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."roommatesWanted" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."roomyProfiles"."lifestyle" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."roomyProfiles"."bio" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyProfiles"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."roomyProfiles"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_roomyProfiles_by_user" IS 'Convex non-unique index by_user on roomyProfiles(userId)';
COMMENT ON COLUMN public."roomyListings"."type" IS 'Convex validator: union(literal("room_offered"),literal("room_wanted"),literal("roommate_wanted"))';
COMMENT ON COLUMN public."roomyListings"."status" IS 'Convex validator: union(literal("active"),literal("filled"),literal("inactive"),literal("removed"))';
COMMENT ON COLUMN public."roomyListings"."title" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."roomyListings"."price" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."roomyListings"."currency" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."location" IS 'Convex validator: string';
COMMENT ON COLUMN public."roomyListings"."university" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."campus" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."area" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."roomType" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."availabilityDate" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."amenities" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."roomyListings"."photos" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."roomyListings"."roommatesNeeded" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."roomyListings"."preferences" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyListings"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."roomyListings"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_roomyListings_by_user" IS 'Convex non-unique index by_user on roomyListings(userId)';
COMMENT ON INDEX public."idx_roomyListings_by_type" IS 'Convex non-unique index by_type on roomyListings(type)';
COMMENT ON INDEX public."idx_roomyListings_by_status" IS 'Convex non-unique index by_status on roomyListings(status)';
COMMENT ON INDEX public."idx_roomyListings_by_location" IS 'Convex non-unique index by_location on roomyListings(location)';
COMMENT ON INDEX public."sidx_roomyListings_search_location" IS 'Convex full-text search index search_location; searchable field location; filter fields ';
COMMENT ON INDEX public."sidx_roomyListings_search_description" IS 'Convex full-text search index search_description; searchable field description; filter fields ';
COMMENT ON COLUMN public."roomySaves"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_roomySaves_by_user" IS 'Convex non-unique index by_user on roomySaves(userId)';
COMMENT ON INDEX public."idx_roomySaves_by_listing" IS 'Convex non-unique index by_listing on roomySaves(listingId)';
COMMENT ON INDEX public."idx_roomySaves_by_user_listing" IS 'Convex non-unique index by_user_listing on roomySaves(userId,listingId)';
COMMENT ON COLUMN public."roomyInspections"."status" IS 'Convex validator: union(literal("pending"),literal("accepted"),literal("declined"),literal("rescheduled"))';
COMMENT ON COLUMN public."roomyInspections"."proposedDate" IS 'Convex validator: string';
COMMENT ON COLUMN public."roomyInspections"."message" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."roomyInspections"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."roomyInspections"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_roomyInspections_by_requester" IS 'Convex non-unique index by_requester on roomyInspections(requesterId)';
COMMENT ON INDEX public."idx_roomyInspections_by_owner" IS 'Convex non-unique index by_owner on roomyInspections(ownerId)';
COMMENT ON INDEX public."idx_roomyInspections_by_listing" IS 'Convex non-unique index by_listing on roomyInspections(listingId)';
COMMENT ON COLUMN public."recommendations"."targetId" IS 'Convex validator: string';
COMMENT ON COLUMN public."recommendations"."targetType" IS 'Convex validator: union(literal("user"),literal("page"),literal("community"))';
COMMENT ON COLUMN public."recommendations"."category" IS 'Convex validator: string';
COMMENT ON COLUMN public."recommendations"."priority" IS 'Convex validator: float64';
COMMENT ON COLUMN public."recommendations"."active" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."recommendations"."reason" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."recommendations"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."recommendations"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_recommendations_by_active_priority" IS 'Convex non-unique index by_active_priority on recommendations(active,priority)';
COMMENT ON INDEX public."idx_recommendations_by_target" IS 'Convex non-unique index by_target on recommendations(targetId)';
COMMENT ON COLUMN public."recommendationInteractions"."recommendationType" IS 'Convex validator: string';
COMMENT ON COLUMN public."recommendationInteractions"."targetId" IS 'Convex validator: string';
COMMENT ON COLUMN public."recommendationInteractions"."action" IS 'Convex validator: union(literal("shown"),literal("clicked"),literal("dismissed"),literal("followed"),literal("liked"),literal("opened"))';
COMMENT ON COLUMN public."recommendationInteractions"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_recommendationInteractions_by_user" IS 'Convex non-unique index by_user on recommendationInteractions(userId)';
COMMENT ON INDEX public."idx_recommendationInteractions_by_user_target_action" IS 'Convex non-unique index by_user_target_action on recommendationInteractions(userId,targetId,action)';
COMMENT ON INDEX public."idx_recommendationInteractions_by_target_action" IS 'Convex non-unique index by_target_action on recommendationInteractions(targetId,action)';
COMMENT ON COLUMN public."recommendationDismissals"."targetId" IS 'Convex validator: string';
COMMENT ON COLUMN public."recommendationDismissals"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_recommendationDismissals_by_user" IS 'Convex non-unique index by_user on recommendationDismissals(userId)';
COMMENT ON INDEX public."idx_recommendationDismissals_by_user_target" IS 'Convex non-unique index by_user_target on recommendationDismissals(userId,targetId)';
COMMENT ON COLUMN public."rallies"."type" IS 'Convex validator: optional(union(literal("ASK"),literal("HELP"),literal("JOIN")))';
COMMENT ON COLUMN public."rallies"."title" IS 'Convex validator: string';
COMMENT ON COLUMN public."rallies"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."rallies"."location" IS 'Convex validator: string';
COMMENT ON COLUMN public."rallies"."latitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rallies"."longitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rallies"."distanceMeters" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rallies"."eventDate" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rallies"."eventTime" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rallies"."timeDate" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rallies"."category" IS 'Convex validator: optional(union(literal("Sports"),literal("Help"),literal("Meetup"),literal("Initiative"),literal("Civic"),literal("General")))';
COMMENT ON COLUMN public."rallies"."status" IS 'Convex validator: union(literal("active"),literal("completed"))';
COMMENT ON COLUMN public."rallies"."peopleNeeded" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rallies"."maxNeeded" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rallies"."compensationType" IS 'Convex validator: optional(union(literal("free"),literal("paying"),literal("charging"),literal("other")))';
COMMENT ON COLUMN public."rallies"."compensationAmount" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rallies"."participantCount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rallies"."urgency" IS 'Convex validator: optional(union(literal("normal"),literal("urgent")))';
COMMENT ON COLUMN public."rallies"."tags" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."rallies"."groupRefId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rallies"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rallies"."updatedAt" IS 'Convex validator: optional(float64)';
COMMENT ON INDEX public."idx_rallies_by_creator" IS 'Convex non-unique index by_creator on rallies(creatorId)';
COMMENT ON INDEX public."idx_rallies_by_post" IS 'Convex non-unique index by_post on rallies(postId)';
COMMENT ON INDEX public."idx_rallies_by_status" IS 'Convex non-unique index by_status on rallies(status)';
COMMENT ON INDEX public."idx_rallies_by_group_ref" IS 'Convex non-unique index by_group_ref on rallies(groupRefId)';
COMMENT ON COLUMN public."rallyParticipants"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_rallyParticipants_by_user" IS 'Convex non-unique index by_user on rallyParticipants(userId)';
COMMENT ON INDEX public."idx_rallyParticipants_by_rally" IS 'Convex non-unique index by_rally on rallyParticipants(rallyId)';
COMMENT ON COLUMN public."pageEvents"."title" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageEvents"."type" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageEvents"."coverImage" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pageEvents"."date" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageEvents"."time" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageEvents"."location" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageEvents"."isOnline" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."pageEvents"."registrationStatus" IS 'Convex validator: string';
COMMENT ON COLUMN public."pageEvents"."isTournament" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."pageEvents"."isTicketed" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."pageEvents"."ticketPrice" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."pageEvents"."prizePool" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."pageEvents"."prizeCurrency" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pageEvents"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pageEvents"."availableTickets" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."pageEvents"."totalTickets" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."pageEvents"."rules" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."pageEvents"."schedule" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."pageEvents"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_pageEvents_by_page" IS 'Convex non-unique index by_page on pageEvents(pageId)';
COMMENT ON COLUMN public."apiPartners"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiPartners"."slug" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiPartners"."contactName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."apiPartners"."contactEmail" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."apiPartners"."company" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."apiPartners"."type" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiPartners"."status" IS 'Convex validator: union(literal("active"),literal("suspended"),literal("pending"))';
COMMENT ON COLUMN public."apiPartners"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiPartners"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_apiPartners_by_slug" IS 'Convex non-unique index by_slug on apiPartners(slug)';
COMMENT ON COLUMN public."apiPlans"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiPlans"."monthlyPrice" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiPlans"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiPlans"."eventLimit" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiPlans"."requestLimit" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiPlans"."requestsPerMinute" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiPlans"."billingCycle" IS 'Convex validator: union(literal("monthly"),literal("yearly"))';
COMMENT ON COLUMN public."apiPlans"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiPlans"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_apiPlans_by_partner" IS 'Convex non-unique index by_partner on apiPlans(partnerId)';
COMMENT ON COLUMN public."apiCredentials"."environment" IS 'Convex validator: union(literal("test"),literal("live"))';
COMMENT ON COLUMN public."apiCredentials"."keyHash" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiCredentials"."prefix" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiCredentials"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiCredentials"."lastUsedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."apiCredentials"."revokedAt" IS 'Convex validator: optional(float64)';
COMMENT ON INDEX public."idx_apiCredentials_by_partner" IS 'Convex non-unique index by_partner on apiCredentials(partnerId)';
COMMENT ON INDEX public."idx_apiCredentials_by_keyHash" IS 'Convex non-unique index by_keyHash on apiCredentials(keyHash)';
COMMENT ON COLUMN public."apiPermissions"."permission" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiPermissions"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_apiPermissions_by_partner" IS 'Convex non-unique index by_partner on apiPermissions(partnerId)';
COMMENT ON COLUMN public."apiUsage"."environment" IS 'Convex validator: union(literal("test"),literal("live"))';
COMMENT ON COLUMN public."apiUsage"."endpoint" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiUsage"."method" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiUsage"."statusCode" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiUsage"."responseTimeMs" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiUsage"."timestamp" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiUsage"."monthKey" IS 'Convex validator: string';
COMMENT ON INDEX public."idx_apiUsage_by_partner" IS 'Convex non-unique index by_partner on apiUsage(partnerId)';
COMMENT ON INDEX public."idx_apiUsage_by_partner_month" IS 'Convex non-unique index by_partner_month on apiUsage(partnerId,monthKey)';
COMMENT ON COLUMN public."apiBilling"."billingPeriod" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiBilling"."amount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiBilling"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."apiBilling"."status" IS 'Convex validator: union(literal("paid"),literal("pending"),literal("overdue"),literal("suspended"))';
COMMENT ON COLUMN public."apiBilling"."dueDate" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiBilling"."paidAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."apiBilling"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."apiBilling"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_apiBilling_by_partner" IS 'Convex non-unique index by_partner on apiBilling(partnerId)';
COMMENT ON COLUMN public."partnerEvents"."externalId" IS 'Convex validator: string';
COMMENT ON COLUMN public."partnerEvents"."lalaoEventId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."title" IS 'Convex validator: string';
COMMENT ON COLUMN public."partnerEvents"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."category" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."date" IS 'Convex validator: string';
COMMENT ON COLUMN public."partnerEvents"."time" IS 'Convex validator: string';
COMMENT ON COLUMN public."partnerEvents"."locationName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."city" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."country" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."latitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."partnerEvents"."longitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."partnerEvents"."imageUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."price" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."partnerEvents"."currency" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."ticketUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."organizerName" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."partnerEvents"."status" IS 'Convex validator: union(literal("active"),literal("cancelled"),literal("draft"))';
COMMENT ON COLUMN public."partnerEvents"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."partnerEvents"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_partnerEvents_by_partner" IS 'Convex non-unique index by_partner on partnerEvents(partnerId)';
COMMENT ON INDEX public."idx_partnerEvents_by_externalId" IS 'Convex non-unique index by_externalId on partnerEvents(partnerId,externalId)';
COMMENT ON COLUMN public."cycleStories"."mediaType" IS 'Convex validator: union(literal("image"),literal("video"),literal("audio"),literal("text"))';
COMMENT ON COLUMN public."cycleStories"."mediaUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."cycleStories"."mediaStorageId" IS 'Convex relationship target _storage; external object-storage mapping unresolved. Validator: optional(id(_storage))';
COMMENT ON COLUMN public."cycleStories"."text" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."cycleStories"."caption" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."cycleStories"."backgroundColor" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."cycleStories"."textColor" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."cycleStories"."location" IS 'Convex validator: string';
COMMENT ON COLUMN public."cycleStories"."latitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."cycleStories"."longitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."cycleStories"."audience" IS 'Convex validator: optional(union(literal("community"),literal("nearby"),literal("friends")))';
COMMENT ON COLUMN public."cycleStories"."excludedUserIds" IS 'Contains an array of Convex IDs referencing users; retained as JSONB; relational join migration unresolved. Validator: optional(array(id(users)))';
COMMENT ON COLUMN public."cycleStories"."duration" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."cycleStories"."viewsCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."cycleStories"."likesCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."cycleStories"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."cycleStories"."expiresAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_cycleStories_by_author" IS 'Convex non-unique index by_author on cycleStories(authorId)';
COMMENT ON INDEX public."idx_cycleStories_by_group_cycle" IS 'Convex non-unique index by_group_cycle on cycleStories(groupCycleId)';
COMMENT ON INDEX public."idx_cycleStories_by_expires" IS 'Convex non-unique index by_expires on cycleStories(expiresAt)';
COMMENT ON COLUMN public."cycleStoryInteractions"."type" IS 'Convex validator: union(literal("view"),literal("like"),literal("reply"))';
COMMENT ON COLUMN public."cycleStoryInteractions"."replyText" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."cycleStoryInteractions"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_cycleStoryInteractions_by_story" IS 'Convex non-unique index by_story on cycleStoryInteractions(storyId)';
COMMENT ON INDEX public."idx_cycleStoryInteractions_by_story_user_type" IS 'Convex non-unique index by_story_user_type on cycleStoryInteractions(storyId,userId,type)';
COMMENT ON COLUMN public."betaTesters"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaTesters"."email" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaTesters"."phone" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaTesters"."lalaoUsername" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaTesters"."device" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaTesters"."androidVersion" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaTesters"."registrationDate" IS 'Convex validator: float64';
COMMENT ON COLUMN public."betaTesters"."status" IS 'Convex validator: union(literal("active"),literal("pending"),literal("inactive"))';
COMMENT ON INDEX public."idx_betaTesters_by_email" IS 'Convex non-unique index by_email on betaTesters(email)';
COMMENT ON INDEX public."idx_betaTesters_by_user" IS 'Convex non-unique index by_user on betaTesters(userId)';
COMMENT ON COLUMN public."betaFeedback"."testerName" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaFeedback"."testerEmail" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaFeedback"."lalaoUsername" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."betaFeedback"."type" IS 'Convex validator: union(literal("bug"),literal("suggestion"),literal("general"))';
COMMENT ON COLUMN public."betaFeedback"."feature" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaFeedback"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaFeedback"."device" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaFeedback"."priority" IS 'Convex validator: union(literal("low"),literal("medium"),literal("high"),literal("critical"))';
COMMENT ON COLUMN public."betaFeedback"."attachments" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."betaFeedback"."status" IS 'Convex validator: union(literal("open"),literal("in_review"),literal("resolved"),literal("closed"))';
COMMENT ON COLUMN public."betaFeedback"."date" IS 'Convex validator: float64';
COMMENT ON COLUMN public."betaFeedback"."internalNotes" IS 'Convex validator: optional(string)';
COMMENT ON INDEX public."idx_betaFeedback_by_status" IS 'Convex non-unique index by_status on betaFeedback(status)';
COMMENT ON INDEX public."idx_betaFeedback_by_tester" IS 'Convex non-unique index by_tester on betaFeedback(testerEmail)';
COMMENT ON COLUMN public."betaReleases"."version" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaReleases"."releaseDate" IS 'Convex validator: float64';
COMMENT ON COLUMN public."betaReleases"."apkUrl" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaReleases"."fileSize" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaReleases"."minAndroidVersion" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaReleases"."releaseNotes" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaReleases"."isCurrent" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."betaReleases"."status" IS 'Convex validator: union(literal("active"),literal("archived"))';
COMMENT ON INDEX public."idx_betaReleases_by_status" IS 'Convex non-unique index by_status on betaReleases(status)';
COMMENT ON COLUMN public."betaSettings"."openLalaoUrl" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaSettings"."betaCommunityUrl" IS 'Convex validator: string';
COMMENT ON COLUMN public."betaSettings"."faqs" IS 'Convex validator: array(object({question:string,answer:string}))';
COMMENT ON COLUMN public."sounds"."title" IS 'Convex validator: string';
COMMENT ON COLUMN public."sounds"."description" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."sounds"."category" IS 'Convex validator: union(literal("music"),literal("original"),literal("effects"),literal("voice"))';
COMMENT ON COLUMN public."sounds"."genre" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."sounds"."tags" IS 'Convex validator: optional(array(string))';
COMMENT ON COLUMN public."sounds"."duration" IS 'Convex validator: float64';
COMMENT ON COLUMN public."sounds"."audioUrl" IS 'Convex validator: string';
COMMENT ON COLUMN public."sounds"."audioStorageId" IS 'Convex relationship target _storage; external object-storage mapping unresolved. Validator: optional(id(_storage))';
COMMENT ON COLUMN public."sounds"."coverUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."sounds"."waveform" IS 'Convex validator: optional(array(float64))';
COMMENT ON COLUMN public."sounds"."visibility" IS 'Convex validator: union(literal("public"),literal("private"))';
COMMENT ON COLUMN public."sounds"."isOfficial" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."sounds"."usageCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."sounds"."favoritesCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."sounds"."license" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."sounds"."moderationStatus" IS 'Convex validator: optional(union(literal("safe"),literal("flagged"),literal("removed")))';
COMMENT ON COLUMN public."sounds"."isDeleted" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."sounds"."deletedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."sounds"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."sounds"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_sounds_by_creator" IS 'Convex non-unique index by_creator on sounds(creatorId)';
COMMENT ON INDEX public."idx_sounds_by_category" IS 'Convex non-unique index by_category on sounds(category)';
COMMENT ON INDEX public."idx_sounds_by_usage" IS 'Convex non-unique index by_usage on sounds(usageCount)';
COMMENT ON INDEX public."idx_sounds_by_created" IS 'Convex non-unique index by_created on sounds(createdAt)';
COMMENT ON INDEX public."idx_sounds_by_visibility" IS 'Convex non-unique index by_visibility on sounds(visibility)';
COMMENT ON INDEX public."sidx_sounds_search_sound" IS 'Convex full-text search index search_sound; searchable field title; filter fields category,visibility';
COMMENT ON COLUMN public."soundFavourites"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_soundFavourites_by_user" IS 'Convex non-unique index by_user on soundFavourites(userId)';
COMMENT ON INDEX public."idx_soundFavourites_by_sound" IS 'Convex non-unique index by_sound on soundFavourites(soundId)';
COMMENT ON INDEX public."idx_soundFavourites_by_user_sound" IS 'Convex non-unique index by_user_sound on soundFavourites(userId,soundId)';
COMMENT ON COLUMN public."plumProfiles"."displayName" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumProfiles"."age" IS 'Convex validator: float64';
COMMENT ON COLUMN public."plumProfiles"."gender" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumProfiles"."datingPreferences" IS 'Convex validator: array(string)';
COMMENT ON COLUMN public."plumProfiles"."bio" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumProfiles"."interests" IS 'Convex validator: array(string)';
COMMENT ON COLUMN public."plumProfiles"."datingIntentions" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumProfiles"."datingGoal" IS 'Convex validator: optional(union(literal("long_term"),literal("marriage"),literal("casual"),literal("short_term"),literal("friendship_first"),literal("open")))';
COMMENT ON COLUMN public."plumProfiles"."additionalDatingInfo" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."plumProfiles"."broadLocation" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumProfiles"."latitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."plumProfiles"."longitude" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."plumProfiles"."mainPhoto" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."plumProfiles"."publicPhotos" IS 'Convex validator: array(string)';
COMMENT ON COLUMN public."plumProfiles"."privatePhotos" IS 'Convex validator: array(string)';
COMMENT ON COLUMN public."plumProfiles"."isAgeConfirmed" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."plumProfiles"."ageConfirmedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."plumProfiles"."showOnMap" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."plumProfiles"."profileVisibility" IS 'Convex validator: union(literal("active"),literal("hidden"),literal("deactivated"))';
COMMENT ON COLUMN public."plumProfiles"."flashesReceivedCount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."plumProfiles"."giftsReceivedCount" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."plumProfiles"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."plumProfiles"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_plumProfiles_by_user" IS 'Convex non-unique index by_user on plumProfiles(userId)';
COMMENT ON INDEX public."idx_plumProfiles_by_visibility" IS 'Convex non-unique index by_visibility on plumProfiles(profileVisibility)';
COMMENT ON INDEX public."idx_plumProfiles_by_gender" IS 'Convex non-unique index by_gender on plumProfiles(gender)';
COMMENT ON INDEX public."idx_plumProfiles_by_updated" IS 'Convex non-unique index by_updated on plumProfiles(updatedAt)';
COMMENT ON COLUMN public."plumPrivatePhotoAccess"."grantedAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."plumPrivatePhotoAccess"."status" IS 'Convex validator: union(literal("granted"),literal("revoked"))';
COMMENT ON INDEX public."idx_plumPrivatePhotoAccess_by_owner" IS 'Convex non-unique index by_owner on plumPrivatePhotoAccess(ownerId)';
COMMENT ON INDEX public."idx_plumPrivatePhotoAccess_by_viewer" IS 'Convex non-unique index by_viewer on plumPrivatePhotoAccess(viewerId)';
COMMENT ON INDEX public."idx_plumPrivatePhotoAccess_by_owner_viewer" IS 'Convex non-unique index by_owner_viewer on plumPrivatePhotoAccess(ownerId,viewerId)';
COMMENT ON COLUMN public."plumFlashes"."note" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."plumFlashes"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_plumFlashes_by_sender" IS 'Convex non-unique index by_sender on plumFlashes(senderId)';
COMMENT ON INDEX public."idx_plumFlashes_by_receiver" IS 'Convex non-unique index by_receiver on plumFlashes(receiverId)';
COMMENT ON INDEX public."idx_plumFlashes_by_sender_receiver" IS 'Convex non-unique index by_sender_receiver on plumFlashes(senderId,receiverId)';
COMMENT ON COLUMN public."plumGifts"."giftId" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumGifts"."giftName" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumGifts"."giftIcon" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumGifts"."amountLC" IS 'Convex validator: float64';
COMMENT ON COLUMN public."plumGifts"."message" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."plumGifts"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_plumGifts_by_sender" IS 'Convex non-unique index by_sender on plumGifts(senderId)';
COMMENT ON INDEX public."idx_plumGifts_by_receiver" IS 'Convex non-unique index by_receiver on plumGifts(receiverId)';
COMMENT ON COLUMN public."plumReports"."reason" IS 'Convex validator: string';
COMMENT ON COLUMN public."plumReports"."details" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."plumReports"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."plumReports"."status" IS 'Convex validator: union(literal("pending"),literal("reviewed"),literal("dismissed"))';
COMMENT ON INDEX public."idx_plumReports_by_reporter" IS 'Convex non-unique index by_reporter on plumReports(reporterId)';
COMMENT ON INDEX public."idx_plumReports_by_reported" IS 'Convex non-unique index by_reported on plumReports(reportedUserId)';
COMMENT ON COLUMN public."plumFavorites"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_plumFavorites_by_user" IS 'Convex non-unique index by_user on plumFavorites(userId)';
COMMENT ON INDEX public."idx_plumFavorites_by_target" IS 'Convex non-unique index by_target on plumFavorites(targetUserId)';
COMMENT ON INDEX public."idx_plumFavorites_by_user_target" IS 'Convex non-unique index by_user_target on plumFavorites(userId,targetUserId)';
COMMENT ON COLUMN public."plumInterests"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_plumInterests_by_sender" IS 'Convex non-unique index by_sender on plumInterests(senderId)';
COMMENT ON INDEX public."idx_plumInterests_by_receiver" IS 'Convex non-unique index by_receiver on plumInterests(receiverId)';
COMMENT ON INDEX public."idx_plumInterests_by_sender_receiver" IS 'Convex non-unique index by_sender_receiver on plumInterests(senderId,receiverId)';
COMMENT ON COLUMN public."userTopicPreferences"."topicSlug" IS 'Convex validator: string';
COMMENT ON COLUMN public."userTopicPreferences"."preference" IS 'Convex validator: union(literal("interested"),literal("reduced"),literal("excluded"))';
COMMENT ON COLUMN public."userTopicPreferences"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_userTopicPreferences_by_user" IS 'Convex non-unique index by_user on userTopicPreferences(userId)';
COMMENT ON INDEX public."idx_userTopicPreferences_by_user_topic" IS 'Convex non-unique index by_user_topic on userTopicPreferences(userId,topicSlug)';
COMMENT ON INDEX public."idx_userTopicPreferences_by_user_preference" IS 'Convex non-unique index by_user_preference on userTopicPreferences(userId,preference)';
COMMENT ON COLUMN public."userPagePreferences"."pageSlugOrId" IS 'Convex validator: string';
COMMENT ON COLUMN public."userPagePreferences"."hiddenFromRecommendations" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."userPagePreferences"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_userPagePreferences_by_user" IS 'Convex non-unique index by_user on userPagePreferences(userId)';
COMMENT ON INDEX public."idx_userPagePreferences_by_user_page" IS 'Convex non-unique index by_user_page on userPagePreferences(userId,pageSlugOrId)';
COMMENT ON COLUMN public."recentSearches"."query" IS 'Convex validator: string';
COMMENT ON COLUMN public."recentSearches"."type" IS 'Convex validator: union(literal("keyword"),literal("person"),literal("page"),literal("shop"),literal("content"),literal("event"))';
COMMENT ON COLUMN public."recentSearches"."entityId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."recentSearches"."title" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."recentSearches"."subtitle" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."recentSearches"."avatarUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."recentSearches"."isVerified" IS 'Convex validator: optional(boolean)';
COMMENT ON COLUMN public."recentSearches"."verificationTier" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."recentSearches"."timestamp" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_recentSearches_by_user" IS 'Convex non-unique index by_user on recentSearches(userId)';
COMMENT ON INDEX public."idx_recentSearches_by_user_time" IS 'Convex non-unique index by_user_time on recentSearches(userId,timestamp)';
COMMENT ON INDEX public."idx_recentSearches_by_user_query" IS 'Convex non-unique index by_user_query on recentSearches(userId,query)';
COMMENT ON COLUMN public."adCampaigns"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."adCampaigns"."objective" IS 'Convex validator: union(literal("reach"),literal("website_visits"),literal("engagement"),literal("local_discovery"))';
COMMENT ON COLUMN public."adCampaigns"."format" IS 'Convex validator: union(literal("sponsored_post"),literal("promoted_post"),literal("image_ad"),literal("video_ad"))';
COMMENT ON COLUMN public."adCampaigns"."status" IS 'Convex validator: union(literal("draft"),literal("pending_payment"),literal("pending_review"),literal("approved"),literal("scheduled"),literal("active"),literal("paused"),literal("rejected"),literal("completed"),literal("cancelled"),literal("payment_failed"))';
COMMENT ON COLUMN public."adCampaigns"."moderationStatus" IS 'Convex validator: union(literal("unreviewed"),literal("auto_flagged"),literal("pending_admin"),literal("approved"),literal("rejected"),literal("suspended"))';
COMMENT ON COLUMN public."adCampaigns"."moderationReason" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adCampaigns"."reviewNote" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adCampaigns"."reviewedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."adCampaigns"."creative" IS 'Convex validator: object({headline:string,description:optional(string),mediaUrl:optional(string),mediaStorageId:optional(union(id(_storage),null)),mediaType:optional(union(literal("image"),literal("video"))),ctaLabel:union(literal("Learn More"),literal("Sign Up"),literal("Shop Now"),literal("Contact Us"),literal("Visit Profile"),literal("Order Now"),literal("Book Now"),literal("View Post")),destinationUrl:string})';
COMMENT ON COLUMN public."adCampaigns"."targeting" IS 'Convex validator: object({targetType:union(literal("local_radius"),literal("city_state"),literal("broad_nation")),locationName:optional(string),subArea:optional(string),radiusKm:optional(float64),latitude:optional(float64),longitude:optional(float64),stateOrRegion:optional(string),country:string})';
COMMENT ON COLUMN public."adCampaigns"."budget" IS 'Convex validator: object({currency:string,totalBudgetKobo:float64,dailyLimitKobo:optional(float64),spentKobo:float64})';
COMMENT ON COLUMN public."adCampaigns"."schedule" IS 'Convex validator: object({startDate:float64,endDate:float64})';
COMMENT ON COLUMN public."adCampaigns"."impressionsCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."adCampaigns"."clicksCount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."adCampaigns"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."adCampaigns"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_adCampaigns_by_user" IS 'Convex non-unique index by_user on adCampaigns(userId)';
COMMENT ON INDEX public."idx_adCampaigns_by_status" IS 'Convex non-unique index by_status on adCampaigns(status)';
COMMENT ON INDEX public."idx_adCampaigns_by_moderation" IS 'Convex non-unique index by_moderation on adCampaigns(moderationStatus)';
COMMENT ON INDEX public."idx_adCampaigns_by_status_moderation" IS 'Convex non-unique index by_status_moderation on adCampaigns(status,moderationStatus)';
COMMENT ON INDEX public."idx_adCampaigns_by_promoted_post" IS 'Convex non-unique index by_promoted_post on adCampaigns(promotedPostId)';
COMMENT ON COLUMN public."adPayments"."amountKobo" IS 'Convex validator: float64';
COMMENT ON COLUMN public."adPayments"."currency" IS 'Convex validator: string';
COMMENT ON COLUMN public."adPayments"."reference" IS 'Convex validator: string';
COMMENT ON COLUMN public."adPayments"."status" IS 'Convex validator: union(literal("pending"),literal("successful"),literal("failed"),literal("refunded"))';
COMMENT ON COLUMN public."adPayments"."paystackAccessCode" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adPayments"."paystackTransactionId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adPayments"."bachsCheckoutId" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adPayments"."paymentProvider" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adPayments"."paidAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."adPayments"."gatewayResponse" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adPayments"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."adPayments"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_adPayments_by_reference" IS 'Convex non-unique index by_reference on adPayments(reference)';
COMMENT ON INDEX public."idx_adPayments_by_campaign" IS 'Convex non-unique index by_campaign on adPayments(campaignId)';
COMMENT ON INDEX public."idx_adPayments_by_user" IS 'Convex non-unique index by_user on adPayments(userId)';
COMMENT ON COLUMN public."bachsWebhookEvents"."eventId" IS 'Convex validator: string';
COMMENT ON COLUMN public."bachsWebhookEvents"."eventType" IS 'Convex validator: string';
COMMENT ON COLUMN public."bachsWebhookEvents"."processedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_bachsWebhookEvents_by_event_id" IS 'Convex non-unique index by_event_id on bachsWebhookEvents(eventId)';
COMMENT ON COLUMN public."adEvents"."eventType" IS 'Convex validator: union(literal("impression"),literal("click"))';
COMMENT ON COLUMN public."adEvents"."viewerSessionId" IS 'Convex validator: string';
COMMENT ON COLUMN public."adEvents"."chargeKobo" IS 'Convex validator: float64';
COMMENT ON COLUMN public."adEvents"."timestamp" IS 'Convex validator: float64';
COMMENT ON COLUMN public."adEvents"."dateBucket" IS 'Convex validator: string';
COMMENT ON COLUMN public."adEvents"."locationName" IS 'Convex validator: optional(string)';
COMMENT ON INDEX public."idx_adEvents_by_campaign" IS 'Convex non-unique index by_campaign on adEvents(campaignId)';
COMMENT ON INDEX public."idx_adEvents_by_campaign_date" IS 'Convex non-unique index by_campaign_date on adEvents(campaignId,dateBucket)';
COMMENT ON INDEX public."idx_adEvents_by_campaign_dedup" IS 'Convex non-unique index by_campaign_dedup on adEvents(campaignId,eventType,viewerSessionId,dateBucket)';
COMMENT ON COLUMN public."adModerationLogs"."action" IS 'Convex validator: union(literal("auto_flag"),literal("approved"),literal("rejected"),literal("suspended"),literal("resumed"))';
COMMENT ON COLUMN public."adModerationLogs"."reason" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adModerationLogs"."note" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."adModerationLogs"."timestamp" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_adModerationLogs_by_campaign" IS 'Convex non-unique index by_campaign on adModerationLogs(campaignId)';
COMMENT ON COLUMN public."userRewardBalances"."availablePoints" IS 'Convex validator: float64';
COMMENT ON COLUMN public."userRewardBalances"."pendingPoints" IS 'Convex validator: float64';
COMMENT ON COLUMN public."userRewardBalances"."lifetimePoints" IS 'Convex validator: float64';
COMMENT ON COLUMN public."userRewardBalances"."totalEarned" IS 'Convex validator: float64';
COMMENT ON COLUMN public."userRewardBalances"."totalRedeemed" IS 'Convex validator: float64';
COMMENT ON COLUMN public."userRewardBalances"."lastUpdatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_userRewardBalances_by_user" IS 'Convex non-unique index by_user on userRewardBalances(userId)';
COMMENT ON COLUMN public."rewardTransactions"."type" IS 'Convex validator: union(literal("earn_purchase"),literal("earn_referral"),literal("earn_bonus"),literal("redeem_reward"),literal("reverse_purchase"),literal("adjustment"))';
COMMENT ON COLUMN public."rewardTransactions"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardTransactions"."amount" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rewardTransactions"."pointsBefore" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rewardTransactions"."pointsAfter" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rewardTransactions"."status" IS 'Convex validator: union(literal("pending"),literal("completed"),literal("reversed"))';
COMMENT ON COLUMN public."rewardTransactions"."idempotencyKey" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardTransactions"."metadata" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."rewardTransactions"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_rewardTransactions_by_user" IS 'Convex non-unique index by_user on rewardTransactions(userId)';
COMMENT ON INDEX public."idx_rewardTransactions_by_user_created" IS 'Convex non-unique index by_user_created on rewardTransactions(userId,createdAt)';
COMMENT ON INDEX public."idx_rewardTransactions_by_type" IS 'Convex non-unique index by_type on rewardTransactions(type)';
COMMENT ON INDEX public."idx_rewardTransactions_by_idempotency" IS 'Convex non-unique index by_idempotency on rewardTransactions(idempotencyKey)';
COMMENT ON COLUMN public."rewardCatalogue"."name" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardCatalogue"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardCatalogue"."type" IS 'Convex validator: union(literal("gift_card"),literal("airtime"),literal("data_bundle"),literal("voucher"),literal("partner_offer"),literal("other"))';
COMMENT ON COLUMN public."rewardCatalogue"."imageUrl" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardCatalogue"."pointsCost" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rewardCatalogue"."status" IS 'Convex validator: union(literal("active"),literal("inactive"),literal("archived"))';
COMMENT ON COLUMN public."rewardCatalogue"."stockLimit" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rewardCatalogue"."stockRemaining" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rewardCatalogue"."availabilityStart" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rewardCatalogue"."availabilityEnd" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rewardCatalogue"."eligibilityRequirements" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."rewardCatalogue"."fulfillmentInstructions" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardCatalogue"."providerIntegration" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."rewardCatalogue"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rewardCatalogue"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_rewardCatalogue_by_type" IS 'Convex non-unique index by_type on rewardCatalogue(type)';
COMMENT ON INDEX public."idx_rewardCatalogue_by_status" IS 'Convex non-unique index by_status on rewardCatalogue(status)';
COMMENT ON COLUMN public."rewardRedemptions"."rewardName" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardRedemptions"."rewardType" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardRedemptions"."pointsCost" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rewardRedemptions"."status" IS 'Convex validator: union(literal("pending"),literal("approved"),literal("fulfilled"),literal("rejected"),literal("cancelled"))';
COMMENT ON COLUMN public."rewardRedemptions"."rejectionReason" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardRedemptions"."fulfillmentReference" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardRedemptions"."fulfilledAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."rewardRedemptions"."idempotencyKey" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardRedemptions"."metadata" IS 'Convex validator: optional(any)';
COMMENT ON COLUMN public."rewardRedemptions"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."rewardRedemptions"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_rewardRedemptions_by_user" IS 'Convex non-unique index by_user on rewardRedemptions(userId)';
COMMENT ON INDEX public."idx_rewardRedemptions_by_user_created" IS 'Convex non-unique index by_user_created on rewardRedemptions(userId,createdAt)';
COMMENT ON INDEX public."idx_rewardRedemptions_by_status" IS 'Convex non-unique index by_status on rewardRedemptions(status)';
COMMENT ON INDEX public."idx_rewardRedemptions_by_reward" IS 'Convex non-unique index by_reward on rewardRedemptions(rewardId)';
COMMENT ON INDEX public."idx_rewardRedemptions_by_idempotency" IS 'Convex non-unique index by_idempotency on rewardRedemptions(idempotencyKey)';
COMMENT ON COLUMN public."referralCodes"."code" IS 'Convex validator: string';
COMMENT ON COLUMN public."referralCodes"."isActive" IS 'Convex validator: boolean';
COMMENT ON COLUMN public."referralCodes"."totalReferrals" IS 'Convex validator: float64';
COMMENT ON COLUMN public."referralCodes"."qualifiedReferrals" IS 'Convex validator: float64';
COMMENT ON COLUMN public."referralCodes"."totalPointsEarned" IS 'Convex validator: float64';
COMMENT ON COLUMN public."referralCodes"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."referralCodes"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_referralCodes_by_user" IS 'Convex non-unique index by_user on referralCodes(userId)';
COMMENT ON INDEX public."idx_referralCodes_by_code" IS 'Convex non-unique index by_code on referralCodes(code)';
COMMENT ON COLUMN public."referralRelationships"."referralCode" IS 'Convex validator: string';
COMMENT ON COLUMN public."referralRelationships"."status" IS 'Convex validator: union(literal("invited"),literal("registered"),literal("qualified"),literal("rewarded"))';
COMMENT ON COLUMN public."referralRelationships"."qualificationRequirement" IS 'Convex validator: string';
COMMENT ON COLUMN public."referralRelationships"."qualificationCompletedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."referralRelationships"."rewardAwardedAt" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."referralRelationships"."rewardPoints" IS 'Convex validator: float64';
COMMENT ON COLUMN public."referralRelationships"."createdAt" IS 'Convex validator: float64';
COMMENT ON COLUMN public."referralRelationships"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_referralRelationships_by_referrer" IS 'Convex non-unique index by_referrer on referralRelationships(referrerId)';
COMMENT ON INDEX public."idx_referralRelationships_by_referred" IS 'Convex non-unique index by_referred on referralRelationships(referredUserId)';
COMMENT ON INDEX public."idx_referralRelationships_by_code" IS 'Convex non-unique index by_code on referralRelationships(referralCode)';
COMMENT ON INDEX public."idx_referralRelationships_by_status" IS 'Convex non-unique index by_status on referralRelationships(status)';
COMMENT ON COLUMN public."rewardConfiguration"."key" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardConfiguration"."value" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardConfiguration"."description" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardConfiguration"."updatedAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_rewardConfiguration_by_key" IS 'Convex non-unique index by_key on rewardConfiguration(key)';
COMMENT ON COLUMN public."rewardAdminAudit"."action" IS 'Convex validator: string';
COMMENT ON COLUMN public."rewardAdminAudit"."target" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardAdminAudit"."before" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardAdminAudit"."after" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."rewardAdminAudit"."createdAt" IS 'Convex validator: float64';
COMMENT ON INDEX public."idx_rewardAdminAudit_by_actor" IS 'Convex non-unique index by_actor on rewardAdminAudit(actorId)';
COMMENT ON INDEX public."idx_rewardAdminAudit_by_created" IS 'Convex non-unique index by_created on rewardAdminAudit(createdAt)';

-- Enforce known atomic uniqueness/idempotency invariants in the new store.
CREATE UNIQUE INDEX "uq_authIdentities_issuer_subject" ON public."authIdentities" ("issuer", "subject");
CREATE UNIQUE INDEX "uq_authIdentities_tokenIdentifier" ON public."authIdentities" ("tokenIdentifier");
CREATE UNIQUE INDEX "uq_bachsWebhookEvents_eventId" ON public."bachsWebhookEvents" ("eventId");

COMMIT;
