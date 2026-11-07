"use node";
import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import crypto from "crypto";
import { requireAdmin } from "./admin";

const PERMITTED_FOLDERS = new Set([
  "posts", "avatars", "pages", "products", "ads", "plum-photos", "plum-vault", "branding", "chatrooms",
]);

export function assertCloudinarySignatureRequest(
  folder: unknown,
  resourceType: unknown,
  access: { authenticated: boolean; role?: string },
): void {
  if (folder !== undefined && (typeof folder !== "string" || !PERMITTED_FOLDERS.has(folder))) {
    throw new ConvexError("This Cloudinary upload folder is not permitted.");
  }
  if (resourceType !== undefined && resourceType !== "image") {
    throw new ConvexError("Only image uploads are permitted through this signature flow.");
  }
  if (!access.authenticated) throw new ConvexError("Authentication is required to upload media.");
  if (folder === "chatrooms" && access.role !== "super_admin" && access.role !== "admin") {
    throw new ConvexError("Administrator access is required for room-banner uploads.");
  }
  if (folder === "branding" && !["super_admin", "admin", "editor"].includes(access.role ?? "")) {
    throw new ConvexError("Administrator access is required for platform-branding uploads.");
  }
}

export const generateSignature = action({
  args: {
    folder: v.optional(v.string()),
    resourceType: v.optional(v.literal("image")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let role: string | undefined;
    if (args.folder === "chatrooms") {
      role = (await requireAdmin(ctx, ["super_admin", "admin"])).role;
    } else if (args.folder === "branding") {
      role = (await requireAdmin(ctx)).role;
    }
    assertCloudinarySignatureRequest(args.folder, args.resourceType, {
      authenticated: !!identity,
      role,
    });

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!apiSecret || !apiKey) {
      throw new ConvexError("Cloudinary is not configured in Convex. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Cloudinary requires parameters to be sorted alphabetically
    const params: Record<string, string | number> = {
      timestamp,
    };
    
    if (args.folder) {
      params.folder = args.folder;
    }
    
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;
    
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    return {
      signature,
      timestamp,
      apiKey,
      folder: args.folder,
      resourceType: "image" as const,
    };
  },
});
