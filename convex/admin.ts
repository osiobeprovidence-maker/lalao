import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

const INITIAL_SUPER_ADMINS = ["riderezzy@gmail.com", "osiobeprovidence@gmail.com"];

/**
 * Ensures initial super admins are promoted automatically.
 */
async function ensureSuperAdmin(ctx: any, user: any) {
  if (user.email && INITIAL_SUPER_ADMINS.includes(user.email) && user.role !== "super_admin") {
    // Note: We cannot mutate the database (patch/insert) inside a query.
    // We treat the user as a super_admin in-memory for authorization.
    // The user can be officially bootstrapped via the bootstrap mutation if needed,
    // or patched during login mutations.
    return { ...user, role: "super_admin" };
  }
  return user;
}

/**
 * Asserts the caller is authenticated and has one of the allowed admin roles.
 * Throws with HTTP-401/403 semantics if not.
 */
export async function requireAdmin(ctx: any, allowedRoles = ["super_admin", "admin", "editor"]) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  let user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) throw new Error("User not found");
  
  user = await ensureSuperAdmin(ctx, user);

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new Error(`Unauthorized: Requires one of: ${allowedRoles.join(", ")}`);
  }

  return user;
}

/**
 * Asserts the caller is authenticated and has role 'super_admin'.
 */
async function requireSuperAdmin(ctx: any) {
  return requireAdmin(ctx, ["super_admin"]);
}

/** Write an audit log entry (call after successful mutations) */
async function writeAudit(
  ctx: any,
  actorId: any,
  action: string,
  opts?: { target?: string; before?: string; after?: string }
) {
  await ctx.db.insert("auditLog", {
    actorId,
    action,
    target: opts?.target,
    before: opts?.before,
    after: opts?.after,
    createdAt: Date.now(),
  });
}

// ─────────────────────────────────────────────────────────────
// BOOTSTRAP — Call once to promote riderezzy@gmail.com
// ─────────────────────────────────────────────────────────────

/**
 * Idempotent bootstrap: promotes SUPER_ADMIN_EMAIL to super_admin.
 * Safe to call multiple times — no-ops if already set.
 * Does NOT require the caller to already be super_admin.
 */
export const bootstrapSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be authenticated to bootstrap");

    // Only the designated super admin emails can bootstrap themselves
    const callerEmail = identity.email;
    if (!callerEmail || !INITIAL_SUPER_ADMINS.includes(callerEmail)) {
      throw new Error("Only designated Super Admin emails can bootstrap.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User record not found. Complete onboarding first.");

    if (user.role === "super_admin") {
      return { status: "already_super_admin", userId: user._id };
    }

    await ctx.db.patch(user._id, { role: "super_admin", updatedAt: Date.now() });

    await writeAudit(ctx, user._id, "bootstrap_super_admin", {
      target: `user:${user._id}`,
      before: user.role ?? "user",
      after: "super_admin",
    });

    return { status: "promoted", userId: user._id };
  },
});

// ─────────────────────────────────────────────────────────────
// ROLE QUERY — Used by sidebar & AdminRoute
// ─────────────────────────────────────────────────────────────

export const getMyRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return undefined;

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user) {
      user = await ensureSuperAdmin(ctx, user);
    }

    return user?.role;
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createAdminSession = mutation({
  args: {},
  handler: async (ctx) => {
    // Allows super_admin, admin, editor
    const user = await requireAdmin(ctx);
    
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await ctx.db.insert("adminSessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    await writeAudit(ctx, user._id, "created_admin_session", {
      target: "admin_sessions",
    });

    return token;
  },
});

export const verifyAdminSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return false;
    user = await ensureSuperAdmin(ctx, user);

    const allowedRoles = ["super_admin", "admin", "editor"];
    if (!user.role || !allowedRoles.includes(user.role)) return false;

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) return false;
    if (session.userId !== user._id) return false;
    if (Date.now() > session.expiresAt) return false;

    return true;
  },
});

export const destroyAdminSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return;

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session && session.userId === user._id) {
      await ctx.db.delete(session._id);
      
      await writeAudit(ctx, user._id, "destroyed_admin_session", {
        target: "admin_sessions",
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx, ["super_admin", "admin", "editor"]);

    const [users, pages, listings, memberships, transactions, communitySuggestions] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("pages").collect(),
        ctx.db.query("subscriptionListings").collect(),
        ctx.db.query("subscriptionMemberships").collect(),
        ctx.db.query("walletTransactions").collect(),
        ctx.db.query("communitySuggestions").collect(),
      ]);

    const suspendedUsers = users.filter((u: any) => u.suspended || u.status === "suspended").length;
    const businesses = pages.filter((p: any) => p.type === "business" || p.pageType === "business").length;
    const activeListings = listings.filter((l: any) => l.status === "active" || l.active).length;
    const activeMemberships = memberships.filter((m: any) => m.status === "active").length;
    const totalCommunities = pages.filter((p: any) => p.type === "community" || p.pageType === "community").length;
    const totalTransactionVolume = transactions
      .filter((t: any) => t.status === "completed")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return {
      totalUsers: users.length,
      totalPages: pages.length,
      totalBusinesses: businesses,
      activeListings,
      activeMemberships,
      totalTransactionVolume,
      totalCommunities,
      totalTransactions: transactions.length,
      totalTransactionAmount: totalTransactionVolume,
      suspendedUsers,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// USERS ADMIN
// ─────────────────────────────────────────────────────────────

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let users = await ctx.db.query("users").collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.username?.toLowerCase().includes(s)
      );
    }

    if (args.role) {
      users = users.filter((u: any) => (u.role ?? "user") === args.role);
    }

    // Attach page count
    const result = await Promise.all(
      users.slice(0, args.limit ?? 100).map(async (u: any) => {
        const pages = await ctx.db
          .query("pages")
          .withIndex("by_owner", (q: any) => q.eq("ownerId", u._id))
          .collect();
        const memberships = await ctx.db
          .query("subscriptionMemberships")
          .withIndex("by_user", (q: any) => q.eq("userId", u._id))
          .collect();
        return {
          ...u,
          // Strip token for safety
          tokenIdentifier: undefined,
          pageCount: pages.length,
          subscriptionCount: memberships.filter(
            (m: any) => m.status === "active"
          ).length,
        };
      })
    );

    return result;
  },
});

export const changeUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("user"),
      v.literal("moderator"),
      v.literal("admin"),
      v.literal("super_admin")
    ),
  },
  handler: async (ctx, args) => {
    const actor = await requireSuperAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Target user not found");

    const before = target.role ?? "user";
    await ctx.db.patch(args.userId, { role: args.role, updatedAt: Date.now() });

    await writeAudit(ctx, actor._id, "changed_user_role", {
      target: `user:${args.userId} (${target.name ?? target.email})`,
      before,
      after: args.role,
    });
  },
});

export const suspendUser = mutation({
  args: { userId: v.id("users"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const actor = await requireSuperAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === "super_admin") throw new Error("Cannot suspend a Super Admin");

    await ctx.db.patch(args.userId, { suspended: true, updatedAt: Date.now() });

    await writeAudit(ctx, actor._id, "suspended_user", {
      target: `user:${args.userId} (${target.name ?? target.email})`,
      after: args.reason ?? "suspended",
    });
  },
});

export const restoreUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const actor = await requireSuperAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    await ctx.db.patch(args.userId, { suspended: false, updatedAt: Date.now() });

    await writeAudit(ctx, actor._id, "restored_user", {
      target: `user:${args.userId} (${target.name ?? target.email})`,
    });
  },
});

// ─────────────────────────────────────────────────────────────
// PAGES ADMIN
// ─────────────────────────────────────────────────────────────

export const listPages = query({
  args: {
    search: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let pages = await ctx.db.query("pages").collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      pages = pages.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(s) ||
          p.username?.toLowerCase().includes(s)
      );
    }
    if (args.type) {
      pages = pages.filter((p: any) => p.type === args.type);
    }

    const result = await Promise.all(
      pages.slice(0, args.limit ?? 100).map(async (p: any) => {
        const owner = await ctx.db.get(p.ownerId);
        const listings = await ctx.db
          .query("subscriptionListings")
          .withIndex("by_page", (q: any) => q.eq("pageId", p._id))
          .collect();
        return {
          ...p,
          ownerName: (owner as any)?.name ?? "Unknown",
          ownerEmail: (owner as any)?.email,
          subscriptionCount: listings.filter((l: any) => l.active).length,
        };
      })
    );

    return result;
  },
});

// ─────────────────────────────────────────────────────────────
// PLATFORM SETTINGS
// ─────────────────────────────────────────────────────────────

export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const settings = await ctx.db.query("platformSettings").collect();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  },
});

export const updatePlatformSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireSuperAdmin(ctx);

    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .unique();

    const before = existing?.value;

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: actor._id,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: actor._id,
      });
    }

    await writeAudit(ctx, actor._id, "updated_platform_setting", {
      target: args.key,
      before,
      after: args.value,
    });
  },
});

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION PLATFORMS CATALOG ADMIN
// ─────────────────────────────────────────────────────────────

export const listSubscriptionPlatformsAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.query("subscriptionPlatforms").collect();
  },
});

export const upsertSubscriptionPlatform = mutation({
  args: {
    id: v.optional(v.id("subscriptionPlatforms")),
    name: v.string(),
    slug: v.string(),
    logo: v.string(),
    category: v.string(),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requireSuperAdmin(ctx);
    const now = Date.now();

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Platform not found");

      await ctx.db.patch(args.id, {
        name: args.name,
        slug: args.slug,
        logo: args.logo,
        category: args.category,
        website: args.website,
        description: args.description,
        active: args.active,
        updatedAt: now,
      });

      await writeAudit(ctx, actor._id, "updated_subscription_platform", {
        target: `platform:${args.id} (${args.name})`,
        before: existing.name,
        after: args.name,
      });

      return args.id;
    } else {
      const id = await ctx.db.insert("subscriptionPlatforms", {
        name: args.name,
        slug: args.slug,
        logo: args.logo,
        category: args.category,
        website: args.website,
        description: args.description,
        active: args.active,
        createdAt: now,
        updatedAt: now,
      });

      await writeAudit(ctx, actor._id, "created_subscription_platform", {
        target: `platform:${id} (${args.name})`,
        after: args.name,
      });

      return id;
    }
  },
});

// ─────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────

export const listAuditLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, ["super_admin", "admin", "editor"]);

    const entries = await ctx.db
      .query("auditLog")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 50);

    const result = await Promise.all(
      entries.map(async (e: any) => {
        const actor = await ctx.db.get(e.actorId);
        return {
          ...e,
          actorName: (actor as any)?.name ?? "Unknown",
          actorEmail: (actor as any)?.email,
        };
      })
    );

    return result;
  },
});

// ─────────────────────────────────────────────────────────────
// PLATFORM SUBSCRIPTIONS OVERVIEW (admin)
// ─────────────────────────────────────────────────────────────

export const getSubscriptionsOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const listings = await ctx.db.query("subscriptionListings").collect();
    const memberships = await ctx.db.query("subscriptionMemberships").collect();

    const result = await Promise.all(
      listings.slice(0, 100).map(async (l: any) => {
        const page = await ctx.db.get(l.pageId);
        const slots = await ctx.db
          .query("subscriptionSlots")
          .withIndex("by_subscription", (q: any) =>
            q.eq("subscriptionId", l._id)
          )
          .collect();
        const occupied = slots.filter((s: any) => s.status === "occupied").length;
        const active = memberships.filter(
          (m: any) =>
            m.subscriptionId === l._id && m.status === "active"
        ).length;

        return {
          ...l,
          // Redact sensitive fields
          accountEmail: undefined,
          providerTag: undefined,
          privateNotes: undefined,
          pageName: (page as any)?.name ?? "Unknown",
          occupiedSlots: occupied,
          availableSlots: slots.length - occupied,
          activeMembers: active,
        };
      })
    );

    return result;
  },
});

// ─────────────────────────────────────────────────────────────
// WALLET / TRANSACTIONS OVERVIEW (admin)
// ─────────────────────────────────────────────────────────────

export const getTransactionsOverview = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 100);

    const result = await Promise.all(
      transactions.map(async (t: any) => {
        const user = await ctx.db.get(t.userId);
        return {
          ...t,
          userName: (user as any)?.name ?? "Unknown",
          userEmail: (user as any)?.email,
        };
      })
    );

    return result;
  },
});

// ─────────────────────────────────────────────────────────────
// POST MODERATION
// ─────────────────────────────────────────────────────────────

export const removePost = mutation({
  args: {
    postId: v.id("posts"),
    reason: v.optional(v.string()), // Legacy fallback
    moderationReasonId: v.optional(v.id("moderationReasons")),
    violationLevel: v.optional(v.string()),
    note: v.optional(v.string()),
    reportId: v.optional(v.id("reports")),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdmin(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    let officialReasonCode = undefined;
    let officialUserMessage = args.reason || "Your post was removed because it violated Lalao's Community Guidelines.";

    if (args.moderationReasonId) {
      const reasonDoc = await ctx.db.get(args.moderationReasonId);
      if (reasonDoc) {
        officialReasonCode = reasonDoc.code;
        officialUserMessage = reasonDoc.userMessage;
      }
    }

    await ctx.db.patch(args.postId, {
      moderationStatus: "removed",
      removedAt: Date.now(),
      removedBy: adminUser._id,
      removalReason: args.reason,
      removalReasonId: args.moderationReasonId,
      removalReasonCode: officialReasonCode,
      violationLevel: args.violationLevel,
      moderationNote: args.note,
    });

    await writeAudit(ctx, adminUser._id, "content_removed", {
      target: `post/${args.postId}`,
      after: JSON.stringify({ 
        reason: officialReasonCode || args.reason, 
        severity: args.violationLevel,
        note: args.note 
      }),
    });

    if (args.reportId) {
      await ctx.db.patch(args.reportId, {
        status: "resolved",
        resolvedAt: Date.now(),
        resolvedBy: adminUser._id,
        resolution: "Post removed",
        resolutionNote: args.note,
        moderationReasonId: args.moderationReasonId,
        moderationReasonCode: officialReasonCode,
        violationLevel: args.violationLevel,
        userNotificationMessage: officialUserMessage,
        updatedAt: Date.now(),
      });
    }

    // Insert Notification
    await ctx.db.insert("notifications", {
      recipientId: post.authorId,
      actorId: adminUser._id,
      type: "system_alert",
      targetExcerpt: officialUserMessage,
      isRead: false,
      createdAt: Date.now(),
    });

    // Trigger web push
    await ctx.scheduler.runAfter(0, internal.pushActions.dispatchPush, {
      recipientId: post.authorId,
      title: "Content Removed",
      body: officialUserMessage,
      url: "/notifications"
    });
  },
});

export const restorePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdmin(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(args.postId, {
      moderationStatus: "safe",
      moderationNote: "Restored by admin",
    });

    await writeAudit(ctx, adminUser._id, "content_restored", {
      target: `post/${args.postId}`,
      after: JSON.stringify({ status: "safe" }),
    });
  },
});

// ─────────────────────────────────────────────────────────────
// COMMUNITY MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const getCommunityDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx, ["super_admin", "admin", "editor"]);

    const [pages, suggestions, memberships] = await Promise.all([
      ctx.db.query("pages").collect(),
      ctx.db.query("communitySuggestions").collect(),
      ctx.db.query("pageFollowers").collect(),
    ]);

    const communities = pages.filter(p => p.type === "community");
    const activeCommunities = communities.filter(c => c.status !== "archived" && c.status !== "suspended");
    const pendingSuggestions = suggestions.filter(s => s.status === "pending" || s.status === "under_review").length;

    // Estimate members by counting pageFollowers for communities
    const communityIds = new Set(communities.map(c => c._id));
    const totalMembers = memberships.filter(m => communityIds.has(m.pageId)).length;

    return {
      totalCommunities: communities.length,
      activeCommunities: activeCommunities.length,
      totalMembers,
      pendingSuggestions,
    };
  },
});

export const listCommunities = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx, ["super_admin", "admin", "editor"]);

    const communities = await ctx.db
      .query("pages")
      .filter((q) => q.eq(q.field("type"), "community"))
      .collect();

    return Promise.all(
      communities.map(async (community) => {
        const creator = await ctx.db.get(community.ownerId);
        
        // Count members
        const followers = await ctx.db
          .query("pageFollowers")
          .withIndex("by_page", (q) => q.eq("pageId", community._id))
          .collect();

        return {
          ...community,
          creator: creator ? { name: creator.name, username: creator.username, avatarUrl: creator.avatarUrl } : null,
          memberCount: followers.length,
        };
      })
    );
  },
});
