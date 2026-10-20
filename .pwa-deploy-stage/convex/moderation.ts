import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admin";

const SEED_REASONS = [
  {
    code: "HARASSMENT_BULLYING",
    title: "Harassment or Bullying",
    description: "Targeted harassment or bullying against an individual.",
    userMessage: "This content was removed because it violates Lalao's community guidelines regarding harassment or bullying.",
    defaultSeverity: "medium" as const
  },
  {
    code: "HATE_DISCRIMINATION",
    title: "Hate or Discriminatory Content",
    description: "Hate speech or discriminatory content.",
    userMessage: "This content was removed because it contains hateful or discriminatory material that violates Lalao's community guidelines.",
    defaultSeverity: "high" as const
  },
  {
    code: "THREATS_VIOLENCE",
    title: "Threats or Violence",
    description: "Threats, encouragement of violence, or other violent content.",
    userMessage: "This content was removed because it contains threats, encouragement of violence, or other violent content prohibited by Lalao's community guidelines.",
    defaultSeverity: "critical" as const
  },
  {
    code: "SEXUAL_EXPLICIT",
    title: "Sexual or Explicit Content",
    description: "Sexual or explicit material not permitted on Lalao.",
    userMessage: "This content was removed because it contains sexual or explicit material that is not permitted on Lalao.",
    defaultSeverity: "high" as const
  },
  {
    code: "CHILD_SAFETY",
    title: "Child Safety Violation",
    description: "Violations against child safety standards.",
    userMessage: "This content was removed because it violates Lalao's child safety standards.",
    defaultSeverity: "critical" as const
  },
  {
    code: "ILLEGAL_ACTIVITY",
    title: "Illegal Activity",
    description: "Promoting, facilitating, or depicting illegal activity.",
    userMessage: "This content was removed because it promotes, facilitates, or depicts illegal activity in violation of Lalao's community guidelines.",
    defaultSeverity: "critical" as const
  },
  {
    code: "FRAUD_SCAM",
    title: "Fraud, Scams, or Deceptive Practices",
    description: "Fraudulent, deceptive, or scam-related activity.",
    userMessage: "This content was removed because it contains fraudulent, deceptive, or scam-related activity that violates Lalao's community guidelines.",
    defaultSeverity: "high" as const
  },
  {
    code: "SPAM_COMMERCIAL",
    title: "Spam or Unwanted Commercial Content",
    description: "Spam or unwanted commercial content.",
    userMessage: "This content was removed because it was identified as spam or unwanted commercial content.",
    defaultSeverity: "low" as const
  },
  {
    code: "DANGEROUS_HARMFUL",
    title: "Dangerous or Harmful Activity",
    description: "Promoting dangerous or harmful activity.",
    userMessage: "This content was removed because it promotes dangerous or harmful activity that violates Lalao's community guidelines.",
    defaultSeverity: "high" as const
  },
  {
    code: "MISINFORMATION",
    title: "Misinformation or Misleading Content",
    description: "Misleading or deceptive information.",
    userMessage: "This content was removed because it contains misleading or deceptive information that violates Lalao's content standards.",
    defaultSeverity: "medium" as const
  },
  {
    code: "PRIVACY_VIOLATION",
    title: "Privacy Violation",
    description: "Improperly exposing or distributing another person's private or sensitive information.",
    userMessage: "This content was removed because it improperly exposes or distributes another person's private or sensitive information.",
    defaultSeverity: "high" as const
  },
  {
    code: "INTELLECTUAL_PROPERTY",
    title: "Intellectual Property Violation",
    description: "Violating intellectual property rights.",
    userMessage: "This content was removed because it violates intellectual property rights or Lalao's intellectual property standards.",
    defaultSeverity: "medium" as const
  },
  {
    code: "IMPERSONATION",
    title: "Impersonation",
    description: "Impersonation or misleading representation.",
    userMessage: "This content was removed because it violates Lalao's rules regarding impersonation or misleading representation.",
    defaultSeverity: "high" as const
  },
  {
    code: "PLATFORM_MANIPULATION",
    title: "Platform Manipulation",
    description: "Manipulation, artificial engagement, or platform abuse.",
    userMessage: "This content was removed because it involves manipulation, artificial engagement, or other activity intended to abuse Lalao's platform systems.",
    defaultSeverity: "high" as const
  },
  {
    code: "OTHER_GUIDELINES",
    title: "Other Community Guidelines Violation",
    description: "Other violations of the community guidelines.",
    userMessage: "This content was removed because it violates Lalao's community guidelines.",
    defaultSeverity: "low" as const
  }
];

export const listReasons = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireAdmin(ctx);
      return await ctx.db.query("moderationReasons").filter(q => q.eq(q.field("enabled"), true)).collect();
    } catch (e: any) {
      console.error("listReasons error:", e);
      throw new Error(`listReasons failed: ${e.message}`);
    }
  }
});

export const seedReasons = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      await requireAdmin(ctx, ["super_admin"]);

      const existing = await ctx.db.query("moderationReasons").collect();
      const existingCodes = new Set(existing.map(r => r.code));

      let sortOrder = 1;
      for (const reason of SEED_REASONS) {
        if (!existingCodes.has(reason.code)) {
          await ctx.db.insert("moderationReasons", {
            ...reason,
            enabled: true,
            sortOrder: sortOrder++,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      }
    } catch (e: any) {
      console.error("seedReasons error:", e);
      throw new Error(`seedReasons failed: ${e.message}`);
    }
  }
});
