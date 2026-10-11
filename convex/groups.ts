import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthedUser, resolveUserVerification } from "./social";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

export async function resolveGroupContext(
  ctx: any,
  rawGroupId: string,
  currentUser: any
) {
  if (!rawGroupId) return null;
  const cleanId = rawGroupId.trim();
  const normId = ctx.db.normalizeId("groupChats", cleanId);
  let group = normId ? await ctx.db.get(normId) : null;

  if (!group) {
    const cleanUsername = cleanId.replace(/^@/, "").toLowerCase();
    group = await ctx.db
      .query("groupChats")
      .withIndex("by_username", (q: any) => q.eq("username", cleanUsername))
      .first();
  }

  if (!group) return null;
  const effectiveId = group._id;

  let role: "owner" | "admin" | "moderator" | "member" | null = null;
  let isMember = false;

  if (currentUser) {
    if (group.creatorId === currentUser._id) {
      role = "owner";
      isMember = true;
    } else {
      const membership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_user", (q: any) =>
          q.eq("groupId", effectiveId).eq("userId", currentUser._id)
        )
        .first();

      if (membership) {
        role = membership.role;
        isMember = true;
      } else if (group.memberIds && group.memberIds.includes(currentUser._id)) {
        role = "member";
        isMember = true;
      }
    }
  }

  const isOwner = role === "owner";
  const isAdmin = role === "owner" || role === "admin";
  const isModerator = isAdmin || role === "moderator";

  let isFollower = false;
  if (currentUser) {
    const follow = await ctx.db
      .query("groupFollowers")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", effectiveId).eq("userId", currentUser._id)
      )
      .first();
    isFollower = !!follow;
  }

  let pendingRequest = false;
  if (currentUser && !isMember) {
    const req = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", effectiveId).eq("userId", currentUser._id)
      )
      .first();
    pendingRequest = req?.status === "pending";
  }

  return {
    group,
    groupId: effectiveId,
    role,
    isMember,
    isOwner,
    isAdmin,
    isModerator,
    isFollower,
    pendingRequest,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUERIES
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Get sanitized group profile according to viewer permissions & group visibility mode.
 */
export const getGroup = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    let currentUser: any = null;
    try {
      currentUser = await getAuthedUser(ctx);
    } catch {
      currentUser = null;
    }

    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved) return null;

    const { group, isMember, isOwner, isAdmin, isModerator, isFollower, role, pendingRequest } = resolved;
    const visibility = group.visibility ?? "private_discoverable";

    // 1. Private and hidden: non-members cannot even view basic metadata
    if (visibility === "private_hidden" && !isMember) {
      return null;
    }

    // Resolve member count and follower count
    const memberCount = group.memberIds?.length || 1;
    const followers = await ctx.db
      .query("groupFollowers")
      .withIndex("by_group", (q: any) => q.eq("groupId", group._id))
      .collect();

    // 2. Private and discoverable for non-members: strictly limit exposed fields
    if (visibility === "private_discoverable" && !isMember) {
      return {
        id: group._id,
        name: group.name,
        username: group.username ?? `group-${group._id}`,
        description: group.description ?? "",
        avatarUrl: group.avatarUrl ?? "",
        coverImage: group.coverImage ?? "",
        rules: group.rules ?? [],
        category: group.category ?? "General",
        visibility,
        communityEnabled: false,
        communityFeatures: { posts: false, replies: false, media: false, rallies: false },
        memberCount,
        followersCount: followers.length,
        isMember: false,
        isFollower,
        isPendingRequest: pendingRequest,
        isOwner: false,
        isAdmin: false,
        isModerator: false,
        role: null,
        conversationId: null,
        isRestrictedPreview: true,
      };
    }

    // 3. Full profile for members or public visitors
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_group_chat", (q: any) => q.eq("groupChatId", group._id))
      .first();

    return {
      id: group._id,
      name: group.name,
      username: group.username ?? `group-${group._id}`,
      description: group.description ?? "",
      avatarUrl: group.avatarUrl ?? "",
      coverImage: group.coverImage ?? "",
      rules: group.rules ?? [],
      category: group.category ?? "General",
      interests: group.interests ?? [],
      visibility,
      communityEnabled: group.communityEnabled ?? false,
      communityFeatures: group.communityFeatures ?? {
        posts: true,
        replies: true,
        media: true,
        rallies: true,
      },
      publishingPermissions: group.publishingPermissions ?? {
        canPost: "all_members",
        canReply: "all_members",
        canUploadMedia: "all_members",
        canCreateRallies: "all_members",
      },
      memberCount,
      followersCount: followers.length,
      isMember,
      isFollower,
      isPendingRequest: pendingRequest,
      isOwner,
      isAdmin,
      isModerator,
      role,
      conversationId: conversation ? conversation._id : null,
      isRestrictedPreview: false,
      createdAt: group.createdAt,
    };
  },
});

/**
 * Get active members list with roles.
 * Protected: non-members cannot read member lists for private groups.
 */
export const getGroupMembers = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved) throw new ConvexError("Group not found");

    const { group, isMember } = resolved;
    const visibility = group.visibility ?? "private_discoverable";

    if (visibility !== "public" && !isMember) {
      throw new ConvexError("Member list is private to group members");
    }

    const membersTable = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q: any) => q.eq("groupId", group._id))
      .collect();

    const memberMap = new Map<string, any>();
    for (const m of membersTable) {
      memberMap.set(m.userId.toString(), m);
    }

    const results = [];
    for (const rawUserId of group.memberIds) {
      const userDoc = await ctx.db.get(rawUserId);
      if (!userDoc) continue;

      const explicitMem = memberMap.get(rawUserId.toString());
      const role =
        userDoc._id === group.creatorId
          ? "owner"
          : explicitMem?.role ?? "member";

      results.push({
        id: userDoc._id,
        name: userDoc.name ?? "User",
        username: userDoc.username ?? "user",
        avatar: userDoc.avatarUrl ?? "",
        role,
        isCreator: userDoc._id === group.creatorId,
        joinedAt: explicitMem?.joinedAt ?? group.createdAt,
        ...resolveUserVerification(userDoc),
      });
    }

    return results;
  },
});

/**
 * List pending join requests. Admin & Owner only.
 */
export const getGroupJoinRequests = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isAdmin) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    const requests = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_group_status", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("status", "pending")
      )
      .order("desc")
      .collect();

    return Promise.all(
      requests.map(async (r: any) => {
        const user = await ctx.db.get(r.userId);
        return {
          id: r._id,
          userId: r.userId,
          message: r.message ?? "",
          createdAt: r.createdAt,
          user: user
            ? {
                name: user.name ?? "User",
                username: user.username ?? "user",
                avatar: user.avatarUrl ?? "",
                ...resolveUserVerification(user),
              }
            : null,
        };
      })
    );
  },
});

/**
 * Accurate real statistics computed from persisted database records.
 * Zero hardcoded/mock placeholder numbers.
 */
export const getGroupAnalytics = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isAdmin) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    const { group, groupId } = resolved;

    // Real members count
    const totalMembers = group.memberIds?.length || 1;

    // Real pending requests count
    const pendingRequests = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_group_status", (q: any) =>
        q.eq("groupId", groupId).eq("status", "pending")
      )
      .collect();

    // Real group posts count
    const groupPosts = await ctx.db
      .query("posts")
      .withIndex("by_group_ref", (q: any) => q.eq("groupRefId", groupId.toString()))
      .collect();

    let totalReplies = 0;
    let mediaCount = 0;

    for (const post of groupPosts) {
      if (post.commentsCount) totalReplies += post.commentsCount;
      if (post.mediaUrl || post.mediaStorageId) mediaCount += 1;
    }

    // Real group rallies count
    const groupRallies = await ctx.db
      .query("rallies")
      .withIndex("by_group_ref", (q: any) => q.eq("groupRefId", groupId.toString()))
      .collect();

    // Real group message activity count
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_group_chat", (q: any) => q.eq("groupChatId", groupId))
      .first();

    let totalMessages = 0;
    if (conversation) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation_created", (q: any) =>
          q.eq("conversationId", conversation._id)
        )
        .collect();
      totalMessages = messages.length;
    }

    return {
      totalMembers,
      pendingRequestsCount: pendingRequests.length,
      totalPosts: groupPosts.length,
      totalReplies,
      mediaCount,
      totalRallies: groupRallies.length,
      totalMessages,
      followersCount: (
        await ctx.db
          .query("groupFollowers")
          .withIndex("by_group", (q: any) => q.eq("groupId", groupId))
          .collect()
      ).length,
    };
  },
});

/**
 * Public and discoverable groups directory.
 * Strictly filters out private_hidden groups.
 */
export const listDiscoverableGroups = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const groups = await ctx.db.query("groupChats").collect();

    const filtered = groups.filter((g) => {
      const visibility = g.visibility ?? "private_discoverable";
      // Hidden groups are NEVER exposed in discovery unless caller is already a member
      if (visibility === "private_hidden") {
        if (!currentUser || !g.memberIds.includes(currentUser._id)) {
          return false;
        }
      }

      if (args.category && args.category !== "All") {
        if (g.category?.toLowerCase() !== args.category.toLowerCase()) {
          return false;
        }
      }

      if (args.search && args.search.trim()) {
        const query = args.search.trim().toLowerCase();
        const matchesName = g.name.toLowerCase().includes(query);
        const matchesDesc = (g.description ?? "").toLowerCase().includes(query);
        const matchesUsername = (g.username ?? "").toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesUsername) return false;
      }

      return true;
    });

    return filtered.map((g) => {
      const isMember = currentUser ? g.memberIds.includes(currentUser._id) : false;
      return {
        id: g._id,
        name: g.name,
        username: g.username ?? `group-${g._id}`,
        description: g.description ?? "",
        avatarUrl: g.avatarUrl ?? "",
        coverImage: g.coverImage ?? "",
        category: g.category ?? "General",
        visibility: g.visibility ?? "private_discoverable",
        communityEnabled: g.communityEnabled ?? false,
        memberCount: g.memberIds.length,
        isMember,
        createdAt: g.createdAt,
      };
    });
  },
});

/**
 * Returns groups the current user belongs to or manages.
 */
export const getMyGroups = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) return [];

    const allGroups = await ctx.db.query("groupChats").collect();
    const myGroups = allGroups.filter((g) => g.memberIds.includes(currentUser._id));

    return myGroups.map((g) => ({
      id: g._id,
      name: g.name,
      username: g.username ?? `group-${g._id}`,
      description: g.description ?? "",
      avatarUrl: g.avatarUrl ?? "",
      category: g.category ?? "General",
      visibility: g.visibility ?? "private_discoverable",
      communityEnabled: g.communityEnabled ?? false,
      memberCount: g.memberIds.length,
      isOwner: g.creatorId === currentUser._id,
      createdAt: g.createdAt,
    }));
  },
});

/**
 * Query posts associated with a group.
 */
export const getGroupPosts = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved) throw new ConvexError("Group not found");

    const { group, isMember } = resolved;
    const visibility = group.visibility ?? "private_discoverable";

    if (visibility !== "public" && !isMember) {
      return [];
    }

    if (!group.communityEnabled) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_group_ref", (q: any) => q.eq("groupRefId", resolved.groupId.toString()))
      .order("desc")
      .collect();

    return Promise.all(
      posts.map(async (p: any) => {
        const author = await ctx.db.get(p.authorId);
        return {
          ...p,
          id: p._id,
          author: author
            ? {
                id: author._id,
                name: author.name ?? "User",
                username: author.username ?? "user",
                avatar: author.avatarUrl ?? "",
                ...resolveUserVerification(author),
              }
            : null,
        };
      })
    );
  },
});

/**
 * Query rallies associated with a group.
 */
export const getGroupRallies = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved) throw new ConvexError("Group not found");

    const { group, isMember } = resolved;
    const visibility = group.visibility ?? "private_discoverable";

    if (visibility !== "public" && !isMember) {
      return [];
    }

    if (!group.communityEnabled) {
      return [];
    }

    const rallies = await ctx.db
      .query("rallies")
      .withIndex("by_group_ref", (q: any) => q.eq("groupRefId", resolved.groupId.toString()))
      .order("desc")
      .collect();

    return rallies.map((r: any) => ({ ...r, id: r._id }));
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   MUTATIONS
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Unified Group Creation.
 * Initializes persistent ownership in groupMembers and creates the linked conversation.
 */
export const createGroup = mutation({
  args: {
    name: v.string(),
    username: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.optional(v.string()),
    rules: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private_discoverable"),
        v.literal("private_hidden")
      )
    ),
    communityEnabled: v.optional(v.boolean()),
    communityFeatures: v.optional(
      v.object({
        posts: v.boolean(),
        replies: v.boolean(),
        media: v.boolean(),
        rallies: v.boolean(),
      })
    ),
    publishingPermissions: v.optional(
      v.object({
        canPost: v.string(),
        canReply: v.string(),
        canUploadMedia: v.string(),
        canCreateRallies: v.string(),
      })
    ),
    memberIds: v.optional(v.array(v.string())),
    creatorUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = await getAuthedUser(ctx);
    if (!currentUser && args.creatorUserId) {
      const normId = ctx.db.normalizeId("users", args.creatorUserId);
      if (normId) currentUser = await ctx.db.get(normId);
    }
    if (!currentUser) throw new ConvexError("Please sign in to create a group");

    const now = Date.now();
    const validMemberIds: Id<"users">[] = [currentUser._id];

    if (args.memberIds) {
      for (const rawId of args.memberIds) {
        const norm = ctx.db.normalizeId("users", rawId);
        if (norm && !validMemberIds.includes(norm)) {
          validMemberIds.push(norm);
        }
      }
    }

    const cleanUsername = args.username
      ? args.username.replace(/^@/, "").trim().toLowerCase()
      : `group-${now}`;

    // 1. Insert Group record
    const groupId = await ctx.db.insert("groupChats", {
      name: args.name.trim(),
      username: cleanUsername,
      description: args.description?.trim() || undefined,
      creatorId: currentUser._id,
      memberIds: validMemberIds,
      avatarUrl: args.avatarUrl,
      coverImage: args.coverImage,
      category: args.category?.trim() || "General",
      rules: args.rules || [
        "Be respectful to all members.",
        "Keep discussions constructive and relevant.",
        "No spam or unsolicited promotions.",
      ],
      interests: args.interests || [],
      visibility: args.visibility ?? "private_discoverable",
      communityEnabled: args.communityEnabled ?? false,
      communityFeatures: args.communityFeatures ?? {
        posts: true,
        replies: true,
        media: true,
        rallies: true,
      },
      publishingPermissions: args.publishingPermissions ?? {
        canPost: "all_members",
        canReply: "all_members",
        canUploadMedia: "all_members",
        canCreateRallies: "all_members",
      },
      createdAt: now,
      updatedAt: now,
    });

    // 2. Initialize creator as persistent Owner in groupMembers
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: currentUser._id,
      role: "owner",
      joinedAt: now,
    });

    // 3. Initialize invited members
    for (const memId of validMemberIds) {
      if (memId !== currentUser._id) {
        await ctx.db.insert("groupMembers", {
          groupId,
          userId: memId,
          role: "member",
          joinedAt: now,
        });
      }
    }

    // 4. Create linked core conversation
    const conversationId = await ctx.db.insert("conversations", {
      userA: currentUser._id,
      groupChatId: groupId,
      updatedAt: now,
    });

    return { groupId, conversationId };
  },
});

/**
 * Edit group profile details. Owner or Admin only.
 */
export const updateGroupProfile = mutation({
  args: {
    groupId: v.string(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.optional(v.string()),
    rules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isAdmin) {
      throw new ConvexError("Unauthorized: Only admins can edit group details");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.username !== undefined) updates.username = args.username.replace(/^@/, "").trim().toLowerCase();
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.category !== undefined) updates.category = args.category;
    if (args.rules !== undefined) updates.rules = args.rules;

    await ctx.db.patch(resolved.groupId, updates);
    return { success: true };
  },
});

/**
 * Update Group Privacy with explicit confirmation for transitions.
 * Owner only.
 */
export const updateGroupPrivacy = mutation({
  args: {
    groupId: v.string(),
    visibility: v.union(
      v.literal("public"),
      v.literal("private_discoverable"),
      v.literal("private_hidden")
    ),
    confirmTransition: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isOwner) {
      throw new ConvexError("Unauthorized: Only the group owner can change privacy settings");
    }

    const currentVis = resolved.group.visibility ?? "private_discoverable";
    if (currentVis !== "public" && args.visibility === "public" && !args.confirmTransition) {
      throw new ConvexError(
        "Transitioning from Private to Public requires explicit confirmation to protect member privacy."
      );
    }

    await ctx.db.patch(resolved.groupId, {
      visibility: args.visibility,
      updatedAt: Date.now(),
    });

    return { success: true, visibility: args.visibility };
  },
});

/**
 * Configure community features & publishing permissions.
 * Owner or Admin only.
 */
export const updateCommunitySettings = mutation({
  args: {
    groupId: v.string(),
    communityEnabled: v.boolean(),
    communityFeatures: v.object({
      posts: v.boolean(),
      replies: v.boolean(),
      media: v.boolean(),
      rallies: v.boolean(),
    }),
    publishingPermissions: v.object({
      canPost: v.string(),
      canReply: v.string(),
      canUploadMedia: v.string(),
      canCreateRallies: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isAdmin) {
      throw new ConvexError("Unauthorized: Only admins can configure community features");
    }

    await ctx.db.patch(resolved.groupId, {
      communityEnabled: args.communityEnabled,
      communityFeatures: args.communityFeatures,
      publishingPermissions: args.publishingPermissions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Request to Join a group or directly Join if public.
 */
export const requestToJoin = mutation({
  args: {
    groupId: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new ConvexError("Sign in to join this group");

    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved) throw new ConvexError("Group not found");

    if (resolved.isMember) {
      throw new ConvexError("You are already a member of this group");
    }

    const visibility = resolved.group.visibility ?? "private_discoverable";
    const now = Date.now();

    // If group is Public, immediately admit the user
    if (visibility === "public") {
      await ctx.db.insert("groupMembers", {
        groupId: resolved.groupId,
        userId: currentUser._id,
        role: "member",
        joinedAt: now,
      });

      await ctx.db.patch(resolved.groupId, {
        memberIds: [...resolved.group.memberIds, currentUser._id],
        updatedAt: now,
      });

      return { status: "joined" };
    }

    // For private groups, create a pending Join Request
    const existingReq = await ctx.db
      .query("groupJoinRequests")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("userId", currentUser._id)
      )
      .first();

    if (existingReq) {
      if (existingReq.status === "pending") {
        throw new ConvexError("Your request to join is already pending review");
      }
      // Re-activate previously rejected request
      await ctx.db.patch(existingReq._id, {
        status: "pending",
        message: args.message,
        createdAt: now,
        reviewedAt: undefined,
        reviewedBy: undefined,
      });
      return { status: "pending" };
    }

    await ctx.db.insert("groupJoinRequests", {
      groupId: resolved.groupId,
      userId: currentUser._id,
      status: "pending",
      message: args.message,
      createdAt: now,
    });

    return { status: "pending" };
  },
});

/**
 * Approve or Reject a Join Request. Owner or Admin only.
 */
export const reviewJoinRequest = mutation({
  args: {
    requestId: v.id("groupJoinRequests"),
    action: v.union(v.literal("approve"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new ConvexError("Not authenticated");

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new ConvexError("Join request not found");

    const resolved = await resolveGroupContext(ctx, req.groupId.toString(), currentUser);
    if (!resolved || !resolved.isAdmin) {
      throw new ConvexError("Unauthorized: Only admins can review join requests");
    }

    const now = Date.now();

    if (args.action === "approve") {
      // Check if user is already in group
      if (!resolved.group.memberIds.includes(req.userId)) {
        await ctx.db.insert("groupMembers", {
          groupId: req.groupId,
          userId: req.userId,
          role: "member",
          joinedAt: now,
        });

        await ctx.db.patch(req.groupId, {
          memberIds: [...resolved.group.memberIds, req.userId],
          updatedAt: now,
        });
      }

      await ctx.db.patch(req._id, {
        status: "approved",
        reviewedAt: now,
        reviewedBy: currentUser._id,
      });

      // Notify the approved user
      try {
        await ctx.db.insert("notifications", {
          recipientId: req.userId,
          actorId: currentUser._id,
          type: "system_alert" as any,
          targetExcerpt: `Your request to join "${resolved.group.name}" was approved!`,
          isRead: false,
          createdAt: now,
        });
      } catch (e) {
        console.warn("Notification error", e);
      }
    } else {
      await ctx.db.patch(req._id, {
        status: "rejected",
        reviewedAt: now,
        reviewedBy: currentUser._id,
      });
    }

    return { success: true };
  },
});

/**
 * Invite a user to a group. Owner or Admin only.
 */
export const inviteMember = mutation({
  args: {
    groupId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isAdmin) {
      throw new ConvexError("Unauthorized: Only admins can invite new members");
    }

    const targetNorm = ctx.db.normalizeId("users", args.userId);
    if (!targetNorm) throw new ConvexError("Invalid user ID");

    if (resolved.group.memberIds.includes(targetNorm)) {
      throw new ConvexError("User is already a member of this group");
    }

    const now = Date.now();
    await ctx.db.insert("groupInvitations", {
      groupId: resolved.groupId,
      inviterId: currentUser._id,
      invitedUserId: targetNorm,
      status: "pending",
      createdAt: now,
    });

    // Also directly add to memberIds for immediate messaging capability
    await ctx.db.insert("groupMembers", {
      groupId: resolved.groupId,
      userId: targetNorm,
      role: "member",
      joinedAt: now,
    });

    await ctx.db.patch(resolved.groupId, {
      memberIds: [...resolved.group.memberIds, targetNorm],
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update member role (promote to Admin or Moderator, or demote to Member). Owner only.
 */
export const updateMemberRole = mutation({
  args: {
    groupId: v.string(),
    userId: v.string(),
    newRole: v.union(v.literal("admin"), v.literal("moderator"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isOwner) {
      throw new ConvexError("Unauthorized: Only the group owner can assign roles");
    }

    const targetNorm = ctx.db.normalizeId("users", args.userId);
    if (!targetNorm) throw new ConvexError("Invalid user ID");
    if (targetNorm === currentUser._id) {
      throw new ConvexError("Cannot modify your own owner role. Use transferOwnership instead.");
    }

    const mem = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("userId", targetNorm)
      )
      .first();

    if (mem) {
      await ctx.db.patch(mem._id, { role: args.newRole });
    } else {
      await ctx.db.insert("groupMembers", {
        groupId: resolved.groupId,
        userId: targetNorm,
        role: args.newRole,
        joinedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Transfer group ownership. Owner only.
 */
export const transferOwnership = mutation({
  args: {
    groupId: v.string(),
    newOwnerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isOwner) {
      throw new ConvexError("Unauthorized: Only the current owner can transfer ownership");
    }

    const targetNorm = ctx.db.normalizeId("users", args.newOwnerUserId);
    if (!targetNorm) throw new ConvexError("Invalid target user ID");
    if (!resolved.group.memberIds.includes(targetNorm)) {
      throw new ConvexError("New owner must already be an active member of the group");
    }

    const now = Date.now();

    // Demote current owner to admin in groupMembers
    const curMem = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("userId", currentUser._id)
      )
      .first();

    if (curMem) {
      await ctx.db.patch(curMem._id, { role: "admin" });
    }

    // Promote new owner in groupMembers
    const targetMem = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("userId", targetNorm)
      )
      .first();

    if (targetMem) {
      await ctx.db.patch(targetMem._id, { role: "owner" });
    } else {
      await ctx.db.insert("groupMembers", {
        groupId: resolved.groupId,
        userId: targetNorm,
        role: "owner",
        joinedAt: now,
      });
    }

    // Update group creatorId to new owner
    await ctx.db.patch(resolved.groupId, {
      creatorId: targetNorm,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Remove a member from the group. Owner or Admin only.
 */
export const removeMember = mutation({
  args: {
    groupId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isAdmin) {
      throw new ConvexError("Unauthorized: Only admins can remove members");
    }

    const targetNorm = ctx.db.normalizeId("users", args.userId);
    if (!targetNorm) throw new ConvexError("Invalid user ID");
    if (targetNorm === resolved.group.creatorId) {
      throw new ConvexError("Cannot remove the group owner");
    }

    // Remove from groupMembers
    const mem = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("userId", targetNorm)
      )
      .first();

    if (mem) await ctx.db.delete(mem._id);

    // Remove from groupChats.memberIds
    const newMemberIds = resolved.group.memberIds.filter(
      (id: any) => id.toString() !== targetNorm.toString()
    );

    await ctx.db.patch(resolved.groupId, {
      memberIds: newMemberIds,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Leave a group.
 */
export const leaveGroup = mutation({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new ConvexError("Not authenticated");

    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved || !resolved.isMember) {
      throw new ConvexError("You are not a member of this group");
    }

    if (resolved.isOwner && resolved.group.memberIds.length > 1) {
      throw new ConvexError(
        "You are the owner. Please transfer ownership to another member before leaving."
      );
    }

    const mem = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("userId", currentUser._id)
      )
      .first();

    if (mem) await ctx.db.delete(mem._id);

    const newMemberIds = resolved.group.memberIds.filter(
      (id: any) => id.toString() !== currentUser._id.toString()
    );

    await ctx.db.patch(resolved.groupId, {
      memberIds: newMemberIds,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Follow or Unfollow a group (distinct from membership).
 */
export const toggleFollow = mutation({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthedUser(ctx);
    if (!currentUser) throw new ConvexError("Sign in to follow this group");

    const resolved = await resolveGroupContext(ctx, args.groupId, currentUser);
    if (!resolved) throw new ConvexError("Group not found");

    const existingFollow = await ctx.db
      .query("groupFollowers")
      .withIndex("by_group_user", (q: any) =>
        q.eq("groupId", resolved.groupId).eq("userId", currentUser._id)
      )
      .first();

    if (existingFollow) {
      await ctx.db.delete(existingFollow._id);
      return { isFollowing: false };
    } else {
      await ctx.db.insert("groupFollowers", {
        groupId: resolved.groupId,
        userId: currentUser._id,
        createdAt: Date.now(),
      });
      return { isFollowing: true };
    }
  },
});
