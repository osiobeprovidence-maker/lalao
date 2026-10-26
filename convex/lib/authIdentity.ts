import type { QueryCtx, MutationCtx } from "../_generated/server";
import { providerForIssuer } from "./authLinkPolicy";

type AuthContext = QueryCtx | MutationCtx;

/** Resolve a verified Convex identity to its canonical Lalao user. */
export async function getUserByTokenIdentifier(ctx: AuthContext, tokenIdentifier: string) {
  const mappedIdentity = await ctx.db
    .query("authIdentities")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .collect();

  if (mappedIdentity.length > 1) throw new Error("Authentication identity mapping conflict. Contact support for account recovery.");

  if (mappedIdentity.length === 1) {
    return await ctx.db.get(mappedIdentity[0].userId);
  }

  // Compatibility for existing users until their identity mapping is backfilled.
  const legacyUser = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .collect();
  if (legacyUser.length > 1) throw new Error("Legacy authentication identity conflict. Contact support for account recovery.");
  return legacyUser[0] ?? null;
}

export async function getUserByAuthIdentity(ctx: AuthContext, identity: any) {
  if (!identity?.tokenIdentifier || !identity?.issuer || !identity?.subject) return null;
  const provider = providerForIssuer(String(identity.issuer));
  if (!provider) return null;
  return await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);
}

export function normalizeAuthEmail(email?: string | null): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

export async function getUserByNormalizedEmail(ctx: AuthContext, email?: string | null) {
  const normalizedEmail = normalizeAuthEmail(email);
  if (!normalizedEmail) return null;
  const indexed = await ctx.db
    .query("users")
    .withIndex("by_email_normalized", (q) => q.eq("emailNormalized", normalizedEmail))
    .collect();
  if (indexed.length > 1) throw new Error("This email matches more than one Lalao account. Contact support for safe recovery.");
  if (indexed.length === 1) return indexed[0];
  const exactLegacy = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .collect();
  if (exactLegacy.length > 1) throw new Error("This email matches more than one Lalao account. Contact support for safe recovery.");
  if (exactLegacy.length === 1) return exactLegacy[0];
  const migration = await ctx.db.query("authMigrationState")
    .withIndex("by_key", (q) => q.eq("key", "authIdentityV1"))
    .unique();
  if (migration?.emailNormalizedAt) return null;
  const users = await ctx.db.query("users").collect();
  const matches = users.filter((user) => normalizeAuthEmail(user.email) === normalizedEmail);
  if (matches.length > 1) throw new Error("This email matches more than one Lalao account. Contact support for safe recovery.");
  return matches[0] ?? null;
}

/** Link an already-verified Convex identity without changing the user's stable tokenIdentifier. */
export async function ensureAuthIdentity(ctx: MutationCtx, userId: any, identity: any, provider: "firebase" | "playsole") {
  const issuer = String(identity.issuer || "");
  const subject = String(identity.subject || "");
  if (!issuer || !subject || providerForIssuer(issuer) !== provider || !identity.tokenIdentifier) {
    throw new Error("The authenticated sign-in identity is invalid.");
  }

  const existing = await ctx.db
    .query("authIdentities")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .collect();

  if (existing.length > 1) throw new Error("This sign-in method has conflicting account mappings. Contact support for recovery.");

  if (existing.length === 1) {
    if (existing[0].userId !== userId) throw new Error("This sign-in method is already linked to another Lalao account.");
    const firebaseMethod = provider === "firebase"
      ? String(identity["firebase.sign_in_provider"] || identity.firebase?.sign_in_provider || "")
      : "playsole";
    if (firebaseMethod && existing[0].method !== firebaseMethod) {
      await ctx.db.patch(existing[0]._id, { method: firebaseMethod });
    }
    return existing[0]._id;
  }

  const legacyOwner = await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);
  if (legacyOwner && legacyOwner._id !== userId) {
    throw new Error("This sign-in method is already associated with another Lalao account.");
  }

  const sameProviderSubject = await ctx.db.query("authIdentities")
        .withIndex("by_issuer_subject", (q) => q.eq("issuer", issuer).eq("subject", subject))
        .collect();
  if (sameProviderSubject.length > 1) throw new Error("This provider identity has conflicting account mappings. Contact support for recovery.");
  if (sameProviderSubject.length === 1 && sameProviderSubject[0].userId !== userId) {
    throw new Error("This sign-in method is already linked to another Lalao account.");
  }

  const emailVerified = identity.emailVerified === true;
  const method = provider === "firebase"
    ? String(identity["firebase.sign_in_provider"] || identity.firebase?.sign_in_provider || "") || undefined
    : "playsole";
  return await ctx.db.insert("authIdentities", {
    userId,
    provider,
    issuer,
    subject,
    tokenIdentifier: identity.tokenIdentifier,
    method,
    emailNormalized: emailVerified ? normalizeAuthEmail(identity.email) : undefined,
    emailVerified,
    linkedAt: Date.now(),
  });
}

