import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CHATROOM_MESSAGE_TTL_MS,
  getChatroomMessageExpiresAt,
  isChatroomMessageVisible,
} from '../../convex/lib/chatroomMessageExpiry';
import {
  extractMentionHandles,
  isLiveRoomMessageVisible,
  roomDeletionEligible,
} from '../../convex/liveRooms';

describe('Live Room message expiration', () => {
  it('expires each message exactly six hours after its own creation time', () => {
    const firstCreatedAt = Date.UTC(2026, 10, 11, 9);
    const secondCreatedAt = Date.UTC(2026, 10, 11, 10, 30);

    assert.equal(CHATROOM_MESSAGE_TTL_MS, 6 * 60 * 60 * 1000);
    assert.equal(getChatroomMessageExpiresAt(firstCreatedAt), Date.UTC(2026, 10, 11, 15));
    assert.equal(getChatroomMessageExpiresAt(secondCreatedAt), Date.UTC(2026, 10, 11, 16, 30));
  });

  it('keeps a room message visible until, but not at, its authoritative expiration time', () => {
    const createdAt = Date.UTC(2026, 10, 11, 9);
    const expiresAt = Date.UTC(2026, 10, 11, 15);

    assert.equal(isChatroomMessageVisible(createdAt, expiresAt, expiresAt - 1), true);
    assert.equal(isChatroomMessageVisible(createdAt, expiresAt, expiresAt), false);
    assert.equal(isChatroomMessageVisible(createdAt, expiresAt, expiresAt + 1), false);
  });

  it('derives expiration for existing room messages without an expiresAt field', () => {
    const createdAt = Date.UTC(2026, 10, 11, 9);
    const expiresAt = createdAt + CHATROOM_MESSAGE_TTL_MS;

    assert.equal(getChatroomMessageExpiresAt(createdAt), expiresAt);
    assert.equal(isChatroomMessageVisible(createdAt, undefined, expiresAt - 1), true);
    assert.equal(isChatroomMessageVisible(createdAt, undefined, expiresAt), false);
  });

  it('keeps pinned and active-topic messages visible after ordinary expiry', () => {
    const now = Date.UTC(2026, 10, 11, 16);
    const expired = now - 1;
    assert.equal(isLiveRoomMessageVisible({
      message: { createdAt: expired - 1, expiresAt: expired, pinnedAt: expired - 1 },
      isMentionedRecipient: false,
      now,
    }), true);
    assert.equal(isLiveRoomMessageVisible({
      message: { createdAt: expired - 1, expiresAt: expired, topicId: 'topic-1' },
      isMentionedRecipient: false,
      isActiveTopic: true,
      now,
    }), true);
  });

  it('retains an expired mention only for its explicit recipient', () => {
    const now = Date.UTC(2026, 10, 11, 16);
    const message = { createdAt: now - 10, expiresAt: now - 1, expiredAt: now - 1 };
    assert.equal(isLiveRoomMessageVisible({ message, isMentionedRecipient: true, now }), true);
    assert.equal(isLiveRoomMessageVisible({ message, isMentionedRecipient: false, now }), false);
  });

  it('only deletes progressed ordinary messages, never quiet or protected messages', () => {
    const now = Date.UTC(2026, 10, 11, 16);
    const basic = { expiresAt: now - 1, hasNewerMessage: true, now };
    assert.equal(roomDeletionEligible(basic), true);
    assert.equal(roomDeletionEligible({ ...basic, hasNewerMessage: false }), false);
    assert.equal(roomDeletionEligible({ ...basic, pinnedAt: now - 2 }), false);
    assert.equal(roomDeletionEligible({ ...basic, hasMentions: true }), false);
    assert.equal(roomDeletionEligible({ ...basic, topicId: 'topic-1', topicActive: true }), false);
  });

  it('extracts unique supported mention handles without treating malformed text as mentions', () => {
    assert.deepEqual(
      extractMentionHandles('@John @mary.p @john @x @bad-name'),
      ['john', 'mary.p'],
    );
  });
});
