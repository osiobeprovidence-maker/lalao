import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire memberships and notify before renewal",
  { hours: 24 },
  internal.subscriptions.processDueRenewals,
  {},
);

crons.interval(
  "expire creator subscriptions and send renewal reminders",
  { hours: 24 },
  internal.creators.maintainCreatorSubscriptions,
  {},
);

crons.interval(
  "expire creator trials and deliver trial reminders",
  { minutes: 15 },
  internal.creators.maintainCreatorTrials,
  {},
);

crons.interval(
  "activate and expire ad campaigns",
  { minutes: 15 },
  internal.ads.maintainCampaignLifecycle,
  {},
);

crons.interval(
  "release settled room gift earnings",
  { minutes: 15 },
  internal.gifts.releaseEligibleGiftEarnings,
  {},
);

crons.interval(
  "archive expired live room topics",
  { minutes: 30 },
  internal.liveRooms.archiveExpiredTopics,
  {},
);

export default crons;
