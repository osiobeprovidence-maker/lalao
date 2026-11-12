import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getUserByAuthIdentity } from "./lib/authIdentity";
import { canAccessGroupChat } from "./groupAccess";
import { resolveUserVerification } from "./social";
import { CHATROOM_MESSAGE_TTL_MS } from "./lib/chatroomMessageExpiry";

// ==========================================
// LIVE ROOM — MEMBERS, ROLES & VISIBILITY
// ==========================================

async function getAuthedUserLocal(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await getUserByAuthIdentity(ctx, identity);
}

async function getRoomForUser(ctx: any, groupId: any) {
  const user = await getAuthedUserLocal(ctx);
  if (!user) return { error: "Not authenticated" as const };
  const room = await ctx.db.get(groupId);
  if (!room || !room.isChatroom || room.chatroomStatus === "inactive") {
    return { error: "Room not found or unavailable" as const };
  }
  const memberIds = room.memberIds.map((id: any) => id.toString());
  if (!canAccessGroupChat(user._id.toString(), room.creatorId.toString(), memberIds)) {
    return { error: "You are not a member of this room" as const };
  }
  return { user, room };
}

async function getRoomRole(ctx: any, groupChatId: any, userId: any): Promise<"owner" | "admin" | "moderator" | "member" | null> {
  const room = await ctx.db.get(groupChatId);
  if (!room) return null;
  if (room.creatorId === userId) return "owner";
  const record = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_user", (q: any) => q.eq("groupId", groupChatId).eq("userId", userId))
    .first();
  return (record?.role as any) ?? "member";
}

const TOPIC_EXTENSION_MS = 24 * 60 * 60 * 1000;

// ==========================================
// PURE RETENTION POLICY (unit-testable)
// ==========================================

export function isLiveRoomMessageVisible(params: {
  message: {
    createdAt: number;
    expiresAt?: number;
    expiredAt?: number;
    pinnedAt?: number;
    topicId?: string;
    senderId?: string;
  };
  isMentionedRecipient: boolean;
  isActiveTopic?: boolean;
  now?: number;
}): boolean {
  const { message, isMentionedRecipient, isActiveTopic, now = Date.now() } = params;
  // Pinned messages are visible until unpinned.
  if (message.pinnedAt) return true;
  // Topic-related messages stay visible while their topic is active.
  if (message.topicId && isActiveTopic) return true;
  // A tombstoned or ordinarily expired message survives ONLY for explicit recipients.
  const expired = message.expiredAt !== undefined || (message.expiresAt !== undefined && now >= message.expiresAt);
  if (expired) return isMentionedRecipient;
  return true;
}

/**
 * Deletion policy for room messages (ordinary messages only):
 * a message becomes eligible for removal once it has expired AND the room has
 * "moved on" (it has messages newer than this message's expiry). Quiet rooms keep
 * their history. Pinned/mentioned/topic-linked messages are never hard-deleted.
 */
export function roomDeletionEligible(params: {
  expiredAt?: number;
  expiresAt?: number;
  pinnedAt?: number;
  topicId?: string;
  topicActive?: boolean;
  hasMentions?: boolean;
  hasNewerMessage?: boolean;
  now?: number;
}): boolean {
  const { expiredAt, expiresAt, pinnedAt, topicId, topicActive, hasMentions, hasNewerMessage, now = Date.now() } = params;
  if (pinnedAt) return false;
  if (hasMentions) return false;
  if (topicId && topicActive) return false;
  const expired = expiredAt !== undefined || (expiresAt !== undefined && now >= expiresAt);
  if (!expired) return false;
  if (!hasNewerMessage) return false; // quiet room: keep history
  return true;
}

// ==========================================
// TOPICS
// ==========================================

export const createRoomTopic = mutation({
  args: {
    groupId: v.id("groupChats"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await getRoomForUser(ctx, args.groupId);
    if ("error" in access) throw new Error(access.error);
    const { user, room } = access;
    const title = args.title.trim();
    if (!title) throw new Error("Topic title is required");
    if (title.length > 120) throw new Error("Topic title is too long (max 120 characters)");
    if (args.description && args.description.length > 500) throw new Error("Topic description is too long (max 500 characters)");

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_group_chat", (q: any) => q.eq("groupChatId", room._id))
      .first();
    if (!conversation) throw new Error("Room conversation is not available");

    const now = Date.now();
    const expiresAt = now + TOPIC_EXTENSION_MS;
    const topicId = await ctx.db.insert("roomTopics", {
      groupChatId: room._id,
      conversationId: conversation._id,
      createdBy: user._id,
      title,
      description: args.description?.trim() || undefined,
      expiresAt,
      originalExpiresAt: expiresAt,
      extensionCount: 0,
      pinned: true,
      createdAt: now,
      updatedAt: now,
    });
    return { topicId, expiresAt };
  },
});

export const getRoomTopics = query({
  args: { groupId: v.id("groupChats"), includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const access = await getRoomForUser(ctx, args.groupId);
    if ("error" in access) return { error: access.error, active: [], archived: [] } as const;
    const { user } = access;
    const now = Date.now();
    const topics = await ctx.db
      .query("roomTopics")
      .withIndex("by_group_created", (q: any) => q.eq("groupChatId", args.groupId))
      .order("desc")
      .collect();

    const withCreator = await Promise.all(topics.map(async (t) => {
      const creator = await ctx.db.get(t.createdBy);
      return {
        _id: t._id,
        id: t._id,
        title: t.title,
        description: t.description,
        expiresAt: t.expiresAt,
        originalExpiresAt: t.originalExpiresAt,
        extensionCount: t.extensionCount,
        pinned: t.pinned,
        archivedAt: t.archivedAt,
        isActive: !t.archivedAt && t.expiresAt > now,
        createdAt: t.createdAt,
        canManage: t.createdBy === user._id || ["owner", "admin", "moderator"].includes((await getRoomRole(ctx, args.groupId, user._id)) ?? "member"),
        creator: creator ? {
          _id: creator._id,
          id: creator._id,
          name: creator.name ?? "Member",
          username: creator.username ?? "member",
          avatarUrl: creator.avatarUrl ?? "",
        } : null,
      };
    }));

    const active = withCreator.filter((t) => t.isActive);
    const archived = args.includeArchived ? withCreator.filter((t) => !t.isActive) : [];
    return { active, archived };
  },
});

export const extendRoomTopic = mutation({
  args: { topicId: v.id("roomTopics") },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");
    const user = await getAuthedUserLocal(ctx);
    if (!user) throw new Error("Not authenticated");
    const role = await getRoomRole(ctx, topic.groupChatId, user._id);
    const canManage = topic.createdBy === user._id || (role && ["owner", "admin", "moderator"].includes(role));
    if (!canManage) throw new Error("Only the topic creator or a room moderator can extend this topic");
    if (topic.archivedAt) throw new Error("This topic has already expired");

    const now = Date.now();
    const newExpiresAt = Math.max(topic.expiresAt, now) + TOPIC_EXTENSION_MS;
    await ctx.db.patch(topic._id, {
      expiresAt: newExpiresAt,
      extensionCount: topic.extensionCount + 1,
      updatedAt: now,
    });
    return { expiresAt: newExpiresAt, extensionCount: topic.extensionCount + 1 };
  },
});

export const setRoomTopicPin = mutation({
  args: { topicId: v.id("roomTopics"), pinned: v.boolean() },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");
    const user = await getAuthedUserLocal(ctx);
    if (!user) throw new Error("Not authenticated");
    const role = await getRoomRole(ctx, topic.groupChatId, user._id);
    if (!role || !["owner", "admin", "moderator"].includes(role)) {
      throw new Error("Only room moderators and above can pin or unpin topics");
    }
    await ctx.db.patch(topic._id, { pinned: args.pinned, updatedAt: Date.now() });
    return { pinned: args.pinned };
  },
});

export const archiveExpiredTopics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("roomTopics")
      .withIndex("by_group_active", (q: any) => q.lt("expiresAt", now))
      .collect();
    for (const topic of expired) {
      if (topic.archivedAt) continue;
      await ctx.db.patch(topic._id, { archivedAt: now, updatedAt: now });
      // Topic messages become ordinary messages with ordinary retention from here on.
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", topic.conversationId))
        .collect();
      for (const message of messages) {
        if (message.topicId === topic._id && !message.pinnedAt && message.expiredAt === undefined && (message.expiresAt === undefined || message.expiresAt > now)) {
          await ctx.db.patch(message._id, { expiresAt: now + CHATROOM_MESSAGE_TTL_MS });
        }
      }
    }
    return { archived: expired.length };
  },
});

// ==========================================
// PINNED MESSAGES
// ==========================================

export const pinRoomMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getAuthedUserLocal(ctx);
    if (!user) throw new Error("Not authenticated");
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation?.groupChatId) throw new Error("Pinning is available in Live Rooms only");
    const role = await getRoomRole(ctx, conversation.groupChatId, user._id);
    if (!role || !["owner", "admin", "moderator"].includes(role)) {
      throw new Error("Only room moderators and above can pin messages");
    }
    await ctx.db.patch(message._id, { pinnedBy: user._id, pinnedAt: Date.now() });
    return { pinned: true };
  },
});

export const unpinRoomMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getAuthedUserLocal(ctx);
    if (!user) throw new Error("Not authenticated");
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (!message.pinnedAt) return { pinned: false };
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation?.groupChatId) throw new Error("Unpinning is available in Live Rooms only");
    const role = await getRoomRole(ctx, conversation.groupChatId, user._id);
    const canManage = message.pinnedBy === user._id || (role && ["owner", "admin", "moderator"].includes(role));
    if (!canManage) throw new Error("Only the person who pinned it or a room moderator can unpin this message");
    await ctx.db.patch(message._id, { pinnedBy: undefined, pinnedAt: undefined });
    return { pinned: false };
  },
});

export const listPinnedMessages = query({
  args: { groupId: v.id("groupChats") },
  handler: async (ctx, args) => {
    const access = await getRoomForUser(ctx, args.groupId);
    if ("error" in access) return { error: access.error, messages: [] } as const;
    const { user } = access;
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_group_chat", (q: any) => q.eq("groupChatId", args.groupId))
      .first();
    if (!conversation) return { messages: [] };
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", conversation._id))
      .collect();
    const pinned = messages.filter((m) => m.pinnedAt);
    return {
      messages: await Promise.all(pinned.map(async (msg) => {
        const sender: any = await ctx.db.get(msg.senderId);
        const pinnedBy = msg.pinnedBy ? await ctx.db.get(msg.pinnedBy) : null;
        return {
          id: msg._id,
          _id: msg._id,
          text: msg.text,
          type: msg.type,
          mediaUrl: msg.mediaStorageId ? await ctx.storage.getUrl(msg.mediaStorageId) : undefined,
          createdAt: msg.createdAt,
          pinnedAt: msg.pinnedAt,
          pinnedBy: msg.pinnedBy,
          pinnedByName: pinnedBy?.name ?? "Moderator",
          senderName: sender?.name ?? "Member",
          senderUsername: sender?.username ?? "member",
          senderAvatar: sender?.avatarUrl ?? "",
        };
      })),
    };
  },
});

// ==========================================
// MENTION MEMBER LOOKUP
// ==========================================

export const getRoomMentionMembers = query({
  args: { groupId: v.id("groupChats"), search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const access = await getRoomForUser(ctx, args.groupId);
    if ("error" in access) return { members: [] } as const;
    const { room } = access;
    const queryText = args.search?.trim().toLowerCase() ?? "";
    const memberIds = [...new Set([...room.memberIds, room.creatorId].map(String))];
    const members = [];
    for (const memberId of memberIds) {
      const member: any = await ctx.db.get(memberId as any);
      if (!member) continue;
      const name = member.name ?? "Member";
      const username = member.username ?? "";
      if (queryText) {
        const haystack = `${name} ${username}`.toLowerCase();
        if (!haystack.includes(queryText)) continue;
      }
      members.push({
        id: member._id,
        _id: member._id,
        name,
        username,
        avatarUrl: member.avatarUrl ?? "",
        isVerified: resolveUserVerification(member).isVerified,
      });
    }
    members.sort((a, b) => a.name.localeCompare(b.name));
    return { members: members.slice(0, 20) };
  },
});

// ==========================================
// MY MENTIONS
// ==========================================

export const getMyMentions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getAuthedUserLocal(ctx);
    if (!user) return { mentions: [] };
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const mentions = await ctx.db
      .query("messageMentions")
      .withIndex("by_mentioned", (q: any) => q.eq("mentionedUserId", user._id))
      .order("desc")
      .take(limit);
    return {
      mentions: await Promise.all(mentions.map(async (mention) => {
        const message = await ctx.db.get(mention.messageId);
        const sender = message ? await ctx.db.get(message.senderId) : null;
        const groupChat = mention.groupChatId ? await ctx.db.get(mention.groupChatId) : null;
        return {
          id: mention._id,
          messageId: mention.messageId,
          conversationId: mention.conversationId,
          groupChatId: mention.groupChatId,
          groupName: groupChat?.name ?? "Live Room",
          messageText: message?.text ?? "(message unavailable)",
          senderName: sender?.name ?? "Member",
          senderUsername: sender?.username ?? "member",
          createdAt: mention.createdAt,
        };
      })),
    };
  },
});

// ==========================================
// MENTION PROCESSING (invoked after send)
// ==========================================

export function extractMentionHandles(text: string): string[] {
  const handles = new Set<string>();
  // Do not turn the valid prefix of malformed text such as "@name-other"
  // into a notification for a different member.
  const regex = /(?:^|(?<=\s))@([A-Za-z0-9_.]{2,30})(?![A-Za-z0-9_.-])/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    handles.add(match[1].toLowerCase());
  }
  return [...handles];
}

export const processRoomMentions = internalMutation({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    groupChatId: v.id("groupChats"),
    senderId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.groupChatId);
    if (!room) return { mentioned: 0 };
    const memberIds = new Set([...room.memberIds, room.creatorId].map((id: any) => id.toString()));
    const handles = extractMentionHandles(args.text);
    if (handles.length === 0) return { mentioned: 0 };

    const sender = await ctx.db.get(args.senderId);
    const senderName = sender?.name ?? "Someone";
    const roomName = room.name ?? "Live Room";
    const notified = new Set<string>();
    const now = Date.now();

    for (const handle of handles) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_username", (q: any) => q.eq("username", handle))
        .first();
      if (!user) continue;
      const userKey = user._id.toString();
      if (userKey === args.senderId.toString()) continue; // Don't self-notify
      if (notified.has(userKey)) continue;
      if (!memberIds.has(userKey)) continue; // Only members of the room

      notified.add(userKey);
      await ctx.db.insert("messageMentions", {
        messageId: args.messageId,
        conversationId: args.conversationId,
        groupChatId: args.groupChatId,
        mentionedUserId: user._id,
        mentionedById: args.senderId,
        createdAt: now,
      });
      await ctx.db.insert("notifications", {
        recipientId: user._id,
        actorId: args.senderId,
        type: "mention",
        conversationId: args.conversationId,
        messageId: args.messageId,
        targetExcerpt: `${senderName} mentioned you in ${roomName}`,
        isRead: false,
        createdAt: now,
      });
    }
    return { mentioned: notified.size };
  },
});

// ==========================================
// ROOM STATUS / STORIES (room-scoped, member-private)
// ==========================================

export const postRoomStatus = mutation({
  args: {
    groupId: v.id("groupChats"),
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("text")),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    caption: v.optional(v.string()),
    text: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await getRoomForUser(ctx, args.groupId);
    if ("error" in access) throw new Error(access.error);
    const { user, room } = access;

    let finalMediaUrl = args.mediaUrl;
    if (args.mediaStorageId) {
      const url = await ctx.storage.getUrl(args.mediaStorageId);
      if (url) finalMediaUrl = url;
    }

    const now = Date.now();
    const storyId = await ctx.db.insert("cycleStories", {
      authorId: user._id,
      roomId: room._id,
      mediaType: args.mediaType,
      mediaUrl: finalMediaUrl,
      mediaStorageId: args.mediaStorageId,
      caption: args.caption,
      text: args.text,
      backgroundColor: args.backgroundColor,
      textColor: args.textColor,
      location: room.name || "Live Room",
      audience: "community",
      viewsCount: 0,
      likesCount: 0,
      createdAt: now,
      expiresAt: now + TOPIC_EXTENSION_MS, // 24h like ordinary Cycles
    });
    return { storyId };
  },
});

export const listRoomStatuses = query({
  args: { groupId: v.id("groupChats") },
  handler: async (ctx, args) => {
    const access = await getRoomForUser(ctx, args.groupId);
    if ("error" in access) return { members: [] } as const;
    const { user, room } = access;
    const now = Date.now();
    const stories = await ctx.db
      .query("cycleStories")
      .withIndex("by_expires", (q) => q.gt("expiresAt", now))
      .collect();
    const roomStories = stories.filter((story: any) => story.roomId === room._id);

    const grouped = new Map<string, any[]>();
    for (const story of roomStories) {
      const key = story.authorId.toString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(story);
    }

    const members = [];
    for (const [authorId, authorStories] of grouped) {
      const author: any = await ctx.db.get(authorId as any);
      members.push({
        userId: authorId,
        id: authorId,
        name: author?.name ?? "Member",
        username: author?.username ?? "member",
        avatarUrl: author?.avatarUrl ?? "",
        isVerified: author ? resolveUserVerification(author).isVerified : false,
        stories: authorStories.map((story: any) => ({
          id: story._id,
          _id: story._id,
          mediaType: story.mediaType,
          mediaUrl: story.mediaUrl,
          text: story.text,
          caption: story.caption,
          viewsCount: story.viewsCount,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
          isOwn: story.authorId === user._id,
        })),
      });
    }
    return { members };
  },
});

export const deleteRoomStatus = mutation({
  args: { storyId: v.id("cycleStories") },
  handler: async (ctx, args) => {
    const user = await getAuthedUserLocal(ctx);
    if (!user) throw new Error("Not authenticated");
    const story = await ctx.db.get(args.storyId);
    if (!story?.roomId) throw new Error("Status not found");
    if (story.authorId !== user._id) throw new Error("You can only delete your own statuses");
    await ctx.db.delete(story._id);
    return { deleted: true };
  },
});
