import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Internal mutation to create or link the user profile when Playsole One authentication succeeds.
 */
export const syncPlaysoleUser = internalMutation({
  args: {
    sub: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, { sub, email, name, picture }) => {
    const tokenIdentifier = `https://one.playsole.xyz|${sub}`;
    const now = Date.now();

    // 1. Check if user already exists by tokenIdentifier or email
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (!user && email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
    }

    const effectiveName = name || (email ? email.split("@")[0] : "Playsole User");
    const isSuperAdmin = email && ["riderezzy@gmail.com", "osiobeprovidence@gmail.com"].includes(email);

    if (user) {
      const updates: any = { updatedAt: now };
      if (!user.tokenIdentifier || user.tokenIdentifier !== tokenIdentifier) {
        updates.tokenIdentifier = tokenIdentifier;
      }
      if (!user.avatarUrl && picture) {
        updates.avatarUrl = picture;
      }
      if ((!user.name || user.name === "New user") && effectiveName) {
        updates.name = effectiveName;
      }
      if (isSuperAdmin && user.role !== "super_admin") {
        updates.role = "super_admin";
      }
      await ctx.db.patch(user._id, updates);
      return { ...user, ...updates };
    }

    // 2. New user registration via Playsole One
    const baseUsername = (email ?? `playsole${now}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20);

    const newUserId = await ctx.db.insert("users", {
      tokenIdentifier,
      email,
      name: effectiveName,
      username: baseUsername || `user${now}`,
      avatarUrl: picture,
      onboardingStep: "complete",
      followersCount: 0,
      followingCount: 0,
      role: isSuperAdmin ? "super_admin" : "user",
      phoneSetupCompleted: false,
      phoneVerified: false,
      createdAt: now,
      updatedAt: now,
    } as any);

    return await ctx.db.get(newUserId);
  },
});

/**
 * Exchange Playsole One authorization code for tokens securely from the server,
 * protecting PLAYSOLE_CLIENT_SECRET if configured.
 */
export const exchangeAuthCode = action({
  args: {
    code: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, { code, codeVerifier, redirectUri }) => {
    const clientId = process.env.PLAYSOLE_CLIENT_ID || "lalao";
    const clientSecret = process.env.PLAYSOLE_CLIENT_SECRET;

    const bodyParams: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    };

    if (clientSecret) {
      bodyParams.client_secret = clientSecret;
    }

    const tokenRes = await fetch("https://one.playsole.xyz/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(bodyParams).toString(),
    });

    if (!tokenRes.ok) {
      let errorDesc = "Failed to exchange authorization code.";
      try {
        const errJson = await tokenRes.json();
        errorDesc = errJson.error_description || errJson.error || errorDesc;
      } catch {
        // ignore
      }
      throw new Error(errorDesc);
    }

    const tokenData = await tokenRes.json();

    // Fetch verified user profile with the fresh access token
    let userProfile: any = null;
    try {
      const userinfoRes = await fetch("https://one.playsole.xyz/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      if (userinfoRes.ok) {
        userProfile = await userinfoRes.json();
      }
    } catch (e) {
      console.warn("Could not fetch userinfo in Convex action:", e);
    }

    // Automatically sync or create the user record on the backend
    let userRecord: any = null;
    if (userProfile && userProfile.sub) {
      try {
        userRecord = await ctx.runMutation(internal.playsole.syncPlaysoleUser, {
          sub: userProfile.sub,
          email: userProfile.email ?? undefined,
          name: userProfile.name ?? undefined,
          picture: userProfile.picture ?? undefined,
        });
      } catch (syncErr) {
        console.warn("Failed to sync Playsole user record internally:", syncErr);
      }
    }

    return {
      tokens: tokenData,
      userProfile,
      userRecord,
    };
  },
});
