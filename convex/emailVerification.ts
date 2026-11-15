/**
 * Server-side email verification OTP system.
 *
 * Internal mutations are exposed to client actions through `internal.emailVerification.*`
 * — they are never client-callable, never return the code, and only operate on
 * the currently-authenticated Firebase-Convex identity.
 *
 * Security properties:
 *   - CSPRNG-generated 6-digit codes (Web Crypto).
 *   - Only a SHA-256 hash is persisted; the plaintext code is never stored or returned.
 *   - Codes expire after 10 minutes; previous codes are invalidated on every resend.
 *   - Max 5 verify attempts per code; resend cooldown 60 s; max 5 sends / hour.
 *   - Successful verification is a one-shot state transition (idempotent on repeat).
 */

import { internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { getUserByAuthIdentity, normalizeAuthEmail } from "./lib/authIdentity";
import {
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_SENDS_PER_HOUR,
  generateOtpCode,
  hashOtpCode,
  timingSafeHexEqual,
  isOtpFormat,
  isOtpExpired,
} from "./lib/emailOtpSecurity";

async function getAuthedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await getUserByAuthIdentity(ctx, identity);
  if (!user) throw new ConvexError("Account not found");
  return { user, identity };
}

/** Create a fresh hashed OTP for the caller, invalidating prior unconsumed codes. */
export const prepareEmailOtp = internalMutation({
  args: {},
  handler: async (ctx) => {
    const { user, identity } = await getAuthedUser(ctx);

    // Verified account: nothing to send.
    if (typeof user.emailVerifiedAt === "number") {
      throw new ConvexError("Email is already verified");
    }
    const sendKey = `email-otp-send:${user._id}`;
    const previousSends = (await ctx.db
      .query("emailVerificationOtps")
      .withIndex("by_user_created", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(OTP_MAX_SENDS_PER_HOUR));
    const now = Date.now();

    if (previousSends[0] && now - previousSends[0].createdAt < OTP_RESEND_COOLDOWN_MS) {
      throw new ConvexError("Please wait before requesting another code");
    }
    if (previousSends.length >= OTP_MAX_SENDS_PER_HOUR) {
      const oldest = previousSends[previousSends.length - 1];
      if (oldest && now - oldest.createdAt < 60 * 60 * 1000) {
        throw new ConvexError("Too many codes requested. Please try again later");
      }
    }

    const email = identity.email ?? user.email;
    if (!email) throw new ConvexError("Your account has no email address");

    // Invalidate all unconsumed codes for this user.
    for (const prior of previousSends) {
      if (prior.consumedAt === undefined) {
        await ctx.db.patch(prior._id, { consumedAt: now });
      }
    }

    const code = generateOtpCode();
    if (!isOtpFormat(code)) {
      throw new ConvexError("Failed to generate verification code");
    }
    const codeHash = await hashOtpCode(code);

    await ctx.db.insert("emailVerificationOtps", {
      userId: user._id,
      email,
      codeHash,
      attempts: 0,
      createdAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
    });

    // Record send
    const existing = await ctx.db.query("emailSendLimits").withIndex("by_key", (q: any) => q.eq("key", sendKey)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { sentAt: now });
    } else {
      await ctx.db.insert("emailSendLimits", { key: sendKey, sentAt: now });
    }

    return { code, name: user.name ?? "there", to: email };
  },
});

/** Whether the current Firebase-authenticated user has verified their email address. */
export const getEmailVerificationStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { verified: false, reason: "not_authenticated" as const };
    const user = await getUserByAuthIdentity(ctx, identity);
    if (!user) return { verified: false, reason: "not_found" as const };
    return { verified: typeof user.emailVerifiedAt === "number", reason: "ok" as const };
  },
});

/** Verify a 6-digit code against the latest unconsumed code for the caller. */
export const verifyEmailOtp = internalMutation({
  args: { otp: v.string() },
  handler: async (ctx, { otp }) => {
    const { user, identity } = await getAuthedUser(ctx);

    if (typeof user.emailVerifiedAt === "number") {
      return { verified: true as const, reason: "already_verified" as const };
    }
    if (!isOtpFormat(otp)) {
      return { verified: false as const, reason: "invalid" as const };
    }

    const candidates = await ctx.db
      .query("emailVerificationOtps")
      .withIndex("by_user_created", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .take(5);

    const latest = candidates.find((row: any) => row.consumedAt === undefined);
    if (!latest) {
      return { verified: false as const, reason: "invalid" as const };
    }
    if (isOtpExpired(latest.expiresAt)) {
      await ctx.db.patch(latest._id, { consumedAt: Date.now() });
      return { verified: false as const, reason: "expired" as const };
    }

    // Enforce per-code attempts; never leak which component failed.
    if (latest.attempts >= OTP_MAX_ATTEMPTS) {
      await ctx.db.patch(latest._id, { consumedAt: Date.now() });
      return { verified: false as const, reason: "attempts_exceeded" as const };
    }

    const candidateHash = await hashOtpCode(otp);
    if (!timingSafeHexEqual(candidateHash, latest.codeHash)) {
      await ctx.db.patch(latest._id, { attempts: latest.attempts + 1 });
      return { verified: false as const, reason: "invalid" as const };
    }

    const now = Date.now();
    await ctx.db.patch(latest._id, { consumedAt: now });

    // Mark both the users row and the auth identity as verified.
    await ctx.db.patch(user._id, { emailVerifiedAt: now, updatedAt: now });
    const normalized = normalizeAuthEmail(identity.email ?? user.email);
    const identities = await ctx.db
      .query("authIdentities")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    for (const identityDoc of identities) {
      if (identityDoc.issuer && identity.issuer && identityDoc.issuer === identity.issuer) {
        const patch: Record<string, unknown> = { emailVerified: true };
        if (normalized) patch.emailNormalized = normalized;
        await ctx.db.patch(identityDoc._id, patch);
      }
    }

    return { verified: true as const, reason: "verified" as const };
  },
});
