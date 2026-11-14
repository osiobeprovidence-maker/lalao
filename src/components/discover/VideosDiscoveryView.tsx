import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Heart, MessageCircle, Play, Repeat2, Video as VideoIcon } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Post } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';

type VideoDiscoveryPost = Pick<
  Post,
  'id' | 'author' | 'text' | 'mediaUrl' | 'mediaType' | 'createdAt' | 'likesCount' | 'commentsCount' | 'repostsCount'
> & {
  muxPlaybackId?: string;
  createdAtMs?: number;
  duration?: number;
};

type SortMode = 'for-you' | 'newest' | 'most-liked';

const muxThumbnailUrl = (playbackId: string, time: number) =>
  `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640&fit_mode=preserve`;

const isImageUrl = (url?: string) => Boolean(url && (
  url.startsWith('data:image/') ||
  /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(url) ||
  url.includes('image.mux.com')
));

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
};

const VideoPreview: React.FC<{ post: VideoDiscoveryPost }> = ({ post }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekAttemptRef = useRef(0);
  const [shouldLoadMetadata, setShouldLoadMetadata] = useState(false);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string>();
  const [duration, setDuration] = useState(post.duration);

  const thumbnailCandidates = useMemo(() => {
    const candidates = post.muxPlaybackId
      ? [2, 1, 3].map((time) => muxThumbnailUrl(post.muxPlaybackId!, time))
      : [];
    if (isImageUrl(post.mediaUrl) && post.mediaUrl && !candidates.includes(post.mediaUrl)) {
      candidates.push(post.mediaUrl);
    }
    return candidates;
  }, [post.mediaUrl, post.muxPlaybackId]);

  const videoSource = post.muxPlaybackId
    ? `https://stream.mux.com/${post.muxPlaybackId}/medium.mp4`
    : post.mediaType === 'video' && !isImageUrl(post.mediaUrl)
      ? post.mediaUrl
      : undefined;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      setShouldLoadMetadata(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldLoadMetadata(true);
        observer.disconnect();
      }
    }, { rootMargin: '220px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const seekToPreviewFrame = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const targets = [1.5, 1, 3]
      .map((time) => Math.min(time, Math.max(0.1, video.duration * 0.45)))
      .filter((time, index, values) => values.findIndex((value) => Math.abs(value - time) < 0.1) === index);
    const target = targets[seekAttemptRef.current];
    if (target === undefined) return;
    if (Math.abs(video.currentTime - target) < 0.1 && video.readyState >= 2) {
      video.dispatchEvent(new Event('seeked'));
    } else {
      video.currentTime = target;
    }
  };

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration) && video.duration > 0) setDuration(video.duration);
    if (thumbnailCandidates.length === 0) seekToPreviewFrame();
  };

  const handlePosterError = () => {
    setThumbnailIndex((index) => {
      const nextIndex = index + 1;
      if (nextIndex >= thumbnailCandidates.length) {
        window.requestAnimationFrame(seekToPreviewFrame);
      }
      return nextIndex;
    });
  };

  const handleVideoSeeked = () => {
    const video = videoRef.current;
    if (!video || generatedThumbnail || thumbnailIndex < thumbnailCandidates.length) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth || 640, 640);
      canvas.height = Math.max(1, Math.round(canvas.width * ((video.videoHeight || 360) / (video.videoWidth || 640))));
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, Math.min(canvas.width, 32), Math.min(canvas.height, 32)).data;
      let brightness = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        brightness += (pixels[index] * 0.2126) + (pixels[index + 1] * 0.7152) + (pixels[index + 2] * 0.0722);
      }
      const averageBrightness = brightness / Math.max(1, pixels.length / 4);
      const videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
      if (averageBrightness < 14 && seekAttemptRef.current < 2 && videoDuration > 1.5) {
        seekAttemptRef.current += 1;
        seekToPreviewFrame();
        return;
      }
      setGeneratedThumbnail(canvas.toDataURL('image/jpeg', 0.82));
    } catch {
      // Cross-origin video sources may prevent canvas capture; keep the styled fallback visible.
    }
  };

  const hasStaticThumbnail = thumbnailIndex < thumbnailCandidates.length;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-theme-surface">
      {generatedThumbnail ? (
        <img src={generatedThumbnail} alt="Video preview frame" className="absolute inset-0 h-full w-full object-cover" />
      ) : hasStaticThumbnail ? (
        <img
          src={thumbnailCandidates[thumbnailIndex]}
          alt="Video preview frame"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
          onError={handlePosterError}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-theme-surface via-theme-surface-hover to-theme-base text-theme-tertiary">
          <VideoIcon className="h-9 w-9 text-[#5E43F3]/75" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Preview unavailable</span>
        </div>
      )}

      {shouldLoadMetadata && videoSource && !generatedThumbnail && (
        <video
          ref={videoRef}
          src={videoSource}
          crossOrigin="anonymous"
          preload="metadata"
          muted
          playsInline
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0"
          onLoadedMetadata={handleVideoMetadata}
          onSeeked={handleVideoSeeked}
          onError={() => undefined}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/15 pointer-events-none" />
      <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/70 px-2 py-1 text-[10px] font-bold tabular-nums text-white shadow-sm backdrop-blur-sm">
        <Clock3 className="h-3 w-3 text-white/75" />
        {duration && Number.isFinite(duration) ? formatDuration(duration) : 'VIDEO'}
      </span>
      <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/50 text-white shadow-lg backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-[#5E43F3]">
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      </span>
    </div>
  );
};

export const VideosDiscoveryView: React.FC = () => {
  const { setActiveVideoFeedPostId } = useLalao();
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [sortMode, setSortMode] = useState<SortMode>('for-you');
  const [accumulatedPosts, setAccumulatedPosts] = useState<VideoDiscoveryPost[]>([]);

  const result = useQuery(api.social.listVideoPosts, { limit: 24, cursor });

  useEffect(() => {
    if (result?.posts) {
      setAccumulatedPosts((previous) => {
        const existingIds = new Set(previous.map((post) => post.id));
        const newPosts = result.posts.filter((post: VideoDiscoveryPost) => !existingIds.has(post.id));
        return [...previous, ...newPosts];
      });
    }
  }, [result]);

  const sortedPosts = useMemo(() => {
    const posts = [...accumulatedPosts];
    if (sortMode === 'most-liked') {
      return posts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }
    if (sortMode === 'newest') {
      return posts.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    }
    return posts.sort((a, b) => {
      const engagementA = (a.likesCount || 0) + (a.commentsCount || 0) * 2 + (a.repostsCount || 0) * 3;
      const engagementB = (b.likesCount || 0) + (b.commentsCount || 0) * 2 + (b.repostsCount || 0) * 3;
      return engagementB - engagementA || (b.createdAtMs || 0) - (a.createdAtMs || 0);
    });
  }, [accumulatedPosts, sortMode]);

  const isLoadingInitial = result === undefined && accumulatedPosts.length === 0;

  if (isLoadingInitial) {
    return (
      <div className="flex min-h-[220px] w-full flex-col items-center justify-center space-y-3 px-4 py-12 text-theme-primary">
        <div className="w-8 h-8 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-theme-secondary font-medium">Loading videos...</p>
      </div>
    );
  }

  return (
    <section
      id="videos-discovery-section"
      className="w-full px-4 pb-12 pt-4 text-theme-primary animate-in fade-in duration-200"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-black tracking-tight text-theme-primary sm:text-2xl">Videos</h1>
        <label className="flex shrink-0 items-center gap-2 rounded-lg border border-theme-divider/80 bg-theme-surface px-3 py-2 text-xs text-theme-secondary focus-within:border-[#5E43F3]">
          <span className="sr-only">Sort videos</span>
          <select
            aria-label="Sort videos"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="max-w-[116px] cursor-pointer appearance-none bg-transparent font-semibold text-theme-primary outline-none"
          >
            <option value="for-you" className="bg-theme-surface text-theme-primary">For You</option>
            <option value="newest" className="bg-theme-surface text-theme-primary">Newest</option>
            <option value="most-liked" className="bg-theme-surface text-theme-primary">Most liked</option>
          </select>
        </label>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="rounded-2xl border border-theme-divider bg-theme-surface px-4 py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5E43F3]/15 text-[#8B79FF]">
            <VideoIcon className="h-7 w-7" />
          </div>
          <h2 className="text-sm font-bold text-theme-primary">No videos discovered yet</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-theme-secondary">
            Be the first to share a video or clip with the Lalao community.
          </p>
        </div>
      ) : (
        <div id="videos-discovery-grid" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,_10rem),_1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
          {sortedPosts.map((post) => {
            const creatorName = getPublicIdentityLabel(post.author);
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setActiveVideoFeedPostId(post.id)}
                aria-label={`Play video by ${creatorName}`}
                className="group relative aspect-[9/15] min-w-0 overflow-hidden rounded-xl border border-theme-divider bg-theme-surface text-left shadow-sm shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-[#5E43F3]/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
              >
                <VideoPreview post={post} />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-2.5 sm:p-3">
                  <span className="mb-1.5 flex min-w-0 items-center gap-1.5">
                    <Avatar src={post.author.avatar} alt={creatorName} size="xs" className="shrink-0 ring-1 ring-white/30" />
                    <span className="truncate text-[11px] font-bold text-white">{creatorName}</span>
                    <VerificationBadge user={post.author} size="xs" />
                  </span>
                  {post.text && <span className="mb-2 line-clamp-2 break-words text-[11px] leading-snug text-white/85">{post.text}</span>}
                  <span className="flex items-center gap-2.5 text-[10px] font-semibold tabular-nums text-white/80">
                    <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3 fill-white/65 text-white/65" />{post.likesCount || 0}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3 text-white/70" />{post.commentsCount || 0}</span>
                    <span className="inline-flex items-center gap-1"><Repeat2 className="h-3 w-3 text-white/70" />{post.repostsCount || 0}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {result?.nextCursor && (
        <div className="mt-7 text-center">
          <button
            type="button"
            onClick={() => setCursor(result.nextCursor || undefined)}
            className="rounded-full border border-[#5E43F3]/50 bg-[#5E43F3]/15 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#5E43F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
          >
            Load More Videos
          </button>
        </div>
      )}
    </section>
  );
};
