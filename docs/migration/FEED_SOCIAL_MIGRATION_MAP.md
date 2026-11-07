# Feed & Social Content Migration Map

## Source of truth
- Audit: `docs/migration/CONVEX_SUPABASE_MIGRATION_AUDIT.md` (437 Convex functions, 48/437 = 11.0% implemented)
- Convex implementations: `convex/social.ts`
- Supabase Edge Function: `supabase/functions/app-social/index.ts`
- Supabase schema: `supabase/migrations/20261029000000_initial_convex_schema.sql` (posts, comments, likes, follows, notifications, topics, userTopicPreferences, pages, pageFollowers)
- Existing social RPCs: `20261109000000_social_follow_lifecycle.sql`, `20261110000000_social_follow_lock_order.sql`, `20261112000000_social_like_notifications_outbox.sql`
- Frontend adapters: `src/hooks/useSocialBackendQuery.ts`, `src/hooks/useSocialBackendMutation.ts`
- Frontend wiring: `src/context/LalaoContext.tsx`
- Feature flag: `VITE_SOCIAL_INTERACTIONS_BACKEND` (via `isSupabaseSocialInteractionsBackendEnabled()`)

## Functions already in Supabase (no new work needed)
| Convex function | Status | Supabase location |
|---|---|---|
| social.listFeedPosts | PARTIALLY_MIGRATED | app-social `listFeedPosts` operation |
| social.toggleLikePost | LEGACY_DEPENDENCY→should be IMPLEMENTED | app-social `toggleLikePost` → `toggle_lalao_post_like` RPC |
| social.toggleLikeComment | LEGACY_DEPENDENCY→should be IMPLEMENTED | app-social `toggleLikeComment` → `toggle_lalao_comment_like` RPC |
| social.toggleFollowUser | PARTIALLY_MIGRATED | app-social `toggleFollowUser` → `toggle_lalao_user_follow` RPC |
| social.getMyFollowers | IMPLEMENTED_NOT_FULLY_TESTED | app-social `getMyFollowers` |
| social.getMyFollowing | IMPLEMENTED_NOT_FULLY_TESTED | app-social `getMyFollowing` |
| social.getRelationship | IMPLEMENTED_NOT_FULLY_TESTED | app-social `getRelationship` |

## Functions to migrate in this batch (Convex → Supabase)

| # | Convex function | Type | Current status | Target status | Lines |
|---|---|---|---|---|---|
| 1 | social.createPost | mutation | LEGACY_DEPENDENCY | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:1545 |
| 2 | social.deletePost | mutation | LEGACY_DEPENDENCY | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:2003 |
| 3 | social.addCommentToPost | mutation | LEGACY_DEPENDENCY | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:2254 |
| 4 | social.deleteComment | mutation | NOT_MIGRATED | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:2208 |
| 5 | social.getCommentsForPost | query | LEGACY_DEPENDENCY | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:2426 |
| 6 | social.toggleRepost | mutation | LEGACY_DEPENDENCY | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:1985 |
| 7 | social.listUserPosts | query | NOT_MIGRATED | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:989 |
| 8 | social.listVideoPosts | query | LEGACY_DEPENDENCY | IMPLEMENTED_NOT_FULLY_TESTED | social.ts:619 |

## Database changes (new forward-only migration)
- `create_lalao_post(...)` SECURITY DEFINER RPC — create post, return post row
- `delete_lalao_post(p_user_id, p_post_id)` SECURITY DEFINER RPC — ownership check, cascade delete comments/likes/notifications
- `create_lalao_comment(...)` SECURITY DEFINER RPC — create comment, increment commentsCount, enqueue notification
- `delete_lalao_comment(p_user_id, p_comment_id)` SECURITY DEFINER RPC — ownership check, soft/hard delete, decrement commentsCount
- `toggle_lalao_post_repost(p_user_id, p_post_id)` SECURITY DEFINER RPC — atomic repost toggle with count
- Indexes: `idx_posts_by_author_created`, `idx_comments_by_post_created`

## Edge Function changes (`supabase/functions/app-social/index.ts`)
- Add operations: `createPost`, `deletePost`, `addCommentToPost`, `deleteComment`, `getCommentsForPost`, `toggleRepost`, `listUserPosts`, `listVideoPosts`
- Identity resolved via `withLalaoAuth` (never client-supplied user IDs)
- All writes go through the new RPCs (service_role)

## Frontend changes (`src/context/LalaoContext.tsx`)
- `createPostMutation`, `deletePostMutation`, `addCommentToPostMutation`, `toggleRepostPostMutation` → `useSocialBackendMutation(..., 'app-social', isSupabaseSocialInteractionsBackendEnabled())`
- Add `getCommentsForPost`, `listUserPosts`, `listVideoPosts` queries via `useSocialBackendQuery`
- Preserve Convex fallback when flag disabled

## Tests to add
- `src/test/app_social_post_comments.test.ts` — post/comment CRUD, like/unlike, repost, unauthorized deletion, duplicate prevention

## Safety
- Local development only. No hosted Supabase, no production flag changes, no data backfills, no destructive resets.
- Convex remains the active backend; all new operations are behind `VITE_SOCIAL_INTERACTIONS_BACKEND=supabase` (default unset/Convex).
