/**
 * Lalao — Feed & Social: Post / comment / repost operations (Supabase-backed)
 *
 * Tests the pure business-logic surface for the operations migrated from
 * Convex to Supabase in this batch:
 *   - Post creation (valid input, missing fields, ownership)
 *   - Post deletion (ownership enforced, unauthorized rejected)
 *   - Comment creation (valid, empty rejected, post-not-found)
 *   - Comment deletion (ownership enforced, soft-delete with children)
 *   - Repost toggle (add, remove, duplicate prevention)
 *   - Like/unlike (duplicate prevention)
 *
 * These tests exercise the pure validation and state-transition logic that
 * the Supabase RPCs implement. They run in Node/tsx without a live database,
 * mirroring the RPC rules so the implementation can be reviewed and extended
 * with real pgTAP tests against a local Supabase instance.
 */

import assert from 'node:assert/strict';

type User = { id: string; suspended?: boolean };
type Post = {
  id: string; authorId: string; text: string; location: string;
  createdAt: number; likesCount: number; commentsCount: number;
  repostsCount: number; moderationStatus: string;
};
type Comment = {
  id: string; postId: string; authorId: string; parentCommentId: string | null;
  text: string; createdAt: number; likesCount: number; isDeleted: boolean;
};
type Like = { id: string; userId: string; targetType: string; targetId: string; createdAt: number };

type OkResult<T> = { ok: true; data: T };
type ErrResult = { ok: false; error: string; status?: number };

class SocialStore {
  users = new Map<string, User>();
  posts = new Map<string, Post>();
  comments = new Map<string, Comment>();
  likes = new Map<string, Like>();
  notifications: Array<{ id: string; recipientId: string; actorId: string; type: string; postId: string }> = [];

  addUser(id: string, suspended = false) { this.users.set(id, { id, suspended }); }

  createPost(args: {
    authorId: string; text: string; location: string;
  }): OkResult<Post> | ErrResult {
    const { authorId, text, location } = args;
    if (!authorId || !text || !location) return { ok: false, error: 'Post text and location are required.' };
    if (!this.users.has(authorId)) return { ok: false, error: 'User not found' };
    const id = 'post_' + Math.random().toString(36).slice(2);
    const now = Date.now();
    const post: Post = { id, authorId, text, location, createdAt: now, likesCount: 0, commentsCount: 0, repostsCount: 0, moderationStatus: 'safe' };
    this.posts.set(id, post);
    return { ok: true, data: post };
  }

  deletePost(args: { userId: string; postId: string }): OkResult<{}> | ErrResult {
    const { userId, postId } = args;
    if (!userId || !postId) return { ok: false, error: 'Invalid delete request' };
    const post = this.posts.get(postId);
    if (!post) return { ok: false, error: 'Post not found', status: 404 };
    if (post.authorId !== userId) return { ok: false, error: 'Not authorized to delete this post', status: 403 };

    for (const [cid, comment] of this.comments) {
      if (comment.postId === postId) {
        for (const [lid, like] of this.likes) {
          if ((like.targetType === 'comment' || like.targetType === 'reply') && like.targetId === cid) this.likes.delete(lid);
        }
        this.comments.delete(cid);
      }
    }
    for (const [lid, like] of this.likes) {
      if (like.targetType === 'post' && like.targetId === postId) this.likes.delete(lid);
    }
    this.notifications = this.notifications.filter((n) => n.postId !== postId);
    this.posts.delete(postId);
    return { ok: true, data: {} };
  }

  addComment(args: {
    authorId: string; postId: string; text: string; parentCommentId?: string | null;
    mediaStorageId?: string | null;
  }): OkResult<Comment> | ErrResult {
    const { authorId, postId, text, parentCommentId, mediaStorageId } = args;
    if (!authorId || !postId) return { ok: false, error: 'Comment author is required' };
    if (!text.trim() && !mediaStorageId) return { ok: false, error: 'Comment cannot be empty' };
    const post = this.posts.get(postId);
    if (!post) return { ok: false, error: 'Post not found' };

    const id = 'comment_' + Math.random().toString(36).slice(2);
    const now = Date.now();
    const comment: Comment = {
      id, postId, authorId, parentCommentId: parentCommentId ?? null,
      text: text.trim(), createdAt: now, likesCount: 0, isDeleted: false,
    };
    this.comments.set(id, comment);
    post.commentsCount += 1;

    if (post.authorId !== authorId) {
      this.notifications.push({ id: 'notification_' + Math.random().toString(36).slice(2), recipientId: post.authorId, actorId: authorId, type: 'comment', postId });
    }
    if (parentCommentId) {
      const parent = this.comments.get(parentCommentId);
      if (parent && parent.authorId !== authorId && parent.authorId !== post.authorId) {
        this.notifications.push({ id: 'notification_' + Math.random().toString(36).slice(2), recipientId: parent.authorId, actorId: authorId, type: 'reply', postId });
      }
    }
    return { ok: true, data: comment };
  }

  deleteComment(args: { userId: string; commentId: string }): OkResult<{ softDeleted: boolean }> | ErrResult {
    const { userId, commentId } = args;
    if (!userId || !commentId) return { ok: false, error: 'Invalid delete request' };
    const comment = this.comments.get(commentId);
    if (!comment) return { ok: false, error: 'Comment not found', status: 404 };
    if (comment.authorId !== userId) return { ok: false, error: 'Unauthorized', status: 403 };

    for (const [lid, like] of this.likes) {
      if (like.targetType === 'comment' && like.targetId === commentId) this.likes.delete(lid);
    }

    const children = [...this.comments.values()].filter((c) => c.parentCommentId === commentId);
    if (children.length > 0) {
      comment.text = '[Deleted]'; comment.isDeleted = true;
      return { ok: true, data: { softDeleted: true } };
    }
    this.comments.delete(commentId);
    const post = this.posts.get(comment.postId);
    if (post) post.commentsCount = Math.max(0, post.commentsCount - 1);
    return { ok: true, data: { softDeleted: false } };
  }

  toggleRepost(args: { userId: string; postId: string }): OkResult<{ reposted: boolean; repostsCount: number }> | ErrResult {
    const { userId, postId } = args;
    if (!userId || !postId) return { ok: false, error: 'Invalid repost request' };
    const post = this.posts.get(postId);
    if (!post) return { ok: false, error: 'Post not found' };

    const existing = [...this.likes.values()].find((l) => l.userId === userId && l.targetType === 'repost' && l.targetId === postId);
    if (existing) {
      this.likes.delete(existing.id);
      post.repostsCount = Math.max(0, post.repostsCount - 1);
      return { ok: true, data: { reposted: false, repostsCount: post.repostsCount } };
    }
    this.likes.set('repost_' + Math.random().toString(36).slice(2), { id: 'repost_' + Math.random().toString(36).slice(2), userId, targetType: 'repost', targetId: postId, createdAt: Date.now() });
    post.repostsCount += 1;
    return { ok: true, data: { reposted: true, repostsCount: post.repostsCount } };
  }

  toggleLikePost(args: { userId: string; postId: string }): OkResult<{ liked: boolean; likesCount: number }> | ErrResult {
    const { userId, postId } = args;
    if (!userId || !postId) return { ok: false, error: 'Invalid like request' };
    const post = this.posts.get(postId);
    if (!post) return { ok: false, error: 'Post not found' };

    const existing = [...this.likes.values()].find((l) => l.userId === userId && l.targetType === 'post' && l.targetId === postId);
    if (existing) {
      this.likes.delete(existing.id);
      post.likesCount = Math.max(0, post.likesCount - 1);
      return { ok: true, data: { liked: false, likesCount: post.likesCount } };
    }
    this.likes.set('like_' + Math.random().toString(36).slice(2), { id: 'like_' + Math.random().toString(36).slice(2), userId, targetType: 'post', targetId: postId, createdAt: Date.now() });
    post.likesCount += 1;
    return { ok: true, data: { liked: true, likesCount: post.likesCount } };
  }

  getCommentsForPost(postId: string): Comment[] {
    return [...this.comments.values()].filter((c) => c.postId === postId && !c.isDeleted).sort((a, b) => a.createdAt - b.createdAt);
  }
}

/* ---------------------------------------------------------------
   Tests
   --------------------------------------------------------------- */

function runTests() {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  const t = (name: string, fn: () => void) => {
    try { fn(); results.push({ name, passed: true }); }
    catch (e: any) { results.push({ name, passed: false, message: e.message }); }
  };

  const store = new SocialStore();
  store.addUser('user_a');
  store.addUser('user_b');
  store.addUser('user_c');

  // ── Post creation ──
  t('create post with valid input', () => {
    const r = store.createPost({ authorId: 'user_a', text: 'Hello Lalao', location: 'Lagos, Nigeria' });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.data.authorId, 'user_a');
      assert.equal(r.data.text, 'Hello Lalao');
      assert.equal(r.data.location, 'Lagos, Nigeria');
      assert.equal(r.data.likesCount, 0);
    }
  });

  t('reject post with missing text', () => {
    const r = store.createPost({ authorId: 'user_a', text: '', location: 'Lagos, Nigeria' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, 'Post text and location are required.');
  });

  t('reject post for unknown author', () => {
    const r = store.createPost({ authorId: 'ghost', text: 'x', location: 'Lagos' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, 'User not found');
  });

  // ── Post deletion ──
  t('delete own post', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'To delete', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const r = store.deletePost({ userId: 'user_a', postId: create.data.id });
      assert.equal(r.ok, true);
      assert.equal(store.posts.size, 1);
    }
  });

  t('reject deletion of another user\'s post', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Others post', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const r = store.deletePost({ userId: 'user_b', postId: create.data.id });
      assert.equal(r.ok, false);
      assert.equal(r.status, 403);
      assert.equal(r.error, 'Not authorized to delete this post');
    }
  });

  t('reject deletion of missing post', () => {
    const r = store.deletePost({ userId: 'user_a', postId: 'post_missing' });
    assert.equal(r.ok, false);
    assert.equal(r.status, 404);
    assert.equal(r.error, 'Post not found');
  });

  // ── Comment creation ──
  t('add comment to post', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Parent post', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const r = store.addComment({ authorId: 'user_b', postId: create.data.id, text: 'Nice post!' });
      assert.equal(r.ok, true);
      if (r.ok) {
        assert.equal(r.data.text, 'Nice post!');
        assert.equal(r.data.authorId, 'user_b');
        assert.equal(r.data.parentCommentId, null);
      }
      const post = store.posts.get(create.data.id);
      assert.equal(post.commentsCount, 1);
      assert.equal(store.notifications.length, 1);
      assert.equal(store.notifications[0].type, 'comment');
    }
  });

  t('add reply to comment', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Parent post', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const c = store.addComment({ authorId: 'user_b', postId: create.data.id, text: 'First comment' });
      assert.equal(c.ok, true);
      if (c.ok) {
        const r = store.addComment({ authorId: 'user_c', postId: create.data.id, parentCommentId: c.data.id, text: 'Reply!' });
        assert.equal(r.ok, true);
        if (r.ok) {
          assert.equal(r.data.parentCommentId, c.data.id);
        }
      }
      const replies = store.notifications.filter((n) => n.type === 'reply');
      assert.equal(replies.length, 1);
    }
  });

  t('reject empty comment', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Parent', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const r = store.addComment({ authorId: 'user_b', postId: create.data.id, text: '   ' });
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error, 'Comment cannot be empty');
    }
  });

  t('reject comment on missing post', () => {
    const r = store.addComment({ authorId: 'user_b', postId: 'post_missing', text: 'x' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, 'Post not found');
  });

  // ── Comment deletion ──
  t('delete own comment without children (hard delete)', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Parent', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const c = store.addComment({ authorId: 'user_b', postId: create.data.id, text: 'Solo comment' });
      assert.equal(c.ok, true);
      if (c.ok) {
        const r = store.deleteComment({ userId: 'user_b', commentId: c.data.id });
        assert.equal(r.ok, true);
        if (r.ok) {
          assert.equal(r.data.softDeleted, false);
          assert.equal(store.comments.has(c.data.id), false, 'comment should be removed from store');
        }
      }
      const post = store.posts.get(create.data.id);
      assert.equal(post.commentsCount, 0);
    }
  });

  t('soft-delete comment with children', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Parent', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const c = store.addComment({ authorId: 'user_b', postId: create.data.id, text: 'Parent comment' });
      assert.equal(c.ok, true);
      if (c.ok) {
        store.addComment({ authorId: 'user_c', postId: create.data.id, parentCommentId: c.data.id, text: 'Child' });
        const r = store.deleteComment({ userId: 'user_b', commentId: c.data.id });
        assert.equal(r.ok, true);
        if (r.ok) {
          assert.equal(r.data.softDeleted, true);
          const comment = store.comments.get(c.data.id);
          assert.equal(comment.text, '[Deleted]');
          assert.equal(comment.isDeleted, true);
        }
      }
    }
  });

  t('reject deleting another user\'s comment', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Parent', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const c = store.addComment({ authorId: 'user_b', postId: create.data.id, text: 'x' });
      assert.equal(c.ok, true);
      if (c.ok) {
        const r = store.deleteComment({ userId: 'user_c', commentId: c.data.id });
        assert.equal(r.ok, false);
        assert.equal(r.status, 403);
        assert.equal(r.error, 'Unauthorized');
      }
    }
  });

  // ── Repost toggle ──
  t('add repost then remove it (toggle)', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Repostable', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const r1 = store.toggleRepost({ userId: 'user_b', postId: create.data.id });
      assert.equal(r1.ok, true);
      if (r1.ok) {
        assert.equal(r1.data.reposted, true);
        assert.equal(r1.data.repostsCount, 1);
        const r2 = store.toggleRepost({ userId: 'user_b', postId: create.data.id });
        assert.equal(r2.ok, true);
        if (r2.ok) {
          assert.equal(r2.data.reposted, false);
          assert.equal(r2.data.repostsCount, 0);
        }
      }
    }
  });

  t('reject repost on missing post', () => {
    const r = store.toggleRepost({ userId: 'user_a', postId: 'post_missing' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, 'Post not found');
  });

  // ── Like/unlike ──
  t('like then unlike (toggle)', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Likeable', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      const r1 = store.toggleLikePost({ userId: 'user_b', postId: create.data.id });
      assert.equal(r1.ok, true);
      if (r1.ok) {
        assert.equal(r1.data.liked, true);
        assert.equal(r1.data.likesCount, 1);
        const r2 = store.toggleLikePost({ userId: 'user_b', postId: create.data.id });
        assert.equal(r2.ok, true);
        if (r2.ok) {
          assert.equal(r2.data.liked, false);
          assert.equal(r2.data.likesCount, 0);
        }
      }
    }
  });

  t('duplicate like is prevented (unlike instead)', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Likeable', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      store.toggleLikePost({ userId: 'user_b', postId: create.data.id });
      const r = store.toggleLikePost({ userId: 'user_b', postId: create.data.id });
      assert.equal(r.ok, true);
      if (r.ok) {
        assert.equal(r.data.liked, false); // second click removes the like
      }
    }
  });

  // ── Get comments ──
  t('get comments for post ordered by createdAt', () => {
    const create = store.createPost({ authorId: 'user_a', text: 'Parent', location: 'Lagos' });
    assert.equal(create.ok, true);
    if (create.ok) {
      store.addComment({ authorId: 'user_b', postId: create.data.id, text: 'First' });
      store.addComment({ authorId: 'user_c', postId: create.data.id, text: 'Second' });
      const comments = store.getCommentsForPost(create.data.id);
      assert.equal(comments.length, 2);
      assert.equal(comments[0].text, 'First');
      assert.equal(comments[1].text, 'Second');
    }
  });

  // ── Summary ──
  let allPassed = true;
  for (const res of results) {
    console.log(`${res.passed ? '✓ PASS' : '✗ FAIL'}: ${res.name}${res.message ? ' — ' + res.message : ''}`);
    if (!res.passed) allPassed = false;
  }
  console.log(`\nResult: ${allPassed ? 'ALL ' + results.length + ' TESTS PASSED' : 'SOME TESTS FAILED'}`);
  if (!allPassed) process.exit(1);
}

runTests();
