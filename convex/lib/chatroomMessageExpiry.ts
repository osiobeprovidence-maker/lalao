/** Single source of truth for live chatroom message retention (default: 24 hours). */
export const CHATROOM_MESSAGE_RETENTION_HOURS = 24;
export const CHATROOM_MESSAGE_TTL_MS = CHATROOM_MESSAGE_RETENTION_HOURS * 60 * 60 * 1000;

export function getChatroomMessageExpiresAt(createdAt: number, expiresAt?: number): number {
  return expiresAt ?? createdAt + CHATROOM_MESSAGE_TTL_MS;
}

export function isChatroomMessageVisible(createdAt: number, expiresAt: number | undefined, now: number): boolean {
  return getChatroomMessageExpiresAt(createdAt, expiresAt) > now;
}
