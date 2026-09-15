import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Heart, CornerDownRight, Pin, CheckCircle, Search, Smile, Image as ImageIcon } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from './Avatar';
import { PostComment, CommentReply } from '../../types';

const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '🎉', '😍', '🎊', '🍾'];

export const CommentsModal: React.FC = () => {
  const {
    activeCommentsPostId,
    setActiveCommentsPostId,
    posts,
    addComment,
    toggleLikeComment,
    currentUser,
    setActiveUserProfile,
  } = useLalao();

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const post = posts.find((p) => p.id === activeCommentsPostId);

  useEffect(() => {
    if (activeCommentsPostId) {
      commentsListRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeCommentsPostId]);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  if (!activeCommentsPostId || !post) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    if (replyingTo) {
      addComment(post.id, commentText.trim(), replyingTo.commentId, replyingTo.username);
      setReplyingTo(null);
    } else {
      addComment(post.id, commentText.trim());
    }

    setCommentText('');
    setTimeout(() => {
      commentsListRef.current?.scrollTo({
        top: commentsListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  };

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleStartReply = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    if (!commentText.startsWith(`@${username} `)) {
      setCommentText(`@${username} `);
    }
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    if (commentText.startsWith('@')) {
      setCommentText('');
    }
  };

  // Filter comments if search active
  const filteredComments = post.comments?.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesComment =
      c.text.toLowerCase().includes(q) ||
      c.author.name.toLowerCase().includes(q) ||
      c.author.username.toLowerCase().includes(q);
    const matchesReply = c.replies?.some(
      (r) =>
        r.text.toLowerCase().includes(q) ||
        r.author.name.toLowerCase().includes(q) ||
        r.author.username.toLowerCase().includes(q)
    );
    return matchesComment || matchesReply;
  }) || [];

  return (
    <div
      id="comments-screen"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250"
    >
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="close-comments-btn"
              onClick={() => setActiveCommentsPostId(null)}
              className="p-1.5 -ml-1.5 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Back"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Comments</h3>
              <p className="text-[11px] text-neutral-400 font-medium">
                {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showSearch ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
              }`}
              title="Search comments"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {showSearch && (
          <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments or usernames..."
              className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Original Post Preview Ribbon */}
        <div className="px-4 py-2.5 bg-neutral-50/80 border-b border-neutral-100 flex items-start gap-2.5 shrink-0">
          <Avatar src={post.author.avatar} alt={post.author.name} size="xs" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs text-neutral-900">{post.author.username}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-neutral-200/80 text-neutral-600 rounded font-medium">
                Author
              </span>
              <span className="text-[10px] text-neutral-400">· {post.createdAt}</span>
            </div>
            <p className="text-xs text-neutral-600 line-clamp-1 mt-0.5 leading-normal">
              {post.text}
            </p>
          </div>
        </div>

        {/* Comments Feed List */}
        <div
          ref={commentsListRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0 bg-white"
        >
          {filteredComments.length > 0 ? (
            filteredComments.map((comment: PostComment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main Parent Comment */}
                <div className="flex items-start gap-3 group">
                  <Avatar
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    size="sm"
                    className="shrink-0 mt-0.5 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setActiveUserProfile(comment.author)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => setActiveUserProfile(comment.author)}
                        className="font-bold text-xs text-neutral-900 hover:underline cursor-pointer"
                      >
                        {comment.author.username}
                      </span>
                      {/* Verified Badge if celebrity or verified */}
                      {(comment.author.username === 'officialbovi' ||
                        comment.author.username === 'realwarripikin' ||
                        comment.author.followersCount > 10000) && (
                        <CheckCircle className="w-3.5 h-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />
                      )}
                      {comment.author.id === post.author.id && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded font-medium">
                          Author
                        </span>
                      )}
                      {comment.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#5E43F3] font-medium bg-[#5E43F3]/10 px-1.5 py-0.2 rounded">
                          <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {comment.createdAt}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-800 mt-1 leading-relaxed whitespace-pre-line">
                      {comment.text}
                    </p>

                    {/* Comment Actions */}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleStartReply(comment.id, comment.author.username)}
                        className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Heart Like Button & Count (Instagram layout) */}
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <button
                      onClick={() => toggleLikeComment(post.id, comment.id)}
                      className="p-1 rounded-full text-neutral-400 hover:text-rose-500 transition-colors active:scale-90"
                      title="Like comment"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          comment.isLiked
                            ? 'text-rose-500 fill-rose-500'
                            : 'text-neutral-400 group-hover:text-neutral-600'
                        }`}
                      />
                    </button>
                    {comment.likesCount > 0 && (
                      <span
                        className={`text-[10px] font-medium ${
                          comment.isLiked ? 'text-rose-500 font-semibold' : 'text-neutral-400'
                        }`}
                      >
                        {comment.likesCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nested Threaded Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-9 space-y-2.5 border-l-2 border-neutral-100 ml-4">
                    {comment.replies.map((reply: CommentReply) => (
                      <div key={reply.id} className="flex items-start gap-2.5 group/reply pt-1">
                        <Avatar
                          src={reply.author.avatar}
                          alt={reply.author.name}
                          size="xs"
                          className="shrink-0 mt-0.5 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setActiveUserProfile(reply.author)}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => setActiveUserProfile(reply.author)}
                              className="font-bold text-xs text-neutral-900 hover:underline cursor-pointer"
                            >
                              {reply.author.username}
                            </span>
                            {(reply.author.username === 'officialbovi' ||
                              reply.author.username === 'realwarripikin' ||
                              reply.author.followersCount > 10000) && (
                              <CheckCircle className="w-3.5 h-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />
                            )}
                            {(reply.isAuthor || reply.author.id === post.author.id) && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded font-medium">
                                Author
                              </span>
                            )}
                            <span className="text-[11px] text-neutral-400 font-normal">
                              {reply.createdAt}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-800 mt-0.5 leading-relaxed whitespace-pre-line">
                            {reply.text}
                          </p>

                          <div className="flex items-center gap-4 mt-1.5">
                            <button
                              onClick={() => handleStartReply(comment.id, reply.author.username)}
                              className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
                            >
                              Reply
                            </button>
                          </div>
                        </div>

                        {/* Reply Like Heart */}
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <button
                            onClick={() => toggleLikeComment(post.id, comment.id, reply.id)}
                            className="p-1 rounded-full text-neutral-400 hover:text-rose-500 transition-colors active:scale-90"
                            title="Like reply"
                          >
                            <Heart
                              className={`w-3 h-3 transition-colors ${
                                reply.isLiked
                                  ? 'text-rose-500 fill-rose-500'
                                  : 'text-neutral-400 group-hover/reply:text-neutral-600'
                              }`}
                            />
                          </button>
                          {reply.likesCount > 0 && (
                            <span
                              className={`text-[9px] font-medium ${
                                reply.isLiked ? 'text-rose-500 font-semibold' : 'text-neutral-400'
                              }`}
                            >
                              {reply.likesCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400">
                <Smile className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-700">No comments yet</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Start the conversation with @{post.author.username} and neighborhood friends.
              </p>
            </div>
          )}
        </div>

        {/* Replying Banner */}
        {replyingTo && (
          <div className="px-4 py-1.5 bg-[#5E43F3]/5 border-t border-[#5E43F3]/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-[#5E43F3]">
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>
                Replying to <strong className="font-semibold">@{replyingTo.username}</strong>
              </span>
            </div>
            <button
              onClick={cancelReply}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Emoji Bar (Matching Instagram design exactly) */}
        <div className="px-3 py-1.5 bg-white border-t border-neutral-100 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              type="button"
              className="w-8 h-8 flex items-center justify-center text-base hover:scale-125 active:scale-95 rounded-full hover:bg-neutral-100 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-neutral-100 bg-white flex items-center gap-2.5 shrink-0"
        >
          <Avatar src={currentUser.avatar} alt={currentUser.name} size="xs" />
          <div className="flex-1 flex items-center bg-neutral-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5E43F3]/20 focus-within:border-[#5E43F3] border border-transparent rounded-full px-3.5 py-1.5 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Add a comment for ${post.author.username}...`}
              className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 outline-none"
            />
            {commentText.trim() ? (
              <button
                type="submit"
                id="submit-comment-btn"
                className="ml-2 text-xs font-bold text-[#5E43F3] hover:text-[#4E34E0] active:scale-95 transition-all px-1.5 py-0.5"
              >
                Post
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!commentText.trim()}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
              commentText.trim()
                ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-sm active:scale-95'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
