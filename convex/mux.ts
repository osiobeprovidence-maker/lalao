"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import Mux from "@mux/mux-node";

async function getMuxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_SECRET_KEY;
  if (!tokenId || !tokenSecret) {
    throw new ConvexError(
      "Mux is not configured. Set MUX_TOKEN_ID and MUX_SECRET_KEY in your Convex environment."
    );
  }
  return new Mux({ tokenId, tokenSecret });
}

/**
 * createDirectUpload
 * Creates a Mux Direct Upload URL so the browser can PUT a video file
 * directly to Mux without going through our server.
 * Returns: { upload_url, upload_id }
 */
export const createDirectUpload = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const mux = await getMuxClient();

    const upload = await mux.video.uploads.create({
      cors_origin: "*", // Allow browser direct upload from any origin
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline", // Faster processing, good for social media
      },
    });

    return {
      upload_url: upload.url,
      upload_id: upload.id,
    };
  },
});

/**
 * getMuxAssetStatus
 * Polls Mux for the current status of an upload/asset.
 * Returns playback_id once the asset is ready.
 */
export const getMuxAssetStatus = action({
  args: {
    uploadId: v.string(),
  },
  handler: async (ctx, { uploadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const mux = await getMuxClient();

    const upload = await mux.video.uploads.retrieve(uploadId);
    
    if (!upload.asset_id) {
      return { status: "waiting", playbackId: null, assetId: null };
    }

    const asset = await mux.video.assets.retrieve(upload.asset_id);

    if (asset.status === "ready" && asset.playback_ids?.[0]?.id) {
      return {
        status: "ready",
        playbackId: asset.playback_ids[0].id,
        assetId: asset.id,
      };
    }

    return {
      status: asset.status ?? "preparing",
      playbackId: null,
      assetId: asset.id ?? null,
    };
  },
});

/**
 * pollAndUpdatePost
 * Action that polls Mux for the upload status and updates the post
 * record when the video is ready. Called from the frontend after uploading.
 * Note: updatePostMuxStatus lives in muxInternal.ts (non-Node.js runtime).
 */
export const pollAndUpdatePost = action({
  args: {
    postId: v.id("posts"),
    uploadId: v.string(),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, { postId, uploadId, maxAttempts = 30 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const mux = await getMuxClient();

    // Poll every 3 seconds up to maxAttempts times
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        const upload = await mux.video.uploads.retrieve(uploadId);
        if (!upload.asset_id) continue;

        const asset = await mux.video.assets.retrieve(upload.asset_id);
        if (asset.status === "ready" && asset.playback_ids?.[0]?.id) {
          await ctx.runMutation(internal.muxInternal.updatePostMuxStatus, {
            postId,
            muxAssetId: asset.id,
            muxPlaybackId: asset.playback_ids[0].id,
          });
          return { success: true, playbackId: asset.playback_ids[0].id };
        } else if (asset.status === "errored") {
          await ctx.runMutation(internal.muxInternal.updatePostMuxError, {
            postId,
            error: asset.errors?.messages?.[0] ?? "Video encoding failed",
          });
          return { success: false, playbackId: null };
        }
      } catch (e) {
        console.warn(`Mux poll attempt ${attempt + 1} failed:`, e);
      }
    }

    // Timed out polling
    await ctx.runMutation(internal.muxInternal.updatePostMuxError, {
      postId,
      error: "Video processing timed out",
    });

    return { success: false, playbackId: null };
  },
});
