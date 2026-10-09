import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessGroupChat,
  canDiscoverGroupCycle,
} from "../convex/groupAccess.ts";

test("private group chats are available only to the creator and invited members", () => {
  const creatorId = "user_creator";
  const memberId = "user_member";

  assert.equal(canAccessGroupChat(creatorId, creatorId, [creatorId, memberId]), true);
  assert.equal(canAccessGroupChat(memberId, creatorId, [creatorId, memberId]), true);
  assert.equal(canAccessGroupChat("user_stranger", creatorId, [creatorId, memberId]), false);
});

test("group cycles are discoverable only when interests overlap", () => {
  assert.equal(
    canDiscoverGroupCycle(["Football", "Sports"], ["Warri", "Football"]),
    true,
  );
  assert.equal(
    canDiscoverGroupCycle(["Technology"], ["Football", "Music"]),
    false,
  );
});
