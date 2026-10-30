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

export default crons;
