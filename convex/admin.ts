import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

const SUPER_ADMIN_EMAIL = "riderezzy@gmail.com";

/**
 * Asserts the caller is authenticated and has role 'super_admin'.
 * Throws with HTTP-401/403 semantics if not.
 */
async function requireSuperAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) throw new Error("User not found");
  if (user.role !== "super_admin") throw new Error("Unauthorized: Super Admin only");

  return user;
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

    // Only the designated super admin email can bootstrap themselves
    const callerEmail = identity.email;
    if (callerEmail !== SUPER_ADMIN_EMAIL) {
      throw new Error("Only the designated Super Admin email can bootstrap.");
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    return user?.role;
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createAdminSession = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireSuperAdmin(ctx);
    
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "super_admin") return false;

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
    await requireSuperAdmin(ctx);

    const [users, pages, listings, memberships, transactions] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("pages").collect(),
        ctx.db.query("subscriptionListings").collect(),
        ctx.db.query("subscriptionMemberships").collect(),
        ctx.db.query("walletTransactions").collect(),
      ]);

    const businesses = pages.filter((p: any) => p.type === "business");
    const activeMembers = memberships.filter(
      (m: any) => m.status === "active"
    );
    const totalTxAmount = transactions
      .filter((t: any) => t.status === "completed")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return {
      totalUsers: users.length,
      totalPages: pages.length,
      totalBusinesses: businesses.length,
      activeSubscriptions: activeMembers.length,
      totalTransactions: transactions.length,
      totalTransactionAmount: totalTxAmount,
      suspendedUsers: users.filter((u: any) => u.suspended).length,
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
    await requireSuperAdmin(ctx);

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
