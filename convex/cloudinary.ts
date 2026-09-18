"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

export const generateSignature = action({
  args: {
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!apiSecret || !apiKey) {
      throw new Error("Cloudinary API Key or Secret is missing. Please add them via 'npx convex env set CLOUDINARY_API_KEY ...'");
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
    };
  },
});
