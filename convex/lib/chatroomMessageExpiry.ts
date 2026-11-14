export const CHATROOM_MESSAGE_TTL_MS = 6 * 60 * 60 * 1000;

export function getChatroomMessageExpiresAt(createdAt: number, expiresAt?: number): number {
  return expiresAt ?? createdAt + CHATROOM_MESSAGE_TTL_MS;
}

export function isChatroomMessageVisible(createdAt: number, expiresAt: number | undefined, now: number): boolean {
  return getChatroomMessageExpiresAt(createdAt, expiresAt) > now;
}
