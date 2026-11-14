export const CREATOR_TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
export const CREATOR_TRIAL_REMINDER_OFFSETS_MS = {
  sevenDays: 7 * 24 * 60 * 60 * 1000,
  threeDays: 3 * 24 * 60 * 60 * 1000,
  oneDay: 24 * 60 * 60 * 1000,
} as const;

export type CreatorTrialEmailKind = "sevenDays" | "threeDays" | "oneDay" | "expired";

export function getCreatorTrialExpiry(startedAt: number): number {
  return startedAt + CREATOR_TRIAL_DURATION_MS;
}

export function getCreatorTrialEmailSchedule(expiresAt: number): Array<{ kind: CreatorTrialEmailKind; scheduledAt: number }> {
  return [
    { kind: "sevenDays", scheduledAt: expiresAt - CREATOR_TRIAL_REMINDER_OFFSETS_MS.sevenDays },
    { kind: "threeDays", scheduledAt: expiresAt - CREATOR_TRIAL_REMINDER_OFFSETS_MS.threeDays },
    { kind: "oneDay", scheduledAt: expiresAt - CREATOR_TRIAL_REMINDER_OFFSETS_MS.oneDay },
    { kind: "expired", scheduledAt: expiresAt },
  ];
}

export function isValidTrialEmail(email: string | undefined, verified: boolean): email is string {
  return Boolean(verified && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}
