import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

// -------------------------------------------------------------
// PUBLIC METHODS (For testers)
// -------------------------------------------------------------

export const getBetaSettings = query({
  args: {},
  handler: async (ctx) => {
    let settings = await ctx.db.query("betaSettings").first();
    if (!settings) {
      settings = {
        _id: "default" as any,
        _creationTime: 0,
        openLalaoUrl: "/app",
        betaCommunityUrl: "https://t.me/lalaobeta",
        faqs: [
          { question: "What is LaLao Beta?", answer: "LaLao Beta lets you test early features and help shape the product." },
          { question: "How do I install the APK?", answer: "Download the APK and open it on your Android device. You may need to enable 'Install from unknown sources'." },
          { question: "How do I report a bug?", answer: "Use the feedback form on this page to report any bugs you find." }
        ],
      };
    }
    return settings;
  },
});

export const getCurrentRelease = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("betaReleases")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("isCurrent"), true))
      .first();
  },
});

export const joinBeta = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    lalaoUsername: v.string(),
    device: v.string(),
    androidVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("betaTesters")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let testerId;
    if (existing) {
      testerId = existing._id;
      await ctx.db.patch(existing._id, {
        name: args.name,
        phone: args.phone,
        lalaoUsername: args.lalaoUsername,
        device: args.device,
        androidVersion: args.androidVersion,
        status: "active",
      });
    } else {
      let userId = undefined;
      try {
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
          if (user) userId = user._id;
        }
      } catch (e) {
        // Ignore auth errors, allow guest registration
      }

      testerId = await ctx.db.insert("betaTesters", {
        userId,
        name: args.name,
        email: args.email,
        phone: args.phone,
        lalaoUsername: args.lalaoUsername,
        device: args.device,
        androidVersion: args.androidVersion,
        registrationDate: Date.now(),
        status: "active",
      });
    }
    return testerId;
  },
});

export const submitFeedback = mutation({
  args: {
    testerName: v.string(),
    testerEmail: v.string(),
    lalaoUsername: v.optional(v.string()),
    type: v.union(v.literal("bug"), v.literal("suggestion"), v.literal("general")),
    feature: v.string(),
    description: v.string(),
    device: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existingTester = await ctx.db
      .query("betaTesters")
      .withIndex("by_email", (q) => q.eq("email", args.testerEmail))
      .first();

    return await ctx.db.insert("betaFeedback", {
      testerId: existingTester?._id,
      testerName: args.testerName,
      testerEmail: args.testerEmail,
      lalaoUsername: args.lalaoUsername,
      type: args.type,
      feature: args.feature,
      description: args.description,
      device: args.device,
      priority: args.priority,
      attachments: args.attachments,
      status: "open",
      date: Date.now(),
    });
  },
});

// -------------------------------------------------------------
// ADMIN METHODS
// -------------------------------------------------------------

export const getAdminDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const testers = await ctx.db.query("betaTesters").collect();
    const feedback = await ctx.db.query("betaFeedback").collect();
    const currentRelease = await ctx.db
      .query("betaReleases")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("isCurrent"), true))
      .first();

    const activeTesters = testers.filter(t => t.status === "active").length;
    // New testers in last 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newTesters = testers.filter(t => t.registrationDate > weekAgo).length;

    const openBugs = feedback.filter(f => f.type === "bug" && f.status === "open").length;
    const resolvedBugs = feedback.filter(f => f.type === "bug" && f.status === "resolved").length;

    return {
      totalTesters: testers.length,
      activeTesters,
      newTesters,
      totalFeedback: feedback.length,
      openBugs,
      resolvedBugs,
      currentVersion: currentRelease?.version || "None",
    };
  },
});

export const getTesters = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("betaTesters").order("desc").collect();
  }
});

export const getFeedback = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("betaFeedback").order("desc").collect();
  }
});

export const getReleases = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("betaReleases").order("desc").collect();
  }
});

export const createRelease = mutation({
  args: {
    version: v.string(),
    apkUrl: v.string(),
    fileSize: v.string(),
    minAndroidVersion: v.string(),
    releaseNotes: v.string(),
    isCurrent: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.isCurrent) {
      // Unset previous current releases
      const currentReleases = await ctx.db
        .query("betaReleases")
        .filter((q) => q.eq(q.field("isCurrent"), true))
        .collect();
      
      for (const r of currentReleases) {
        await ctx.db.patch(r._id, { isCurrent: false });
      }
    }

    return await ctx.db.insert("betaReleases", {
      version: args.version,
      releaseDate: Date.now(),
      apkUrl: args.apkUrl,
      fileSize: args.fileSize,
      minAndroidVersion: args.minAndroidVersion,
      releaseNotes: args.releaseNotes,
      isCurrent: args.isCurrent,
      status: "active",
    });
  }
});

export const updateFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("betaFeedback"),
    status: v.union(v.literal("open"), v.literal("in_review"), v.literal("resolved"), v.literal("closed")),
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.patch(args.feedbackId, {
      status: args.status,
      internalNotes: args.internalNotes,
    });
  }
});

export const updateSettings = mutation({
  args: {
    openLalaoUrl: v.string(),
    betaCommunityUrl: v.string(),
    faqs: v.array(v.object({ question: v.string(), answer: v.string() })),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("betaSettings").first();
    if (existing) {
      return await ctx.db.patch(existing._id, args);
    } else {
      return await ctx.db.insert("betaSettings", args);
    }
  }
});
