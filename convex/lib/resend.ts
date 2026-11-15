/**
 * Shared Resend client helpers.
 *
 * Resend API credentials live in the Convex environment (RESEND_API_KEY /
 * RESEND_FROM_EMAIL) and are never exposed to the browser.
 */
import { Resend } from "resend";

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY || process.env.AUTH_RESEND_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getSenderEmail(): string {
  // Never fall back to a default sender (e.g. onboarding@resend.dev).
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!sender || sender.trim().length === 0) {
    throw new Error("Email delivery is not configured for this deployment (RESEND_FROM_EMAIL missing).");
  }
  return sender;
}
