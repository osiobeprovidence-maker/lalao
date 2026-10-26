import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserByAuthIdentity, getUserByTokenIdentifier, getUserByNormalizedEmail, normalizeAuthEmail, ensureAuthIdentity } from "./lib/authIdentity";
import { PLAYSOLE_ISSUER, decidePlaysoleLogin, isAuthLinkChallengeValid, providerForIssuer } from "./lib/authLinkPolicy";

/** Resolve a verified Playsole login without ever linking it by email. */
export const resolvePlaysoleLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.issuer !== PLAYSOLE_ISSUER || !identity.subject) {
      throw new Error("A verified Playsole One session is required.");
    }

    const explicitMappings = await ctx.db.query("authIdentities")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .collect();
    if (explicitMappings.length > 1) throw new Error("Authentication identity mapping conflict. Contact support for recovery.");
    if (explicitMappings.length === 1) {
      const mappedUser = await ctx.db.get(explicitMappings[0].userId);
      if (!mappedUser) throw new Error("The linked Lalao account could not be found. Contact support for recovery.");
      return { status: "ready" as const, userId: mappedUser._id };
    }

    const legacyUser = await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);
    const emailVerified = identity.emailVerified === true;
    const normalizedEmail = emailVerified ? normalizeAuthEmail(identity.email) : undefined;
    const emailOwner = normalizedEmail ? await getUserByNormalizedEmail(ctx, normalizedEmail) : null;
    const decision = decidePlaysoleLogin({
      explicitMapping: false,
      legacyIdentityOwner: Boolean(legacyUser),
      verifiedEmail: emailVerified,
      hasEmail: Boolean(identity.email),
      emailOwnerExists: Boolean(emailOwner),
      emailOwnerIsLegacyIdentityOwner: Boolean(legacyUser && emailOwner?._id === legacyUser._id),
    });
    if (decision === "link_required") return { status: "link_required" as const };
    if (decision === "email_verification_required") return { status: "email_verification_required" as const };
    if (legacyUser) {
      await ensureAuthIdentity(ctx, legacyUser._id, identity, "playsole");
      return { status: "ready" as const, userId: legacyUser._id };
    }

    const now = Date.now();
    const email = normalizedEmail ? String(identity.email) : undefined;
    const usernameBase = email?.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email,
      emailNormalized: normalizedEmail,
      name: identity.name || usernameBase || "Playsole User",
      username: usernameBase || `playsole${String(identity.subject).slice(-12)}${now}`,
      avatarUrl: identity.pictureUrl || undefined,
      onboardingStep: "complete",
      followersCount: 0,
      followingCount: 0,
      role: "user",
      phoneSetupCompleted: false,
      phoneVerified: false,
      createdAt: now,
      updatedAt: now,
    } as any);

    await ensureAuthIdentity(ctx, userId, identity, "playsole");
    return { status: "ready" as const, userId };
  },
});

/** Start a short-lived, single-use proof request from the currently signed-in canonical account. */
export const beginAuthLink = mutation({
  args: { targetProvider: v.union(v.literal("firebase"), v.literal("playsole")) },
  handler: async (ctx, { targetProvider }) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = identity ? await getUserByAuthIdentity(ctx, identity) : null;
    if (!identity || !user) throw new Error("Sign in to the account you want to keep before linking another method.");

    const token = crypto.randomUUID();
    const createdAt = Date.now();
    await ctx.db.insert("authLinkChallenges", {
      token,
      userId: user._id,
      initiatingTokenIdentifier: identity.tokenIdentifier,
      initiatingIssuer: String(identity.issuer),
      initiatingSubject: String(identity.subject),
      targetProvider,
      createdAt,
      expiresAt: createdAt + 10 * 60 * 1000,
    });
    return { token, expiresAt: createdAt + 10 * 60 * 1000 };
  },
});

/** Consume a challenge created under the canonical session, using a separately verified provider JWT. */
export const completeAuthLink = mutation({
  args: { challenge: v.string() },
  handler: async (ctx, { challenge }) => {
    const identity = await ctx.auth.getUserIdentity();
    const provider = identity ? providerForIssuer(String(identity.issuer || "")) : null;
    if (!identity || !provider || !identity.subject) throw new Error("Authenticate with the sign-in method you want to link.");
    const records = await ctx.db.query("authLinkChallenges")
      .withIndex("by_token", (q) => q.eq("token", challenge))
      .collect();
    if (records.length !== 1) throw new Error("This linking request expired. Start again from account settings.");
    const record = records[0];
    if (!isAuthLinkChallengeValid({
      exists: true,
      consumed: Boolean(record.consumedAt),
      expiresAt: record.expiresAt,
      now: Date.now(),
      requestedProvider: record.targetProvider,
      authenticatedProvider: provider,
    })) {
      throw new Error("This linking request expired. Start again from account settings.");
    }
    const owner = await ctx.db.get(record.userId);
    if (!owner || !record.initiatingTokenIdentifier || !record.initiatingIssuer || !record.initiatingSubject) {
      throw new Error("The original account session could not be verified. Start linking again from account settings.");
    }
    if (record.initiatingTokenIdentifier !== `${record.initiatingIssuer}|${record.initiatingSubject}`) {
      throw new Error("The original account identity in this linking request is inconsistent.");
    }
    const primaryMappings = await ctx.db.query("authIdentities")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", record.initiatingTokenIdentifier!))
      .collect();
    const primaryIsCanonical = primaryMappings.some((mapping) => mapping.userId === owner._id)
      || owner.tokenIdentifier === record.initiatingTokenIdentifier;
    if (!primaryIsCanonical) throw new Error("The original account session is no longer linked. Sign in again and restart linking.");
    const providerOwner = await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);
    if (providerOwner && providerOwner._id !== owner._id) {
      throw new Error("This sign-in method is already mapped to another account. Use account recovery before moving it.");
    }
    await ensureAuthIdentity(ctx, owner._id, identity, provider);
    await ctx.db.patch(record._id, { consumedAt: Date.now() });
    return { success: true, provider };
  },
});

export const getMyAuthMethods = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = identity ? await getUserByAuthIdentity(ctx, identity) : null;
    if (!identity || !user) return [];
    const linked = await ctx.db
      .query("authIdentities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const currentProvider = providerForIssuer(String(identity.issuer || ""));
    const methods = new Set(linked.map((entry) => entry.provider));
    if (currentProvider) methods.add(currentProvider);
    return [...methods].map((provider) => ({
      provider,
      methods: linked.filter((entry) => entry.provider === provider).map((entry) => entry.method).filter((method): method is string => Boolean(method)),
    }));
  },
});

/** Idempotent paginated preparation step for the normalized email index. */
export const backfillNormalizedEmails = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("users").paginate({ numItems: 100, cursor });
    let updated = 0;
    for (const user of page.page) {
      const emailNormalized = normalizeAuthEmail(user.email);
      if (emailNormalized && user.emailNormalized !== emailNormalized) {
        await ctx.db.patch(user._id, { emailNormalized });
        updated += 1;
      }
    }
    if (page.isDone) {
      const current = await ctx.db.query("authMigrationState")
        .withIndex("by_key", (q) => q.eq("key", "authIdentityV1"))
        .unique();
      if (current) await ctx.db.patch(current._id, { emailNormalizedAt: Date.now() });
      else await ctx.db.insert("authMigrationState", { key: "authIdentityV1", emailNormalizedAt: Date.now() });
    }
    return { updated, done: page.isDone, cursor: page.continueCursor };
  },
});

/** Backfill legacy tokenIdentifier rows into the multi-identity index, without changing users. */
export const backfillAuthIdentities = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("users").paginate({ numItems: 100, cursor });
    const conflicts: string[] = [];
    let inserted = 0;
    for (const user of page.page) {
      const separator = user.tokenIdentifier.indexOf("|");
      if (separator <= 0) continue;
      const issuer = user.tokenIdentifier.slice(0, separator);
      const subject = user.tokenIdentifier.slice(separator + 1);
      const provider = providerForIssuer(issuer);
      if (!provider || !subject) continue;

      const byToken = await ctx.db.query("authIdentities")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", user.tokenIdentifier))
        .unique();
      const bySubject = await ctx.db.query("authIdentities")
        .withIndex("by_issuer_subject", (q) => q.eq("issuer", issuer).eq("subject", subject))
        .unique();
      if ((byToken && byToken.userId !== user._id) || (bySubject && bySubject.userId !== user._id)) {
        conflicts.push(user._id);
        const recorded = await ctx.db.query("authIdentityBackfillConflicts")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();
        if (!recorded) {
          await ctx.db.insert("authIdentityBackfillConflicts", {
            userId: user._id,
            tokenIdentifier: user.tokenIdentifier,
            notedAt: Date.now(),
          });
        }
        continue;
      }
      if (byToken || bySubject) continue;

      await ctx.db.insert("authIdentities", {
        userId: user._id,
        provider,
        issuer,
        subject,
        tokenIdentifier: user.tokenIdentifier,
        emailVerified: false,
        linkedAt: user.createdAt,
      });
      inserted += 1;
    }
    const allConflicts = page.isDone
      ? await ctx.db.query("authIdentityBackfillConflicts").collect()
      : [];
    if (page.isDone && allConflicts.length === 0) {
      const current = await ctx.db.query("authMigrationState")
        .withIndex("by_key", (q) => q.eq("key", "authIdentityV1"))
        .unique();
      if (current) await ctx.db.patch(current._id, { authIdentitiesBackfilledAt: Date.now() });
      else await ctx.db.insert("authMigrationState", { key: "authIdentityV1", authIdentitiesBackfilledAt: Date.now() });
    }
    return { inserted, conflicts, done: page.isDone, cursor: page.continueCursor };
  },
});

/** Exchange a Playsole authorization code. The returned OIDC token is verified by Convex auth before it is trusted. */
export const exchangeAuthCode = action({
  args: {
    code: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
    nonce: v.string(),
    intent: v.optional(v.union(v.literal("login"), v.literal("link"))),
  },
  handler: async (ctx, { code, codeVerifier, redirectUri, nonce, intent = "login" }) => {
    const clientId = process.env.PLAYSOLE_CLIENT_ID || "lalao";
    const clientSecret = process.env.PLAYSOLE_CLIENT_SECRET;
    const bodyParams: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    };
    if (clientSecret) bodyParams.client_secret = clientSecret;
    const tokenRes = await fetch("https://one.playsole.xyz/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams).toString(),
    });
    if (!tokenRes.ok) throw new Error("Playsole sign-in could not be verified. Please try again.");

    const tokenData = await tokenRes.json();
    if (typeof tokenData.id_token !== "string") throw new Error("Playsole sign-in could not be verified. Please try again.");
    const idClaims = decodePlaysoleJwtClaims(tokenData.id_token);
    if (
      idClaims.iss !== PLAYSOLE_ISSUER ||
      !idClaims.audiences.includes(clientId) ||
      idClaims.nonce !== nonce ||
      !idClaims.sub ||
      typeof idClaims.exp !== "number" ||
      idClaims.exp <= Math.floor(Date.now() / 1000)
    ) throw new Error("Playsole sign-in could not be verified. Please try again.");
    let userProfile: any = null;
    try {
      const userinfoRes = await fetch("https://one.playsole.xyz/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userinfoRes.ok) {
        userProfile = await userinfoRes.json();
      }
    } catch {
      // Convex independently validates the ID token before login or linking.
    }
    if (userProfile?.sub && userProfile.sub !== idClaims.sub) {
      throw new Error("Playsole sign-in could not be verified. Please try again.");
    }
    if (!userProfile?.sub) {
      userProfile = {
        sub: idClaims.sub,
        email: idClaims.email,
        email_verified: idClaims.email_verified,
        name: idClaims.name,
        picture: idClaims.picture,
      };
    } else {
      // Identity and account-discovery claims come only from the signed token;
      // userinfo is used for optional display data after subject validation.
      userProfile = {
        ...userProfile,
        email: idClaims.email,
        email_verified: idClaims.email_verified,
        name: idClaims.name ?? userProfile.name,
        picture: idClaims.picture ?? userProfile.picture,
      };
    }
    // Do not create or resolve a Lalao account here. This action can decode
    // claims but cannot ask Convex auth to validate the bearer ID token. The
    // callback performs account resolution via Convex after token validation.
    return { tokens: tokenData, userProfile };
  },
});

/** Decode claims only for comparisons; Convex auth is the authority that verifies the JWT signature. */
function decodePlaysoleJwtClaims(token: string): {
  iss?: unknown;
  aud?: unknown;
  audiences: string[];
  nonce?: unknown;
  sub: string;
  exp?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  picture?: unknown;
} {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Playsole sign-in could not be verified. Please try again.");
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")));
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.every((value: unknown) => typeof value === "string")) {
      throw new Error("invalid audience");
    }
    if (typeof claims.sub !== "string" || !claims.sub) throw new Error("invalid subject");
    return { ...claims, sub: claims.sub, audiences };
  } catch {
    throw new Error("Playsole sign-in could not be verified. Please try again.");
  }
}
