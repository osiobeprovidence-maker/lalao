// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Heart, CornerDownRight, Pin, CheckCircle, Search, Smile, Image as ImageIcon, Play, Pause, Volume2, VolumeX, Mic, Square, MoreHorizontal, Trash2 } from 'lucide-react';
import { CommentComposer } from './CommentComposer';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from './Avatar';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { MuxVideoPlayer } from '../feed/MuxVideoPlayer';

const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '🎉', '😍', '🎊', '🍾'];

// A sub-component for rendering a recursive comment thread
export const CommentThread = ({
  comment,
  postId,
  postAuthorId,
  depth = 0,
  onReply,
  onLike,
  onDelete,
  setActiveUserProfile,
  currentUser,
}: {
  comment: any;
  postId: string;
  postAuthorId: string;
  depth?: number;
  onReply: (id: string, username: string) => void;
  onLike: (postId: string, commentId: string) => void;
  onDelete: (commentId: string) => void;
  setActiveUserProfile: (u: any) => void;
  currentUser: any;
}) => {
  const isAuthor = comment.author.id === currentUser.id;
  const isPostAuthor = comment.author.id === postAuthorId;
  const isVerified = comment.author.username === 'officialbovi' || comment.author.username === 'realwarripikin' || comment.author.followersCount > 10000;
  
  const [showMenu, setShowMenu] = useState(false);

  // Render media
  const renderMedia = () => {
    if (!comment.mediaUrl) return null;
    if (comment.mediaType === 'image' || comment.mediaType === 'gif') {
      return (
        <img src={comment.mediaUrl} alt="Comment media" className="mt-2 h-20 w-20 rounded-xl object-cover" loading="lazy" />
      );
    }
    if (comment.mediaType === 'voice') {
      return (
        <audio controls src={comment.mediaUrl} className="mt-2 h-8 w-full max-w-[200px]" />
      );
    }
    return null;
  };

  return (
    <div className={`flex items-start gap-3 group ${depth > 0 ? 'mt-3' : ''}`}>
      <Avatar
        src={comment.author.avatar}
        alt={comment.author.name}
        size={depth > 0 ? 'xs' : 'sm'}
        className="mt-0.5 shrink-0 cursor-pointer transition hover:opacity-90"
        onClick={() => setActiveUserProfile(comment.author)}
      />
      <div className="min-w-0 flex-1">
        <div className={`rounded-2xl ${depth === 0 ? 'bg-neutral-50 px-3 py-2.5' : 'bg-white border border-neutral-100 px-2.5 py-2'}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              onClick={() => setActiveUserProfile(comment.author)}
              className="cursor-pointer text-[11px] font-bold text-neutral-900 hover:underline"
            >
              {comment.author.username}
            </span>
            {isVerified && <CheckCircle className="h-3.5 w-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />}
            {isAuthor && <span className="rounded bg-neutral-200 px-1.5 py-0.2 text-[9px] font-medium text-neutral-600">Author</span>}
            <span className="text-[10px] text-neutral-400">{comment.createdAt}</span>
          </div>
          {comment.text && <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-neutral-800">{comment.text}</p>}
          {renderMedia()}

          <div className="mt-2 flex items-center gap-3">
            {!comment.isDeleted && (
              <>
                <button onClick={() => onReply(comment.id, comment.author.username)} className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-700">Reply</button>
                <button onClick={() => onLike(postId, comment.id)} className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 hover:text-rose-500">
                  <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {comment.likesCount > 0 ? comment.likesCount : 'Like'}
                </button>
              </>
            )}
            
            {isAuthor && !comment.isDeleted && (
              <div className="relative ml-auto">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full">
                  <MoreHorizontal className="h-3 w-3" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white p-1 shadow-lg border border-neutral-100 z-10">
                    <button 
                      onClick={() => {
                        if (confirm("Delete this reply?")) {
                          onDelete(comment.id);
                        }
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className={`mt-2 ${depth < 3 ? 'ml-2 border-l-2 border-neutral-100 pl-3' : ''}`}>
            {comment.replies.map((reply: any) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                postId={postId}
                postAuthorId={postAuthorId}
                depth={depth + 1}
                onReply={onReply}
                onLike={onLike}
                onDelete={onDelete}
                setActiveUserProfile={setActiveUserProfile}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentsModal: React.FC = () => {
  const {
    activeCommentsPostId,
    setActiveCommentsPostId,
    posts,
    addComment,
    deleteComment,
    toggleLikeComment,
    currentUser,
    setActiveUserProfile,
    generateUploadUrl
  } = useLalao();

  const post = posts.find((p) => p.id === activeCommentsPostId);
  const comments = useQuery(api.social.getCommentsForPost, activeCommentsPostId ? { postId: activeCommentsPostId as Id<"posts"> } : "skip");

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isMutedPreview, setIsMutedPreview] = useState(true);

  const commentsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCommentsPostId) {
      commentsListRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeCommentsPostId]);

  if (!activeCommentsPostId || !post) return null;

  const handleStartReply = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const onCommentAdded = () => {
    setTimeout(() => {
      commentsListRef.current?.scrollTo({ top: commentsListRef.current.scrollHeight, behavior: 'smooth' });
    }, 300);
  };

  const mediaContent = post.mediaUrl || (post as any).muxPlaybackId ? (
    <div className="relative flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden bg-neutral-100 md:min-h-0">
      {post.mediaType === 'video' ? (
        <MuxVideoPlayer
          muxPlaybackId={(post as any).muxPlaybackId}
          mediaUrl={post.mediaUrl}
          className="h-full w-full"
        />
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

  return (
    <div id="comments-screen" className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] p-0 md:p-6">
      <div className={`flex h-full w-full flex-col overflow-hidden border border-neutral-200/80 bg-white shadow-2xl md:h-[85vh] ${post.mediaUrl ? 'md:max-w-[1200px]' : 'md:max-w-[760px]'} md:rounded-[28px] md:mx-auto md:my-auto`}>
        <div className="flex h-full flex-col md:flex-row">
          {mediaContent && (
            <div className="relative flex min-h-[220px] w-full items-center justify-center overflow-hidden bg-neutral-100 md:w-[54%] md:min-h-0">
              {mediaContent}
            </div>
          )}

          <div className={`flex min-h-0 flex-1 flex-col bg-white ${mediaContent ? 'md:max-w-[460px]' : 'w-full'}`}>
            <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveCommentsPostId(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100">
                  <X className="h-4 w-4 stroke-[2.2]" />
                </button>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">{post.mediaUrl ? 'Comments' : 'Conversation'}</h3>
                  <p className="text-[11px] font-medium text-neutral-400">{post.commentsCount} {post.commentsCount === 1 ? 'reply' : 'replies'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5 shrink-0">
              <Avatar src={post.author.avatar} alt={post.author.name} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-900">{post.author.username}</span>
                  <span className="text-[10px] text-neutral-400">· {post.createdAt}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600 leading-normal">{post.text}</p>
              </div>
            </div>

            <div ref={commentsListRef} className="flex-1 overflow-y-auto bg-white px-4 py-3 space-y-4 min-h-0">
              {!comments ? (
                <div className="flex items-center justify-center py-8"><span className="text-sm text-neutral-400">Loading replies...</span></div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      postAuthorId={post.author.id}
                      onReply={handleStartReply}
                      onLike={toggleLikeComment}
                      onDelete={deleteComment}
                      setActiveUserProfile={setActiveUserProfile}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-400">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50"><Smile className="h-6 w-6" /></div>
                  <p className="mt-2 text-sm font-semibold text-neutral-700">No replies yet</p>
                  <p className="text-xs">Be the first to join the conversation.</p>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 p-3 bg-white w-full rounded-b-[28px] shrink-0">
              <CommentComposer
                postId={post.id}
                replyingTo={replyingTo}
                onCancelReply={cancelReply}
                onCommentAdded={onCommentAdded}
                currentUser={currentUser}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
