import assert from "node:assert/strict";
import { deleteRecentSearchShadowRevision, nextRecentSearchShadowRevision } from "../../convex/lib/recentSearchShadowRevision";

// Synthetic per-record timeline: retries may be delivered in any order, but a
// deletion revision must remain greater than every sync captured before it.
const firstSync = 1_000;
const secondSync = nextRecentSearchShadowRevision(firstSync, 1_000); // same millisecond
const deleteRevision = deleteRecentSearchShadowRevision(secondSync);

assert.equal(secondSync, 1_001, "rapid updates get a strictly increasing logical revision");
assert.equal(deleteRevision, 1_002, "delete tombstone outranks every earlier sync revision");
assert.ok(firstSync < deleteRevision && secondSync < deleteRevision);
assert.equal(nextRecentSearchShadowRevision(secondSync, 900), 1_002, "a backwards wall clock cannot move the record revision backwards");
assert.equal(nextRecentSearchShadowRevision(8, 50), 50, "a later server clock remains the natural revision");
assert.equal(deleteRecentSearchShadowRevision(1_002), 1_003, "a subsequent explicit tombstone revision remains monotonic");
assert.throws(() => nextRecentSearchShadowRevision(Number.NaN, 10), /finite non-negative/);
assert.throws(() => deleteRecentSearchShadowRevision(-1), /finite non-negative/);

console.log("Recent-search shadow revision ordering tests passed.");
