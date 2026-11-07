import assert from 'node:assert/strict';
import { canViewProfilePost } from '../../convex/lib/profilePostVisibility';

const authorId = 'synthetic-profile-author';
const viewerId = 'synthetic-profile-viewer';

assert.equal(canViewProfilePost({ authorId, audience: 'everyone' }, viewerId), true);
assert.equal(canViewProfilePost({ authorId }, viewerId), true, 'legacy posts with no audience remain public');
assert.equal(canViewProfilePost({ authorId, audience: 'closeFriends' }, authorId), true, 'owners retain access');
assert.equal(canViewProfilePost({ authorId, audience: 'closeFriends' }, viewerId), false);
assert.equal(canViewProfilePost({ authorId, audience: 'group' }, viewerId), false);
assert.equal(canViewProfilePost({ authorId, audience: 'nearby' }, null), false);

console.log('profile post visibility tests passed (owner access and public-only access for other viewers).');
