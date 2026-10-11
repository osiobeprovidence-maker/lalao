import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthedUser } from "./social";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

async function enrichSoundWithCreator(ctx: any, sound: any, currentUserId?: Id<"users"> | null) {
  let creator = null;
  if (sound.creatorId) {
    const user = await ctx.db.get(sound.creatorId);
    if (user) {
      creator = {
        id: user._id,
        name: user.name || "LaLao Creator",
        username: user.username || "creator",
        avatar: user.avatarUrl || "",
        isVerified: user.isVerified || false,
      };
    }
  }

  let isFavorited = false;
  if (currentUserId) {
    const fav = await ctx.db
      .query("soundFavourites")
      .withIndex("by_user_sound", (q: any) =>
        q.eq("userId", currentUserId).eq("soundId", sound._id)
      )
      .first();
    isFavorited = !!fav;
  }

  // Resolve audio storage URL if stored in Convex storage
  let audioUrl = sound.audioUrl;
  if (sound.audioStorageId && (!audioUrl || audioUrl.startsWith("storage:"))) {
    const storageUrl = await ctx.storage.getUrl(sound.audioStorageId);
    if (storageUrl) {
      audioUrl = storageUrl;
    }
  }

  return {
    ...sound,
    id: sound._id,
    audioUrl,
    creator,
    isFavorited,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   STORAGE UPLOAD URL
   ───────────────────────────────────────────────────────────────────────────── */

export const generateAudioUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   MUTATIONS
   ───────────────────────────────────────────────────────────────────────────── */

export const createSound = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("music"),
      v.literal("original"),
      v.literal("effects"),
      v.literal("voice")
    ),
    genre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    duration: v.number(),
    audioUrl: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    waveform: v.optional(v.array(v.number())),
    visibility: v.union(v.literal("public"), v.literal("private")),
    isOfficial: v.optional(v.boolean()),
    license: v.optional(v.string()),
    authorUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await getAuthedUser(ctx);
    if (!user && args.authorUserId) {
      const normId = ctx.db.normalizeId("users", args.authorUserId);
      if (normId) {
        user = await ctx.db.get(normId);
      }
    }
    if (!user) {
      throw new Error("Must be logged in to create or publish a sound");
    }

    const now = Date.now();
    let audioUrl = args.audioUrl;
    if (args.audioStorageId) {
      const resolved = await ctx.storage.getUrl(args.audioStorageId);
      if (resolved) audioUrl = resolved;
    }

    const soundId = await ctx.db.insert("sounds", {
      creatorId: user._id,
      title: args.title.trim(),
      description: args.description?.trim(),
      category: args.category,
      genre: args.genre?.trim(),
      tags: args.tags || [],
      duration: Math.max(0.5, args.duration),
      audioUrl: audioUrl,
      audioStorageId: args.audioStorageId,
      coverUrl: args.coverUrl,
      waveform: args.waveform,
      visibility: args.visibility,
      isOfficial: args.isOfficial ?? false,
      usageCount: 0,
      favoritesCount: 0,
      license: args.license || "All original rights reserved / Royalty-Free on LaLao",
      moderationStatus: "safe",
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    const created = await ctx.db.get(soundId);
    return await enrichSoundWithCreator(ctx, created, user._id);
  },
});

export const updateSound = mutation({
  args: {
    soundId: v.id("sounds"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("music"),
        v.literal("original"),
        v.literal("effects"),
        v.literal("voice")
      )
    ),
    genre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    license: v.optional(v.string()),
    authorUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await getAuthedUser(ctx);
    if (!user && args.authorUserId) {
      const normId = ctx.db.normalizeId("users", args.authorUserId);
      if (normId) user = await ctx.db.get(normId);
    }
    if (!user) throw new Error("Not authenticated");

    const sound = await ctx.db.get(args.soundId);
    if (!sound) throw new Error("Sound not found");
    if (sound.creatorId !== user._id && user.userType !== "admin") {
      throw new Error("You do not have permission to edit this sound");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.category !== undefined) updates.category = args.category;
    if (args.genre !== undefined) updates.genre = args.genre?.trim();
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    if (args.license !== undefined) updates.license = args.license;

    await ctx.db.patch(args.soundId, updates);
    const updated = await ctx.db.get(args.soundId);
    return await enrichSoundWithCreator(ctx, updated, user._id);
  },
});

export const deleteSound = mutation({
  args: {
    soundId: v.id("sounds"),
    authorUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await getAuthedUser(ctx);
    if (!user && args.authorUserId) {
      const normId = ctx.db.normalizeId("users", args.authorUserId);
      if (normId) user = await ctx.db.get(normId);
    }
    if (!user) throw new Error("Not authenticated");

    const sound = await ctx.db.get(args.soundId);
    if (!sound) throw new Error("Sound not found");
    if (sound.creatorId !== user._id && user.userType !== "admin") {
      throw new Error("You do not have permission to delete this sound");
    }

    // Soft-delete so existing videos using this sound don't break or crash
    await ctx.db.patch(args.soundId, {
      isDeleted: true,
      deletedAt: Date.now(),
      visibility: "private",
    });

    return { success: true, soundId: args.soundId };
  },
});

export const toggleFavouriteSound = mutation({
  args: {
    soundId: v.id("sounds"),
    authorUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await getAuthedUser(ctx);
    if (!user && args.authorUserId) {
      const normId = ctx.db.normalizeId("users", args.authorUserId);
      if (normId) user = await ctx.db.get(normId);
    }
    if (!user) throw new Error("Must be logged in to favorite sounds");

    const sound = await ctx.db.get(args.soundId);
    if (!sound) throw new Error("Sound not found");

    const existing = await ctx.db
      .query("soundFavourites")
      .withIndex("by_user_sound", (q: any) =>
        q.eq("userId", user._id).eq("soundId", args.soundId)
      )
      .first();

    let isFavorited = false;
    let newCount = sound.favoritesCount || 0;

    if (existing) {
      await ctx.db.delete(existing._id);
      newCount = Math.max(0, newCount - 1);
      isFavorited = false;
    } else {
      await ctx.db.insert("soundFavourites", {
        userId: user._id,
        soundId: args.soundId,
        createdAt: Date.now(),
      });
      newCount = newCount + 1;
      isFavorited = true;
    }

    await ctx.db.patch(args.soundId, {
      favoritesCount: newCount,
    });

    return { isFavorited, favoritesCount: newCount };
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
   QUERIES
   ───────────────────────────────────────────────────────────────────────────── */

export const listSounds = query({
  args: {
    category: v.optional(v.string()), // "all" | "music" | "original" | "effects" | "voice"
    filter: v.optional(v.string()), // "foryou" | "for_you" | "trending" | "music" | "original" | "effects" | "favorites" | "my_sounds"
    searchQuery: v.optional(v.string()),
    currentUserId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    let soundDocs: any[] = [];

    // Normalize user ID safely
    let targetUserId: Id<"users"> | null = null;
    if (args.currentUserId) {
      targetUserId = ctx.db.normalizeId("users", args.currentUserId);
    }
    if (!targetUserId) {
      const authed = await getAuthedUser(ctx);
      if (authed) targetUserId = authed._id;
    }

    if (args.filter === "favorites" && targetUserId) {
      const favorites = await ctx.db
        .query("soundFavourites")
        .withIndex("by_user", (q) => q.eq("userId", targetUserId!))
        .order("desc")
        .take(limit);

      for (const fav of favorites) {
        const sound = await ctx.db.get(fav.soundId);
        if (sound && !sound.isDeleted && sound.moderationStatus !== "removed") {
          soundDocs.push(sound);
        }
      }
    } else if (args.filter === "my_sounds" && targetUserId) {
      soundDocs = await ctx.db
        .query("sounds")
        .withIndex("by_creator", (q) => q.eq("creatorId", targetUserId!))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .order("desc")
        .take(limit);
    } else if (args.filter === "trending") {
      soundDocs = await ctx.db
        .query("sounds")
        .withIndex("by_usage")
        .filter((q) =>
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.eq(q.field("visibility"), "public"),
            q.neq(q.field("moderationStatus"), "removed")
          )
        )
        .order("desc")
        .take(limit);
    } else if (
      (args.category && args.category !== "all") ||
      (args.filter && ["music", "original", "effects", "voice"].includes(args.filter))
    ) {
      const cat = args.category && args.category !== "all" ? args.category : args.filter;
      soundDocs = await ctx.db
        .query("sounds")
        .withIndex("by_category", (q) => q.eq("category", cat as any))
        .filter((q) =>
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.eq(q.field("visibility"), "public"),
            q.neq(q.field("moderationStatus"), "removed")
          )
        )
        .order("desc")
        .take(limit);
    } else {
      soundDocs = await ctx.db
        .query("sounds")
        .withIndex("by_created")
        .filter((q) =>
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.eq(q.field("visibility"), "public"),
            q.neq(q.field("moderationStatus"), "removed")
          )
        )
        .order("desc")
        .take(limit);
    }

    // Client-side text search filter if query string provided
    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      const q = args.searchQuery.trim().toLowerCase();
      soundDocs = soundDocs.filter((s) => {
        const matchTitle = s.title?.toLowerCase().includes(q);
        const matchGenre = s.genre?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchTags = s.tags?.some((t: string) => t.toLowerCase().includes(q));
        return matchTitle || matchGenre || matchDesc || matchTags;
      });
    }

    const enriched = await Promise.all(
      soundDocs.map((s) => enrichSoundWithCreator(ctx, s, targetUserId))
    );

    return enriched;
  },
});

export const getSoundById = query({
  args: {
    soundId: v.id("sounds"),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const sound = await ctx.db.get(args.soundId);
    if (!sound) return null;
    return await enrichSoundWithCreator(ctx, sound, args.currentUserId);
  },
});

export const listVideosUsingSound = query({
  args: {
    soundId: v.id("sounds"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_sound", (q) => q.eq("soundId", args.soundId))
      .filter((q) =>
        q.and(
          q.eq(q.field("mediaType"), "video"),
          q.neq(q.field("moderationStatus"), "removed")
        )
      )
      .order("desc")
      .take(limit);

    const enrichedPosts = await Promise.all(
      posts.map(async (p) => {
        let author = null;
        if (p.authorId) {
          const user = await ctx.db.get(p.authorId);
          if (user) {
            author = {
              id: user._id,
              name: user.name || "LaLao User",
              username: user.username || "user",
              avatar: user.avatarUrl || "",
            };
          }
        }
        let mediaUrl = p.mediaUrl;
        if (p.mediaStorageId) {
          const resolved = await ctx.storage.getUrl(p.mediaStorageId);
          if (resolved) mediaUrl = resolved;
        }

        return {
          id: p._id,
          text: p.text,
          mediaUrl,
          muxPlaybackId: p.muxPlaybackId,
          likesCount: p.likesCount || 0,
          commentsCount: p.commentsCount || 0,
          author,
          createdAt: p.createdAt,
        };
      })
    );

    return enrichedPosts;
  },
});
