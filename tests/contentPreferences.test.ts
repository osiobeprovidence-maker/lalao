import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PLATFORM_TOPICS } from "../convex/topics.ts";

/**
 * Pure helper verifying feed recommendation filtering and sensitive safeguards
 */
export function isPostEligibleForForYou(
  post: {
    authorId: string;
    contentTopics?: string[];
    text?: string;
    moderationStatus?: string;
    audience?: string;
  },
  viewer: {
    id: string;
    interestedSlugs: string[];
    excludedSlugs: string[];
  },
  sensitiveOptInSlugs: string[]
): { eligible: boolean; scoreMultiplier: number; reason?: string } {
  if (post.moderationStatus === "removed") {
    return { eligible: false, scoreMultiplier: 0, reason: "moderation_removed" };
  }

  // Audience access check
  if (post.audience === "closeFriends" && post.authorId !== viewer.id) {
    return { eligible: false, scoreMultiplier: 0, reason: "audience_restricted" };
  }

  // Extract topics
  const topics: string[] = [];
  if (post.contentTopics && Array.isArray(post.contentTopics)) {
    for (const t of post.contentTopics) topics.push(t.toLowerCase());
  }
  if (post.text) {
    const hashMatches = post.text.toLowerCase().match(/#(\w+)/g);
    if (hashMatches) {
      for (const hm of hashMatches) topics.push(hm.substring(1).toLowerCase());
    }
  }

  // 1. Excluded topics:
  // Completely exclude matching posts from recommendations if user opted to exclude
  const isExcluded = topics.some((t) => viewer.excludedSlugs.includes(t));
  if (isExcluded && post.authorId !== viewer.id) {
    return { eligible: false, scoreMultiplier: 0, reason: "topic_excluded" };
  }

  // 2. Sensitive topic opt-in safeguard:
  // Must NOT proactively recommend to viewer unless viewer explicitly opted into the topic
  const isSensitive = topics.some((t) => sensitiveOptInSlugs.includes(t));
  if (isSensitive) {
    const viewerHasOptedIn = topics.some((t) => viewer.interestedSlugs.includes(t));
    if (!viewerHasOptedIn && post.authorId !== viewer.id) {
      return { eligible: false, scoreMultiplier: 0, reason: "sensitive_requires_opt_in" };
    }
  }

  // 3. Multiplier calculation:
  let multiplier = 1;
  const isInterested = topics.some((t) => viewer.interestedSlugs.includes(t));
  if (isInterested) {
    multiplier = 3.5;
  }

  return { eligible: true, scoreMultiplier: multiplier };
}

test("User with no preferences receives standard public feed without errors", () => {
  const viewer = { id: "viewer_1", interestedSlugs: [], excludedSlugs: [] };
  const post = {
    authorId: "creator_1",
    contentTopics: ["gaming"],
    text: "Great new game!",
  };

  const sensitive = ["lgbtq_queer", "religion_spirituality", "politics_civic"];
  const result = isPostEligibleForForYou(post, viewer, sensitive);

  assert.equal(result.eligible, true);
  assert.equal(result.scoreMultiplier, 1);
});

test("Sensitive topics (e.g. LGBTQ+ or Religion) are NOT recommended to non-opted-in users", () => {
  const viewer = { id: "viewer_standard", interestedSlugs: ["gaming"], excludedSlugs: [] };
  const sensitivePost = {
    authorId: "creator_2",
    contentTopics: ["lgbtq_queer"],
    text: "Pride event and community meetup #lgbtq_queer",
  };

  const sensitive = ["lgbtq_queer", "religion_spirituality", "politics_civic"];
  const result = isPostEligibleForForYou(sensitivePost, viewer, sensitive);

  // Proactive recommendation blocked for non-opted-in user
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "sensitive_requires_opt_in");
});

test("Sensitive topic IS recommended to users who explicitly opted in", () => {
  const viewer = { id: "viewer_opted_in", interestedSlugs: ["lgbtq_queer", "music"], excludedSlugs: [] };
  const sensitivePost = {
    authorId: "creator_2",
    contentTopics: ["lgbtq_queer"],
    text: "Pride event and community meetup #lgbtq_queer",
  };

  const sensitive = ["lgbtq_queer", "religion_spirituality", "politics_civic"];
  const result = isPostEligibleForForYou(sensitivePost, viewer, sensitive);

  assert.equal(result.eligible, true);
  assert.equal(result.scoreMultiplier, 3.5); // Boosted for interested viewer
});

test("Excluded topics are completely hidden from recommendations", () => {
  const viewer = { id: "viewer_filter", interestedSlugs: ["technology_ai"], excludedSlugs: ["politics_civic"] };
  const politicsPost = {
    authorId: "creator_3",
    contentTopics: ["politics_civic"],
    text: "Debating local policy and tax laws",
  };

  const sensitive = ["lgbtq_queer", "religion_spirituality", "politics_civic"];
  const result = isPostEligibleForForYou(politicsPost, viewer, sensitive);

  assert.equal(result.eligible, false);
  assert.equal(result.reason, "topic_excluded");
});

test("Topics catalog has stable slugs and appropriate sensitive classifications", () => {
  assert.ok(DEFAULT_PLATFORM_TOPICS.length >= 15);

  const lgbtq = DEFAULT_PLATFORM_TOPICS.find((t) => t.slug === "lgbtq_queer");
  assert.ok(lgbtq);
  assert.equal(lgbtq.isSensitive, true);
  assert.equal(lgbtq.requiresExplicitOptIn, true);
  assert.equal(lgbtq.allowAutoSuggestion, false);

  const gaming = DEFAULT_PLATFORM_TOPICS.find((t) => t.slug === "gaming");
  assert.ok(gaming);
  assert.equal(gaming.isSensitive, false);
  assert.equal(gaming.requiresExplicitOptIn, false);
});
