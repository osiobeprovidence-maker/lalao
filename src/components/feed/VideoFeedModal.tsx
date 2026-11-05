import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import {
  X,
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  Share,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Music,
  Disc,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { Post } from '../../types';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';

type VideoFeedPost = Pick<
  Post,
  | 'id'
  | 'author'
  | 'text'
  | 'mediaUrl'
  | 'mediaType'
  | 'likesCount'
  | 'commentsCount'
  | 'repostsCount'
  | 'isLiked'
  | 'isReposted'
  | 'soundId'
  | 'soundTitle'
  | 'soundAuthorName'
  | 'soundAudioUrl'
  | 'soundStartOffset'
  | 'soundVolume'
  | 'originalAudioVolume'
> & {
  muxPlaybackId?: string;
  mediaStatus?: Post['mediaStatus'];
};

type ScrollSnapshot = {
  main: HTMLElement | null;
  mainTop: number;
  windowY: number;
  bodyOverflow: string;
};

export const VideoFeedModal: React.FC = () => {
  const {
    activeVideoFeedPostId,
    setActiveVideoFeedPostId,
    posts,
    toggleRepostPost,
    triggerShareToast,
  } = useLalao();

  const [isMuted, setIsMuted] = useState(true);
  const isOpen = Boolean(activeVideoFeedPostId);

  const discoveryResult = useQuery(
    api.social.listVideoPosts,
    isOpen ? { limit: 200 } : 'skip',
  );

  const videoPosts = useMemo(() => {
    const merged = new Map<string, VideoFeedPost>();
    for (const post of posts) {
      if (post.mediaType === 'video' || post.muxPlaybackId) merged.set(post.id, post);
    }
    for (const post of discoveryResult?.posts ?? []) {
      if (merged.has(post.id)) continue;
      merged.set(post.id, {
        id: post.id,
        author: post.author,
        text: post.text || '',
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        muxPlaybackId: post.muxPlaybackId,
        mediaStatus: post.mediaStatus,
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        repostsCount: post.repostsCount || 0,
        isLiked: post.isLiked || false,
        isReposted: post.isReposted || false,
        soundId: post.soundId,
        soundTitle: post.soundTitle,
        soundAuthorName: post.soundAuthorName,
        soundAudioUrl: post.soundAudioUrl,
        soundStartOffset: post.soundStartOffset,
        soundVolume: post.soundVolume,
        originalAudioVolume: post.originalAudioVolume,
      });
    }
    return Array.from(merged.values());
  }, [posts, discoveryResult?.posts]);

  useEffect(() => {
    if (!isOpen) return;

    const main = document.querySelector('main');
    const snapshot: ScrollSnapshot = {
      main,
      mainTop: main?.scrollTop ?? 0,
      windowY: window.scrollY,
      bodyOverflow: document.body.style.overflow,
    };
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = snapshot.bodyOverflow;
      if (snapshot.main) snapshot.main.scrollTop = snapshot.mainTop;
      window.scrollTo({ top: snapshot.windowY, behavior: 'instant' });
    };
  }, [isOpen]);

  const activeIndex = videoPosts.findIndex((post) => post.id === activeVideoFeedPostId);
  const activePost = activeIndex >= 0 ? videoPosts[activeIndex] : undefined;
  const navigateVideo = (offset: -1 | 1) => {
    const nextPost = videoPosts[activeIndex + offset];
    if (nextPost) setActiveVideoFeedPostId(nextPost.id);
  };

  if (!activeVideoFeedPostId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0D0D0D] text-white animate-in fade-in duration-200"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <header className="absolute inset-x-0 top-0 z-[110] flex items-center justify-between border-b border-white/10 bg-[#0D0D0D]/90 px-4 py-3 backdrop-blur-md md:px-6">
        <button
          type="button"
          onClick={() => setActiveVideoFeedPostId(null)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-[#5E43F3]/70 hover:bg-[#5E43F3]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
          aria-label="Close video viewer"
        >
          <X className="h-5 w-5" />
          <span className="hidden sm:inline">Close</span>
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">Video</p>
          {activeIndex >= 0 && <p className="text-[11px] text-white/55">{activeIndex + 1} of {videoPosts.length}</p>}
        </div>
        <button
          type="button"
          className="rounded-full border border-white/15 bg-white/5 p-2 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-16 md:px-8 md:pt-20">
        {activePost ? (
          <div key={activePost.id} className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-2">
            <VideoFeedItem post={activePost} isMuted={isMuted} onToggleMute={() => setIsMuted((muted) => !muted)} />

            <nav className="flex w-full max-w-[640px] items-center justify-between border-t border-white/10 pt-3" aria-label="Video navigation">
              <button
                type="button"
                onClick={() => navigateVideo(-1)}
                disabled={activeIndex <= 0}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous video"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => navigateVideo(1)}
                disabled={activeIndex < 0 || activeIndex >= videoPosts.length - 1}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next video"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center gap-3 text-sm text-white/65" role="status">
            <Loader2 className="h-5 w-5 animate-spin text-[#5E43F3]" />
            Loading selected video…
          </div>
        )}
      </div>
    </div>
  );
};

const VideoFeedItem: React.FC<{
  post: VideoFeedPost;
  isMuted: boolean;
  onToggleMute: () => void;
}> = ({ post, isMuted, onToggleMute }) => {
  const {
    toggleLikePost,
    toggleSavePost,
    toggleRepostPost,
    setActiveCommentsPostId,
    openSoundDetail,
    triggerShareToast,
  } = useLalao();
  const creatorName = getPublicIdentityLabel(post.author);

  const handleShare = async () => {
    const videoUrl = post.muxPlaybackId
      ? `https://stream.mux.com/${post.muxPlaybackId}.m3u8`
      : post.mediaUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Video on Lalao', text: post.text, url: videoUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(videoUrl);
        triggerShareToast('Video link copied to clipboard');
      } else {
        triggerShareToast('Sharing is not available in this browser');
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') triggerShareToast('Could not share this video');
    }
  };

  return (
    <article className="w-full max-w-[640px]">
      <div className="relative mx-auto flex max-h-[68dvh] w-full max-w-[min(92vw,640px)] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
        <VideoPlayer
          muxPlaybackId={post.muxPlaybackId}
          mediaUrl={post.mediaUrl}
          mediaStatus={post.mediaStatus}
          poster={post.muxPlaybackId ? `https://image.mux.com/${post.muxPlaybackId}/thumbnail.jpg?time=1.5&width=640&fit_mode=preserve` : undefined}
          aspect="auto"
          autoPlay
          muted={isMuted}
          hideMuteButton
          className="max-h-[68dvh] w-full object-contain"
        />
        <button
          type="button"
          onClick={onToggleMute}
          className="absolute bottom-3 right-3 z-40 rounded-full border border-white/20 bg-black/65 p-2.5 text-white shadow-lg transition hover:bg-[#5E43F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-4 border-t border-white/10 px-1 pt-4">
        <div className="mb-3 flex min-w-0 items-center gap-3">
          <img
            src={post.author.avatar || 'https://via.placeholder.com/150'}
            alt={creatorName}
            className="h-10 w-10 shrink-0 rounded-full border border-white/15 object-cover"
          />
          <div className="min-w-0">
            <h2 className="flex items-center gap-1 truncate text-[15px] font-bold leading-tight text-white">
              {creatorName}
              <VerificationBadge user={post.author} size="xs" />
            </h2>
            <p className="mt-0.5 text-xs text-white/55">Lalao video</p>
          </div>
        </div>

        {post.text && <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/90">{post.text}</p>}

        {(post.soundTitle || post.soundAudioUrl) && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                if (post.soundId) openSoundDetail?.(post.soundId);
              }}
              disabled={!post.soundId}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:cursor-default"
            >
              <Disc className="h-3.5 w-3.5 shrink-0 text-[#8B79FF]" />
              <span className="truncate">{post.soundTitle || 'Original audio'}</span>
              {post.soundAuthorName && <span className="truncate text-white/55">· {post.soundAuthorName}</span>}
              {!post.soundTitle && <Music className="h-3.5 w-3.5 shrink-0 text-white/55" />}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-3 text-white/75">
          <button
            type="button"
            onClick={() => toggleLikePost(post.id)}
            aria-label={`${post.isLiked ? 'Unlike' : 'Like'} video, ${post.likesCount || 0} likes`}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-1 transition hover:text-white ${post.isLiked ? 'text-[#8B79FF]' : ''}`}
          >
            <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-semibold tabular-nums">{post.likesCount || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCommentsPostId(post.id)}
            aria-label={`Comments, ${post.commentsCount || 0}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-1 transition hover:text-white"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-semibold tabular-nums">{post.commentsCount || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleRepostPost(post.id)}
            aria-label={`${post.isReposted ? 'Undo repost' : 'Repost'} video, ${post.repostsCount || 0}`}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-1 transition hover:text-white ${post.isReposted ? 'text-[#8B79FF]' : ''}`}
          >
            <Repeat className="h-5 w-5" />
            <span className="text-sm font-semibold tabular-nums">{post.repostsCount || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleSavePost?.(post.id)}
            aria-label="Bookmark video"
            className="inline-flex min-h-10 items-center rounded-lg px-1 transition hover:text-[#8B79FF]"
          >
            <Bookmark className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            aria-label="Share video"
            className="inline-flex min-h-10 items-center rounded-lg px-1 transition hover:text-[#8B79FF]"
          >
            <Share className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
};
