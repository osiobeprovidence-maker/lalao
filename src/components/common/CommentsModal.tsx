import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Heart, CornerDownRight, Pin, CheckCircle, Search, Smile, Image as ImageIcon, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isMutedPreview, setIsMutedPreview] = useState(true);

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

  const mediaContent = post.mediaUrl ? (
    <div className="relative flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden bg-neutral-100 md:min-h-0">
      {post.mediaType === 'video' ? (
        <div className="relative h-full w-full bg-black">
          <video
            src={post.mediaUrl}
            controls={false}
            autoPlay={isPlayingPreview}
            muted={isMutedPreview}
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <button
            type="button"
            onClick={() => setIsPlayingPreview((prev) => !prev)}
            className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80"
            aria-label={isPlayingPreview ? 'Pause preview' : 'Play preview'}
          >
            {isPlayingPreview ? <Pause className="h-6 w-6 fill-white" /> : <Play className="ml-0.5 h-6 w-6 fill-white" />}
          </button>
          <button
            type="button"
            onClick={() => setIsMutedPreview((prev) => !prev)}
            className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-sm transition hover:bg-black/80"
            aria-label={isMutedPreview ? 'Unmute video' : 'Mute video'}
          >
            {isMutedPreview ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <img
          src={post.mediaUrl}
          alt="Post attachment"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain bg-neutral-100"
          loading="lazy"
        />
      )}
    </div>
  ) : null;

  const isMediaPost = Boolean(post.mediaUrl);

  if (!isMediaPost) {
    return (
      <div id="comments-screen" className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] p-0 md:p-6">
        <div className="flex h-full w-full flex-col overflow-hidden border border-neutral-200/80 bg-white shadow-2xl md:h-[85vh] md:max-w-[760px] md:rounded-[28px] md:mx-auto md:my-auto">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                id="close-comments-btn"
                onClick={() => setActiveCommentsPostId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
                title="Back"
              >
                <X className="h-4 w-4 stroke-[2.2]" />
              </button>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Conversation</h3>
                <p className="text-[11px] font-medium text-neutral-400">
                  {post.commentsCount} {post.commentsCount === 1 ? 'reply' : 'replies'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                showSearch ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
              }`}
              title="Search comments"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {showSearch && (
            <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search replies or usernames..."
                className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] font-semibold text-neutral-400 hover:text-neutral-600"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-white">
            <div className="border-b border-neutral-100 bg-neutral-50/70 px-4 py-4">
              <div className="flex items-start gap-3">
                <Avatar src={post.author.avatar} alt={post.author.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900">{post.author.username}</span>
                    <span className="rounded bg-neutral-200/80 px-1.5 py-0.2 text-[10px] font-medium text-neutral-600">Author</span>
                    <span className="text-[10px] text-neutral-400">· {post.createdAt}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-800">{post.text}</p>
                </div>
              </div>
            </div>

            <div ref={commentsListRef} className="space-y-4 px-4 py-4">
              {filteredComments.length > 0 ? (
                filteredComments.map((comment: PostComment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar src={comment.author.avatar} alt={comment.author.name} size="sm" />
                      <div className="min-w-0 flex-1 rounded-2xl bg-neutral-50 px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-neutral-900">{comment.author.username}</span>
                          {comment.author.id === post.author.id && (
                            <span className="rounded bg-neutral-200 px-1.5 py-0.2 text-[10px] font-medium text-neutral-600">Author</span>
                          )}
                          <span className="text-[10px] text-neutral-400">{comment.createdAt}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-neutral-800">{comment.text}</p>

                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() => handleStartReply(comment.id, comment.author.username)}
                            className="text-[11px] font-semibold text-neutral-500 transition hover:text-neutral-700"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => toggleLikeComment(post.id, comment.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 transition hover:text-rose-500"
                          >
                            <Heart className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            {comment.likesCount > 0 ? comment.likesCount : 'Like'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 space-y-2.5 border-l-2 border-neutral-100 pl-3">
                        {comment.replies.map((reply: CommentReply) => (
                          <div key={reply.id} className="flex items-start gap-2.5">
                            <Avatar src={reply.author.avatar} alt={reply.author.name} size="xs" />
                            <div className="min-w-0 flex-1 rounded-xl bg-white px-2.5 py-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-bold text-neutral-900">{reply.author.username}</span>
                                {reply.isAuthor && (
                                  <span className="rounded bg-neutral-200 px-1.5 py-0.2 text-[9px] font-medium text-neutral-600">Author</span>
                                )}
                                <span className="text-[10px] text-neutral-400">{reply.createdAt}</span>
                              </div>
                              <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-neutral-800">{reply.text}</p>
                              <div className="mt-2 flex items-center gap-3">
                                <button
                                  onClick={() => handleStartReply(comment.id, reply.author.username)}
                                  className="text-[10px] font-semibold text-neutral-500 transition hover:text-neutral-700"
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={() => toggleLikeComment(post.id, comment.id, reply.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 transition hover:text-rose-500"
                                >
                                  <Heart className={`h-3 w-3 ${reply.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                  {reply.likesCount > 0 ? reply.likesCount : 'Like'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="space-y-2 py-16 text-center text-neutral-400">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                    <Smile className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700">No replies yet</p>
                  <p className="mx-auto max-w-xs text-xs text-neutral-400">Be the first to join the conversation.</p>
                </div>
              )}
            </div>
          </div>

          {replyingTo && (
            <div className="flex items-center justify-between border-t border-[#5E43F3]/10 bg-[#5E43F3]/5 px-4 py-1.5 shrink-0">
              <div className="flex items-center gap-2 text-xs text-[#5E43F3]">
                <CornerDownRight className="h-3.5 w-3.5" />
                <span>
                  Replying to <strong className="font-semibold">@{replyingTo.username}</strong>
                </span>
              </div>
              <button onClick={cancelReply} className="rounded-full p-1 text-neutral-400 transition hover:text-neutral-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex shrink-0 items-center justify-between gap-1 overflow-x-auto border-t border-neutral-100 bg-white px-3 py-1.5 no-scrollbar">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-base transition hover:scale-125 hover:bg-neutral-100 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2.5 border-t border-neutral-100 bg-white p-3">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="xs" />
            <div className="flex flex-1 items-center rounded-full border border-transparent bg-neutral-100 px-3.5 py-1.5 transition focus-within:border-[#5E43F3] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5E43F3]/20">
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Reply to ${post.author.username}...`}
                className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 outline-none"
              />
              {commentText.trim() ? (
                <button
                  type="submit"
                  id="submit-comment-btn"
                  className="ml-2 px-1.5 py-0.5 text-xs font-bold text-[#5E43F3] transition hover:text-[#4E34E0]"
                >
                  Post
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={!commentText.trim()}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                commentText.trim()
                  ? 'bg-[#5E43F3] text-white shadow-sm hover:bg-[#4E34E0] active:scale-95'
                  : 'cursor-not-allowed bg-neutral-100 text-neutral-400'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      id="comments-screen"
      className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] p-0 md:p-6"
    >
      <div className="flex h-full w-full flex-col overflow-hidden border border-neutral-200/80 bg-white shadow-2xl md:h-[85vh] md:max-w-[1200px] md:rounded-[28px] md:mx-auto md:my-auto">
        <div className="flex h-full flex-col md:flex-row">
          {mediaContent && (
            <div className="relative flex min-h-[220px] w-full items-center justify-center overflow-hidden bg-neutral-100 md:w-[54%] md:min-h-0">
              {mediaContent}
            </div>
          )}

          <div className={`flex min-h-0 flex-1 flex-col bg-white ${mediaContent ? 'md:max-w-[460px]' : 'w-full'}`}>
            <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  id="close-comments-btn"
                  onClick={() => setActiveCommentsPostId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
                  title="Back"
                >
                  <X className="h-4 w-4 stroke-[2.2]" />
                </button>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Comments</h3>
                  <p className="text-[11px] font-medium text-neutral-400">
                    {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  showSearch ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                }`}
                title="Search comments"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {showSearch && (
              <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
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
                    className="text-[10px] font-semibold text-neutral-400 hover:text-neutral-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="flex items-start gap-2.5 border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5 shrink-0">
              <Avatar src={post.author.avatar} alt={post.author.name} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-900">{post.author.username}</span>
                  <span className="rounded bg-neutral-200/80 px-1.5 py-0.2 text-[10px] font-medium text-neutral-600">Author</span>
                  <span className="text-[10px] text-neutral-400">· {post.createdAt}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600 leading-normal">{post.text}</p>
              </div>
            </div>

            <div ref={commentsListRef} className="flex-1 overflow-y-auto bg-white px-4 py-3 space-y-4 min-h-0">
              {filteredComments.length > 0 ? (
                filteredComments.map((comment: PostComment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <Avatar
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        size="sm"
                        className="mt-0.5 shrink-0 cursor-pointer transition hover:opacity-90"
                        onClick={() => setActiveUserProfile(comment.author)}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            onClick={() => setActiveUserProfile(comment.author)}
                            className="cursor-pointer text-xs font-bold text-neutral-900 hover:underline"
                          >
                            {comment.author.username}
                          </span>
                          {(comment.author.username === 'officialbovi' ||
                            comment.author.username === 'realwarripikin' ||
                            comment.author.followersCount > 10000) && (
                            <CheckCircle className="h-3.5 w-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />
                          )}
                          {comment.author.id === post.author.id && (
                            <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] font-medium text-neutral-600">Author</span>
                          )}
                          {comment.isPinned && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-[#5E43F3]/10 px-1.5 py-0.2 text-[10px] font-medium text-[#5E43F3]">
                              <Pin className="h-2.5 w-2.5 fill-current" /> Pinned
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400">{comment.createdAt}</span>
                        </div>

                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-neutral-800">{comment.text}</p>

                        <div className="mt-2 flex items-center gap-4">
                          <button
                            onClick={() => handleStartReply(comment.id, comment.author.username)}
                            className="text-[11px] font-semibold text-neutral-400 transition hover:text-neutral-700"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-center pt-1">
                        <button
                          onClick={() => toggleLikeComment(post.id, comment.id)}
                          className="rounded-full p-1 text-neutral-400 transition hover:text-rose-500 active:scale-90"
                          title="Like comment"
                        >
                          <Heart
                            className={`h-3.5 w-3.5 transition ${
                              comment.isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400 group-hover:text-neutral-600'
                            }`}
                          />
                        </button>
                        {comment.likesCount > 0 && (
                          <span className={`text-[10px] ${comment.isLiked ? 'font-semibold text-rose-500' : 'text-neutral-400'}`}>
                            {comment.likesCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-4 space-y-2.5 border-l-2 border-neutral-100 pl-4">
                        {comment.replies.map((reply: CommentReply) => (
                          <div key={reply.id} className="flex items-start gap-2.5 group/reply pt-1">
                            <Avatar
                              src={reply.author.avatar}
                              alt={reply.author.name}
                              size="xs"
                              className="mt-0.5 shrink-0 cursor-pointer transition hover:opacity-90"
                              onClick={() => setActiveUserProfile(reply.author)}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  onClick={() => setActiveUserProfile(reply.author)}
                                  className="cursor-pointer text-xs font-bold text-neutral-900 hover:underline"
                                >
                                  {reply.author.username}
                                </span>
                                {(reply.author.username === 'officialbovi' ||
                                  reply.author.username === 'realwarripikin' ||
                                  reply.author.followersCount > 10000) && (
                                  <CheckCircle className="h-3.5 w-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />
                                )}
                                {(reply.isAuthor || reply.author.id === post.author.id) && (
                                  <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] font-medium text-neutral-600">Author</span>
                                )}
                                <span className="text-[11px] text-neutral-400">{reply.createdAt}</span>
                              </div>

                              <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-neutral-800">{reply.text}</p>

                              <div className="mt-1.5 flex items-center gap-4">
                                <button
                                  onClick={() => handleStartReply(comment.id, reply.author.username)}
                                  className="text-[11px] font-semibold text-neutral-400 transition hover:text-neutral-700"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-center pt-0.5">
                              <button
                                onClick={() => toggleLikeComment(post.id, comment.id, reply.id)}
                                className="rounded-full p-1 text-neutral-400 transition hover:text-rose-500 active:scale-90"
                                title="Like reply"
                              >
                                <Heart
                                  className={`h-3 w-3 transition ${
                                    reply.isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400 group-hover/reply:text-neutral-600'
                                  }`}
                                />
                              </button>
                              {reply.likesCount > 0 && (
                                <span className={`text-[9px] ${reply.isLiked ? 'font-semibold text-rose-500' : 'text-neutral-400'}`}>
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
                <div className="space-y-2 py-16 text-center text-neutral-400">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                    <Smile className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700">No comments yet</p>
                  <p className="mx-auto max-w-xs text-xs text-neutral-400">Start the conversation.</p>
                </div>
              )}
            </div>

            {replyingTo && (
              <div className="flex items-center justify-between border-t border-[#5E43F3]/10 bg-[#5E43F3]/5 px-4 py-1.5 shrink-0">
                <div className="flex items-center gap-2 text-xs text-[#5E43F3]">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  <span>
                    Replying to <strong className="font-semibold">@{replyingTo.username}</strong>
                  </span>
                </div>
                <button onClick={cancelReply} className="rounded-full p-1 text-neutral-400 transition hover:text-neutral-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex shrink-0 items-center justify-between gap-1 overflow-x-auto border-t border-neutral-100 bg-white px-3 py-1.5 no-scrollbar">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base transition hover:scale-125 hover:bg-neutral-100 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2.5 border-t border-neutral-100 bg-white p-3">
              <Avatar src={currentUser.avatar} alt={currentUser.name} size="xs" />
              <div className="flex flex-1 items-center rounded-full border border-transparent bg-neutral-100 px-3.5 py-1.5 transition focus-within:border-[#5E43F3] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5E43F3]/20">
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
                    className="ml-2 px-1.5 py-0.5 text-xs font-bold text-[#5E43F3] transition hover:text-[#4E34E0]"
                  >
                    Post
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!commentText.trim()}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                  commentText.trim()
                    ? 'bg-[#5E43F3] text-white shadow-sm hover:bg-[#4E34E0] active:scale-95'
                    : 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
