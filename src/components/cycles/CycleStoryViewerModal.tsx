import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Pause,
  Play,
  MoreHorizontal,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Share2,
  User as UserIcon,
  VolumeX,
  Flag,
  Sparkles,
  Plus,
  CheckCircle2,
  Smile,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { MuxVideoPlayer } from '../feed/MuxVideoPlayer';

export const CycleStoryViewerModal: React.FC = () => {
  const {
    activeCycleId,
    activeStoryIndex,
    setActiveStoryIndex,
    closeCycleStory,
    cycles,
    openCycleStory,
    currentUser,
    reactToCycleStory,
    replyToCycleStory,
    deleteCycleStoryItem,
    setIsCreateCycleOpen,
    setActiveUserProfile,
    triggerShareToast,
  } = useLalao();

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isViewersSheetOpen, setIsViewersSheetOpen] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<'viewers' | 'likes' | 'replies'>('viewers');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commentInputRef = useRef<HTMLInputElement>(null);
  const STORY_DURATION = 5500; // 5.5 seconds per slide
  const progressIntervalRef = useRef<number | null>(null);

  const activeCycle = cycles.find((c) => c.id === activeCycleId);
  const isMyCycle =
    activeCycle?.user?.id === currentUser.id || activeCycle?.id === 'cycle_user_me';

  const items = activeCycle?.items || [];
  const currentItem = items[activeStoryIndex] || items[0];

  // Format time (e.g. "08:57 PM" or relative)
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '08:57 PM';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    return timeStr;
  };

  const handleNextSlide = () => {
    setProgress(0);
    if (activeStoryIndex < items.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      // Find next cycle with items
      const currentIndex = cycles.findIndex((c) => c.id === activeCycleId);
      const nextCycle = cycles.slice(currentIndex + 1).find((c) => c.items && c.items.length > 0);
      if (nextCycle) {
        openCycleStory(nextCycle.id, 0);
      } else {
        closeCycleStory();
      }
    }
  };

  const handlePrevSlide = () => {
    setProgress(0);
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      // Find previous cycle
      const currentIndex = cycles.findIndex((c) => c.id === activeCycleId);
      const prevCycles = cycles.slice(0, currentIndex).filter((c) => c.items && c.items.length > 0);
      const prevCycle = prevCycles[prevCycles.length - 1];
      if (prevCycle) {
        openCycleStory(prevCycle.id, prevCycle.items.length - 1);
      } else {
        closeCycleStory();
      }
    }
  };

  const handleNextSlideRef = useRef(handleNextSlide);
  useEffect(() => {
    handleNextSlideRef.current = handleNextSlide;
  });

  // Auto-progress timer
  useEffect(() => {
    if (!activeCycleId || !currentItem || isPaused || isViewersSheetOpen || isMoreMenuOpen) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / STORY_DURATION) * 100;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + increment);
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeCycleId, activeStoryIndex, isPaused, isViewersSheetOpen, isMoreMenuOpen, currentItem]);

  // When slide progress reaches 100%, advance
  useEffect(() => {
    if (progress >= 100) {
      setProgress(0);
      handleNextSlideRef.current();
    }
  }, [progress]);

  // Reset progress on slide change
  useEffect(() => {
    setProgress(0);
  }, [activeStoryIndex, activeCycleId]);

  if (!activeCycleId || !activeCycle || items.length === 0 || !currentItem) return null;

  const authorName = isMyCycle
    ? currentUser.username || currentUser.name
    : activeCycle.user?.username || activeCycle.user?.name || activeCycle.name || 'User';

  const authorAvatar = isMyCycle
    ? currentUser.avatar
    : activeCycle.user?.avatar || activeCycle.avatar;

  const handleOpenProfile = () => {
    setIsPaused(true);
    const userToOpen = activeCycle.user || {
      id: activeCycle.id,
      name: activeCycle.name || 'Creator',
      username: (activeCycle.name || 'creator').toLowerCase().replace(/\s+/g, '_'),
      avatar: activeCycle.avatar || '',
      userType: 'person' as const,
      bio: activeCycle.description || '',
      location: activeCycle.location || 'Local',
      followersCount: 1450000,
      followingCount: 320,
      postsCount: 524,
      viewsCount: 2840000,
      isFollowing: true,
      isVerified: true,
    };
    closeCycleStory();
    setActiveUserProfile(userToOpen);
  };

  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || !currentItem) return;
    replyToCycleStory(activeCycle.id, currentItem.id, commentText.trim());
    setCommentText('');
    setIsPaused(false);
  };

  const handleLikeToggle = () => {
    if (!currentItem) return;
    reactToCycleStory(activeCycle.id, currentItem.id, '❤️');

    // Trigger floating heart animation
    const id = Date.now();
    const x = Math.random() * 30 + 55; // 55% to 85% width
    setFloatingHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((item) => item.id !== id));
    }, 1500);
  };

  const handleShareStory = () => {
    triggerShareToast(`Link to @${authorName}'s story copied!`);
  };

  const totalViews = currentItem.viewsCount ?? (currentItem.viewers?.length || 0);
  const totalLikes = currentItem.likesCount ?? 0;
  const totalReplies = currentItem.repliesCount ?? (currentItem.replies?.length || 0);

  return (
    <div
      id="modal-cycle-story-viewer-backdrop"
      className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex items-center justify-center select-none animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeCycleStory();
        if (e.key === 'ArrowRight') handleNextSlide();
        if (e.key === 'ArrowLeft') handlePrevSlide();
        if (e.key === ' ') setIsPaused((p) => !p);
      }}
      tabIndex={0}
    >
      {/* External Circular Close Button (Top-Right) */}
      <button
        id="btn-close-cycle-story-overlay"
        onClick={closeCycleStory}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md flex items-center justify-center text-white cursor-pointer z-50 transition-all shadow-lg border border-white/20"
        title="Close Story (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Story Phone Viewport */}
      <div
        id="cycle-story-viewer-card"
        className="w-full max-w-[420px] h-full sm:h-[92vh] sm:max-h-[840px] sm:rounded-3xl relative overflow-hidden bg-neutral-950 shadow-2xl flex flex-col justify-between border border-neutral-800/80"
      >
        {/* 1. TOP SEGMENTED PROGRESS BARS */}
        <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 flex items-center gap-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {items.map((item, idx) => {
            let widthPercent = 0;
            if (idx < activeStoryIndex) widthPercent = 100;
            else if (idx === activeStoryIndex) widthPercent = progress;

            return (
              <div
                key={item.id}
                className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden cursor-pointer backdrop-blur-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStoryIndex(idx);
                }}
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-75"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* 2. TOP HEADER (Avatar, Username, Time, Pause/Play, 3-Dots) */}
        <div className="absolute top-6 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          {/* User Profile & Info */}
          <div
            id="btn-cycle-story-author-header"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProfile();
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="relative p-[1.5px] rounded-full border border-white/60 group-hover:border-white transition-colors shrink-0">
              <Avatar
                src={authorAvatar}
                alt={authorName}
                size="sm"
                className="w-9 h-9"
              />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white truncate drop-shadow-sm group-hover:underline">
                  {authorName}
                </span>
                {!isMyCycle && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20 shrink-0" />
                )}
              </div>
              <span className="text-[11px] text-neutral-300 font-medium drop-shadow-xs">
                {formatTime(currentItem.createdAt)}
              </span>
            </div>
          </div>

          {/* Right Header Controls: Pause/Play & 3-Dots Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Pause/Play Toggle Button */}
            <button
              id="btn-cycle-story-play-pause"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((p) => !p);
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer transition-colors"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 fill-white text-white translate-x-[1px]" />
              ) : (
                <Pause className="w-4 h-4 fill-white text-white" />
              )}
            </button>

            {/* 3-Dots Menu Button */}
            <button
              id="btn-cycle-story-more-menu"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
                setIsMoreMenuOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer transition-colors"
              title="Options"
            >
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 3. TAP NAVIGATION HOTSPOTS (Left: Prev, Center: Hold Pause, Right: Next) */}
        <div
          className="absolute inset-0 z-20 flex"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Left tap zone */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevSlide();
            }}
          />
          {/* Middle zone */}
          <div className="w-1/3 h-full cursor-pointer" />
          {/* Right tap zone */}
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNextSlide();
            }}
          />
        </div>

        {/* Floating Heart Burst Layer */}
        {floatingHearts.map((fh) => (
          <div
            key={fh.id}
            className="absolute bottom-20 z-40 text-3xl pointer-events-none animate-bounce"
            style={{
              left: `${fh.x}%`,
              animation: 'floatUp 1.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }}
          >
            ❤️
          </div>
        ))}

        {/* 4. STORY CONTENT CANVAS */}
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative bg-neutral-950">
          {currentItem.mediaType === 'image' && currentItem.mediaUrl ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <img
                src={currentItem.mediaUrl}
                alt="Cycle Story"
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
              {currentItem.caption && (
                <div className="absolute bottom-24 left-4 right-4 z-20 pointer-events-none">
                  <p className="text-sm font-medium text-white drop-shadow-md bg-black/40 backdrop-blur-xs p-3 rounded-2xl border border-white/10 leading-snug">
                    {currentItem.caption}
                  </p>
                </div>
              )}
            </div>
          ) : currentItem.mediaType === 'video' && (currentItem.mediaUrl || (currentItem as any).muxPlaybackId) ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <MuxVideoPlayer
                muxPlaybackId={(currentItem as any).muxPlaybackId}
                mediaUrl={currentItem.mediaUrl}
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
            </div>
          ) : (
            /* Signature Lalao / Text Graphic Canvas (matching screenshot) */
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden ${
                currentItem.backgroundColor?.startsWith('from-')
                  ? `bg-gradient-to-br ${currentItem.backgroundColor}`
                  : 'bg-gradient-to-b from-[#002244] via-[#051E3D] to-[#0A192F]'
              }`}
            >
              {/* Abstract decorative ambient rings */}
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="absolute inset-0 border-[28px] border-white/5 rounded-full scale-150 pointer-events-none" />

              {/* Lalao Brand Graphic Elements */}
              <div className="relative z-10 flex flex-col items-center justify-center max-w-xs space-y-4">
                <div className="flex items-center gap-1.5 drop-shadow-md">
                  <span className="font-serif italic font-black text-3xl tracking-tight text-white drop-shadow-sm">
                    lalao
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/80 animate-pulse" />
                </div>

                <p className="text-xs font-medium text-blue-200/90 tracking-wide">
                  see what happening around you...
                </p>

                {currentItem.text && (
                  <div className="mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl w-full">
                    <p className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-tight">
                      {currentItem.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. BOTTOM INTERACTION BAR */}
        <div className="relative z-30 p-4 pb-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2">
          {isMyCycle ? (
            /* ============================================================
               OWNER'S VIEW (Screenshot 1: Eye, Heart, Comment Count Pill)
               ============================================================ */
            <div className="flex items-center justify-between">
              {/* Interactive Stats Pill */}
              <button
                id="btn-owner-story-stats-pill"
                type="button"
                onClick={() => {
                  setIsPaused(true);
                  setIsViewersSheetOpen(true);
                }}
                className="flex items-center gap-4 bg-white/10 hover:bg-white/20 active:scale-98 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 text-white text-xs font-semibold cursor-pointer transition-all shadow-md"
                title="View story insights & viewers"
              >
                {/* 👁 Viewers */}
                <div className="flex items-center gap-1.5 hover:text-blue-300 transition-colors">
                  <Eye className="w-4 h-4 text-white/90" />
                  <span>{totalViews}</span>
                </div>

                <div className="w-[1px] h-3 bg-white/30" />

                {/* 🤍 Likes */}
                <div className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                  <Heart className="w-4 h-4 text-white/90" />
                  <span>{totalLikes}</span>
                </div>

                <div className="w-[1px] h-3 bg-white/30" />

                {/* 💬 Replies */}
                <div className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors">
                  <MessageCircle className="w-4 h-4 text-white/90" />
                  <span>{totalReplies}</span>
                </div>
              </button>

              {/* Quick "Add Status" action */}
              <button
                id="btn-owner-add-cycle-status"
                type="button"
                onClick={() => {
                  closeCycleStory();
                  setIsCreateCycleOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>
          ) : (
            /* ============================================================
               VIEWER'S VIEW (Screenshot 2: Comment Input, Heart, Message)
               ============================================================ */
            <div className="space-y-2">
              {/* Quick Reaction Emojis Bar (if emoji toggle open or input active) */}
              {showEmojiPicker && (
                <div className="flex items-center justify-between bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/15 animate-in fade-in slide-in-from-bottom-2">
                  {['🔥', '❤️', '😂', '😮', '😢', '👏', '🙌'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        reactToCycleStory(activeCycle.id, currentItem.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-130 active:scale-95 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2.5">
                {/* Rounded Comment Input Pill */}
                <form
                  onSubmit={handleSendComment}
                  className="flex-1 flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white/20 border border-white/25 rounded-full px-4 py-2.5 backdrop-blur-md transition-all shadow-inner"
                >
                  <input
                    ref={commentInputRef}
                    id="input-cycle-story-comment"
                    type="text"
                    value={commentText}
                    onFocus={() => {
                      setIsPaused(true);
                      setShowEmojiPicker(true);
                    }}
                    onBlur={() => {
                      if (!commentText.trim()) {
                        setIsPaused(false);
                      }
                    }}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Comment on this story..."
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-neutral-400 focus:outline-none"
                  />

                  {commentText.trim() ? (
                    <button
                      type="submit"
                      className="ml-2 w-7 h-7 rounded-full bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-90 flex items-center justify-center text-white transition-all shrink-0 cursor-pointer shadow-xs"
                      title="Send Comment"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((p) => !p)}
                      className="ml-1 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Heart Reaction Button */}
                <button
                  id="btn-cycle-story-heart-like"
                  type="button"
                  onClick={handleLikeToggle}
                  className="p-2 text-white hover:text-rose-400 active:scale-125 transition-transform cursor-pointer shrink-0"
                  title={currentItem.isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      currentItem.isLiked
                        ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                        : 'text-white'
                    }`}
                  />
                </button>

                {/* Message / Comment Icon Button */}
                <button
                  id="btn-cycle-story-message-icon"
                  type="button"
                  onClick={() => {
                    commentInputRef.current?.focus();
                    setShowEmojiPicker(true);
                  }}
                  className="p-2 text-white hover:text-white/80 active:scale-95 transition-transform cursor-pointer shrink-0"
                  title="Reply to story"
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. THREE-DOTS OPTIONS SHEET */}
        {isMoreMenuOpen && (
          <div
            id="cycle-story-more-menu-backdrop"
            onClick={() => {
              setIsMoreMenuOpen(false);
              setIsPaused(false);
            }}
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-neutral-900 border-t border-neutral-800 rounded-t-3xl p-5 flex flex-col gap-2 animate-in slide-in-from-bottom max-w-md mx-auto"
            >
              {isMyCycle ? (
                <>
                  <div className="pb-3 border-b border-neutral-800">
                    <h4 className="text-sm font-bold text-white">Manage Status</h4>
                    <p className="text-xs text-neutral-400">Your 24-hour cycle update</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsPaused(false);
                      closeCycleStory();
                      setIsCreateCycleOpen(true);
                    }}
                    className="w-full py-3 px-3 rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-white text-sm font-semibold transition-colors cursor-pointer text-left"
                  >
                    <Plus className="w-5 h-5 text-[#5E43F3]" />
                    <span>Add Another Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsPaused(false);
                      handleShareStory();
                    }}
                    className="w-full py-3 px-3 rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-white text-sm font-semibold transition-colors cursor-pointer text-left"
                  >
                    <Share2 className="w-5 h-5 text-neutral-300" />
                    <span>Share Status Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsPaused(false);
                      deleteCycleStoryItem(currentItem.id);
                      if (items.length <= 1) closeCycleStory();
                      else handleNextSlide();
                    }}
                    className="w-full py-3 px-3 rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-rose-400 text-sm font-semibold transition-colors cursor-pointer text-left"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete This Status</span>
                  </button>
                </>
              ) : (
                <>
                  {/* User Profile Summary */}
                  <div
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleOpenProfile();
                    }}
                    className="flex items-center gap-3 pb-3 border-b border-neutral-800 cursor-pointer hover:opacity-90"
                  >
                    <Avatar src={authorAvatar} alt={authorName} size="md" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{authorName}</h4>
                      <p className="text-xs text-neutral-400 truncate">@{authorName}</p>
                    </div>
                    <span className="text-xs font-bold text-[#5E43F3] bg-[#5E43F3]/20 px-2.5 py-1 rounded-full">
                      Profile
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleOpenProfile();
                    }}
                    className="w-full py-3 px-3 rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-white text-sm font-semibold transition-colors cursor-pointer text-left"
                  >
                    <UserIcon className="w-5 h-5 text-[#5E43F3]" />
                    <span>View @{authorName}&apos;s Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsPaused(false);
                      handleShareStory();
                    }}
                    className="w-full py-3 px-3 rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-white text-sm font-semibold transition-colors cursor-pointer text-left"
                  >
                    <Share2 className="w-5 h-5 text-neutral-300" />
                    <span>Share Story</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsPaused(false);
                      triggerShareToast(`Muted updates from @${authorName}`);
                    }}
                    className="w-full py-3 px-3 rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-neutral-300 text-sm font-semibold transition-colors cursor-pointer text-left"
                  >
                    <VolumeX className="w-5 h-5 text-neutral-400" />
                    <span>Mute Updates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsPaused(false);
                      triggerShareToast('Story reported to moderators');
                    }}
                    className="w-full py-3 px-3 rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-rose-400 text-sm font-semibold transition-colors cursor-pointer text-left"
                  >
                    <Flag className="w-5 h-5" />
                    <span>Report Story</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsPaused(false);
                }}
                className="w-full py-2.5 mt-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 7. OWNER VIEW: SLIDE-UP ACTIVITY & VIEWERS SHEET */}
        {isViewersSheetOpen && (
          <div
            id="story-viewers-sheet-backdrop"
            onClick={() => {
              setIsViewersSheetOpen(false);
              setIsPaused(false);
            }}
            className="absolute inset-0 z-40 bg-black/75 backdrop-blur-xs flex items-end animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-neutral-900 border-t border-neutral-800 rounded-t-3xl p-5 max-h-[70%] flex flex-col animate-in slide-in-from-bottom max-w-md mx-auto"
            >
              {/* Sheet Header with Navigation Tabs */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSheetTab('viewers')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeSheetTab === 'viewers'
                        ? 'bg-[#5E43F3] text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Views ({totalViews})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSheetTab('likes')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeSheetTab === 'likes'
                        ? 'bg-rose-600 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Likes ({totalLikes})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSheetTab('replies')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeSheetTab === 'replies'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Replies ({totalReplies})</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsViewersSheetOpen(false);
                    setIsPaused(false);
                  }}
                  className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab 1: Viewers List */}
              {activeSheetTab === 'viewers' && (
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 py-2 min-h-[160px]">
                  {currentItem.viewers && currentItem.viewers.length > 0 ? (
                    currentItem.viewers.map((viewer) => (
                      <div
                        key={viewer.id}
                        onClick={() => {
                          setIsViewersSheetOpen(false);
                          closeCycleStory();
                          setActiveUserProfile({
                            id: viewer.id,
                            name: viewer.name,
                            username: viewer.name.toLowerCase().replace(/\s+/g, '_'),
                            avatar: viewer.avatar,
                            userType: 'person',
                            bio: 'Lalao community resident.',
                            location: 'Nearby',
                            followersCount: 140,
                            followingCount: 89,
                          });
                        }}
                        className="py-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-800/50 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar src={viewer?.avatar} alt={viewer?.name || 'Viewer'} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">
                              {viewer?.name}
                            </p>
                            <p className="text-[10px] text-neutral-400">{viewer?.viewedAt}</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium">
                          Profile
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      <Eye className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      No viewers yet. Local residents who view your status will appear here!
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Likes List */}
              {activeSheetTab === 'likes' && (
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 py-2 min-h-[160px]">
                  {totalLikes > 0 ? (
                    (currentItem.viewers || []).slice(0, totalLikes).map((viewer, idx) => (
                      <div
                        key={`like_${viewer.id}_${idx}`}
                        className="py-2.5 flex items-center justify-between text-left px-2 rounded-xl"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar src={viewer?.avatar} alt={viewer?.name || 'Liker'} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">
                              {viewer?.name}
                            </p>
                            <p className="text-[10px] text-rose-400 flex items-center gap-1">
                              <span>❤️ Reacted with love</span>
                            </p>
                          </div>
                        </div>
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      <Heart className="w-6 h-6 mx-auto mb-2 opacity-40 text-rose-400" />
                      No heart reactions yet on this status.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Replies List */}
              {activeSheetTab === 'replies' && (
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 py-2 min-h-[160px]">
                  {currentItem.replies && currentItem.replies.length > 0 ? (
                    currentItem.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="py-3 flex flex-col gap-1.5 px-2 rounded-xl bg-neutral-800/30 mb-2 border border-neutral-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar src={reply.user?.avatar} alt={reply.user?.name} size="xs" />
                            <span className="text-xs font-bold text-white">
                              {reply.user?.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400">{reply.createdAt}</span>
                        </div>
                        <p className="text-xs text-neutral-200 pl-7 leading-relaxed">
                          {reply.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-40 text-emerald-400" />
                      No comments or replies on this status yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
