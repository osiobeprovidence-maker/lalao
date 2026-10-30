"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

/* ─────────────────────────────────────────────────────────────────────────────
   LALAO EMAIL TEMPLATE BUILDERS
   ───────────────────────────────────────────────────────────────────────────── */

const getBaseEmailLayout = (title: string, contentHtml: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6fc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1e2d;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f6fc;
      padding: 40px 16px;
    }
    .email-card {
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(17, 72, 235, 0.08);
      border: 1px border #e2e8f0;
    }
    .email-header {
      background: linear-gradient(135deg, #1148eb 0%, #0c2bd7 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      color: rgba(255, 255, 255, 0.85);
      font-size: 13px;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .email-body {
      padding: 36px 32px;
    }
    .code-badge {
      display: inline-block;
      background-color: #f0f4ff;
      border: 2px dashed #1148eb;
      color: #1148eb;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      padding: 16px 28px;
      border-radius: 14px;
      margin: 24px 0;
      font-family: monospace;
    }
    .cta-button {
      display: inline-block;
      background-color: #1148eb;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 12px;
      margin: 24px 0;
      box-shadow: 0 4px 14px rgba(17, 72, 235, 0.35);
    }
    .email-footer {
      background-color: #fafbfc;
      border-top: 1px solid #edf2f7;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #718096;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      <div class="email-header">
        <h1 class="brand-title">lalao</h1>
        <p class="brand-subtitle">Your community, closer than ever</p>
      </div>
      <div class="email-body">
        ${contentHtml}
      </div>
      <div class="email-footer">
        <p style="margin: 0 0 6px 0;">© 2026 Lalao · Udu, Delta State & beyond</p>
        <p style="margin: 0;">This email was sent to you because of an action on your Lalao account. If you did not initiate this request, you can safely ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/* ─────────────────────────────────────────────────────────────────────────────
   RESEND CLIENT INITIALIZER HELPER
   ───────────────────────────────────────────────────────────────────────────── */

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || process.env.AUTH_RESEND_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function getSenderEmail() {
  return process.env.RESEND_FROM_EMAIL || "Lalao <onboarding@resend.dev>";
}

/** Send a Firebase-managed verification link through Resend (Firebase owns the token). */
export const sendVerificationLink = action({
  args: { email: v.string(), verificationLink: v.string() },
  handler: async (_ctx, { email, verificationLink }) => {
    const resend = getResendClient();
    if (!resend) throw new Error("Email delivery is temporarily unavailable. Please try again later.");
    const url = new URL(verificationLink);
    if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("Invalid verification link.");
    const safeLink = url.toString().replace(/&/g, "&amp;").replace(/\"/g, "&quot;");
    const html = getBaseEmailLayout("Verify your LaLao email", `<h2>Verify your LaLao email</h2><p>Confirm this email address to secure and activate your LaLao account.</p><p style="text-align:center"><a class="cta-button" href="${safeLink}">Verify Email</a></p><p>If you did not create this account, you can ignore this email.</p>`);
    const result = await resend.emails.send({ from: getSenderEmail(), to: email, subject: "Verify your LaLao email", html, text: `Verify your LaLao account by opening: ${url.toString()}` });
    if (result.error) throw new Error("We could not send the verification email. Please try again later.");
    return { success: true };
  },
});


/* ─────────────────────────────────────────────────────────────────────────────
   CONVEX ACTIONS FOR EMAIL DELIVERY
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Send 6-digit OTP verification email
 */
export const sendOtpEmail = action({
  args: {
    to: v.string(),
    otp: v.string(),
    purpose: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();
    const purposeText = args.purpose || "sign in or verify your account";

    const bodyHtml = `
      <h2 style="font-size: 22px; font-weight: 800; color: #1a202c; margin-top: 0;">Verification Code</h2>
      <p style="font-size: 15px; color: #4a5568; line-height: 1.5;">
        Use the following one-time code to ${purposeText} on Lalao:
      </p>
      <div style="text-align: center;">
        <div class="code-badge">${args.otp}</div>
      </div>
      <p style="font-size: 13px; color: #718096; line-height: 1.5; margin-bottom: 0;">
        ⚠️ <strong>Security tip:</strong> This code is valid for <strong>10 minutes</strong>. Never share this code with anyone. Lalao staff will never ask for your verification code.
      </p>
    `;

    const html = getBaseEmailLayout("Lalao Verification Code", bodyHtml);

    if (!resend) {
      console.warn(`[Resend] RESEND_API_KEY is not configured in Convex environment variables. [MOCK OTP: ${args.otp}] to ${args.to}`);
      return {
        success: false,
        mock: true,
        message: "RESEND_API_KEY is not configured in Convex dashboard environment variables.",
      };
    }

    try {
      const response = await resend.emails.send({
        from: getSenderEmail(),
        to: args.to,
        subject: `Your Lalao verification code: ${args.otp}`,
        html,
      });

      if (response.error) {
        console.error("[Resend] Failed to send OTP:", response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, id: response.data?.id };
    } catch (err: any) {
      console.error("[Resend] Unexpected exception sending OTP:", err);
      return { success: false, error: err.message || "Failed to send email" };
    }
  },
});

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = action({
  args: {
    to: v.string(),
    resetLink: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();

    const bodyHtml = `
      <h2 style="font-size: 22px; font-weight: 800; color: #1a202c; margin-top: 0;">Reset Your Password</h2>
      <p style="font-size: 15px; color: #4a5568; line-height: 1.5;">
        We received a request to reset the password for your Lalao account. Click the button below to choose a new password:
      </p>
      <div style="text-align: center;">
        <a href="${args.resetLink}" class="cta-button">Reset My Password</a>
      </div>
      <p style="font-size: 13px; color: #718096; line-height: 1.5;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${args.resetLink}" style="color: #1148eb; word-break: break-all;">${args.resetLink}</a>
      </p>
      <p style="font-size: 13px; color: #a0aec0; margin-top: 24px; margin-bottom: 0;">
        If you didn't ask to reset your password, you can safely ignore this email. Your current password remains secure.
      </p>
    `;

    const html = getBaseEmailLayout("Reset Your Lalao Password", bodyHtml);

    if (!resend) {
      console.warn(`[Resend] RESEND_API_KEY is not set. [MOCK RESET LINK: ${args.resetLink}] to ${args.to}`);
      return {
        success: false,
        mock: true,
        message: "RESEND_API_KEY is not configured in Convex dashboard environment variables.",
      };
    }

    try {
      const response = await resend.emails.send({
        from: getSenderEmail(),
        to: args.to,
        subject: "Reset your Lalao password",
        html,
      });

      if (response.error) {
        console.error("[Resend] Failed to send password reset:", response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, id: response.data?.id };
    } catch (err: any) {
      console.error("[Resend] Exception sending password reset:", err);
      return { success: false, error: err.message || "Failed to send email" };
    }
  },
});

/**
 * Send welcome email upon joining Lalao
 */
export const sendWelcomeEmail = action({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();
    const displayName = args.name ? `, ${args.name}` : "";

    const bodyHtml = `
      <h2 style="font-size: 22px; font-weight: 800; color: #1a202c; margin-top: 0;">Welcome to Lalao${displayName}! 🎉</h2>
      <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
        We're thrilled to have you in our community. Lalao is built to connect you with what's happening right around you.
      </p>
      <div style="background-color: #f7fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="font-size: 14px; font-weight: 700; color: #2d3748; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Here's how to get started:</h3>
        <ul style="font-size: 14px; color: #4a5568; padding-left: 20px; margin-bottom: 0; line-height: 1.7;">
          <li><strong>Discover Nearby:</strong> Explore events, rallies, and happenings in your area.</li>
          <li><strong>Join Rallies:</strong> Team up with neighbors for local initiatives and meetups.</li>
          <li><strong>Create & Share:</strong> Share cycles, moments, and updates with your community.</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="https://lalao.app/app" class="cta-button">Open Lalao App</a>
      </div>
    `;

    const html = getBaseEmailLayout("Welcome to Lalao", bodyHtml);

    if (!resend) {
      console.warn(`[Resend] RESEND_API_KEY is not set. [MOCK WELCOME EMAIL] to ${args.to}`);
      return {
        success: false,
        mock: true,
        message: "RESEND_API_KEY is not configured in Convex dashboard environment variables.",
      };
    }

    try {
      const response = await resend.emails.send({
        from: getSenderEmail(),
        to: args.to,
        subject: "Welcome to Lalao! 🎉",
        html,
      });

      if (response.error) {
        console.error("[Resend] Failed to send welcome email:", response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, id: response.data?.id };
    } catch (err: any) {
      console.error("[Resend] Exception sending welcome email:", err);
      return { success: false, error: err.message || "Failed to send email" };
    }
  },
});

/**
 * Generic transactional email action
 */
export const sendCustomEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = getResendClient();

    if (!resend) {
      console.warn(`[Resend] RESEND_API_KEY not configured. Mock custom email to ${args.to}: ${args.subject}`);
      return {
        success: false,
        mock: true,
        message: "RESEND_API_KEY is not configured in Convex dashboard environment variables.",
      };
    }

    try {
      const response = await resend.emails.send({
        from: args.from || getSenderEmail(),
        to: args.to,
        subject: args.subject,
        html: args.html,
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, id: response.data?.id };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to send custom email" };
    }
  },
});
