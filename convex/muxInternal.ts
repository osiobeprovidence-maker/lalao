/**
 * muxInternal.ts
 * Internal Convex mutations for Mux video integration.
 * These run in the standard Convex runtime (NOT Node.js),
 * so they can be called from Node.js actions in mux.ts.
 */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * updatePostMuxStatus
 * Called from the pollAndUpdatePost action once Mux has finished processing a video.
 * Updates the post with the Mux asset ID, playback ID, and a stable thumbnail URL.
 */
export const updatePostMuxStatus = internalMutation({
  args: {
    postId: v.id("posts"),
    muxAssetId: v.string(),
    muxPlaybackId: v.string(),
  },
  handler: async (ctx, { postId, muxAssetId, muxPlaybackId }) => {
    await ctx.db.patch(postId, {
      muxAssetId,
      muxPlaybackId,
      // Set a stable Mux thumbnail as the mediaUrl for OG previews / fallback
      mediaUrl: `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg`,
    });
  },
});
