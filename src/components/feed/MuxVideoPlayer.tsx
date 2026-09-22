import React, { useState, useEffect, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Play, Loader2, AlertCircle, RefreshCw, Film } from 'lucide-react';

interface MuxVideoPlayerProps {
  muxPlaybackId?: string;
  mediaUrl?: string; // Fallback or client-extracted poster preview
  poster?: string;
  mediaStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  aspect?: 'video' | 'square';
  /** If true, show a small inline player. Otherwise full-width. */
  inline?: boolean;
  onRetryProcessing?: () => void;
}

/**
 * MuxVideoPlayer
 *
 * Renders:
 * 1. A large polished video placeholder while uploading/transcoding.
 * 2. Off-screen: lightweight poster image only.
 * 3. Near-screen: Mounts <MuxPlayer> with preload="metadata".
 * 4. In-screen: Plays the video if autoPlay is true.
 */
export const MuxVideoPlayer = React.memo<MuxVideoPlayerProps>(({
  muxPlaybackId,
  mediaUrl,
  poster,
  mediaStatus = 'ready',
  autoPlay = false,
  loop = false,
  muted = true, // Default to muted for safe autoplay
  className = '',
  aspect = 'video',
  onRetryProcessing,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-video';

  // Viewport detection
  useEffect(() => {
    if (!containerRef.current) return;

    const nearObserver = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: '100% 0px' } // 1 viewport height in advance
    );

    const inObserver = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { threshold: 0.5 } // At least 50% visible
    );

    nearObserver.observe(containerRef.current);
    inObserver.observe(containerRef.current);

    return () => {
      nearObserver.disconnect();
      inObserver.disconnect();
    };
  }, []);

  // Manage playback state based on viewport visibility
  useEffect(() => {
    if (autoPlay && playerRef.current) {
      if (isInViewport) {
        // Only attempt to play if we're actually mounted and ready
        try {
          const playPromise = playerRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((e: any) => {
              // Ignore autoplay restrictions and 'no supported sources' errors which happen during mount
              if (e.name !== 'NotSupportedError' && e.name !== 'NotAllowedError') {
                console.warn("Autoplay prevented by browser:", e);
              }
            });
          }
        } catch (e) {
          // Ignore
        }
      } else {
        try {
          playerRef.current.pause();
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [isInViewport, autoPlay, isNearViewport]);

  // Auto-extract muxPlaybackId if mediaUrl is a Mux thumbnail URL
  let effectivePlaybackId = muxPlaybackId;
  if (!effectivePlaybackId && mediaUrl && mediaUrl.includes('image.mux.com')) {
    const match = mediaUrl.match(/image\.mux\.com\/([^/]+)\/thumbnail/);
    if (match && match[1]) {
      effectivePlaybackId = match[1];
    }
  }

  // Determine true status
  const isMuxReady = Boolean(effectivePlaybackId);
  const isFallbackVideo = !isMuxReady && mediaUrl && mediaUrl.length > 0 && !mediaUrl.startsWith('data:image') && !mediaUrl.includes('image.mux.com');
  const isVideoReady = isMuxReady || isFallbackVideo || (mediaStatus === 'ready' && mediaUrl && mediaUrl.length > 0 && !mediaUrl.startsWith('data:image'));
  const isProcessing = !isVideoReady && (mediaStatus === 'processing' || mediaStatus === 'uploading' || !mediaStatus);
  const isFailed = mediaStatus === 'failed';

  // 1. STATE: UPLOADING
  if (mediaStatus === 'uploading') {
    return (
      <div className={`relative w-full ${aspectClass} rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center p-6 gap-3 text-center ${className}`}>
        <div className="w-14 h-14 rounded-full bg-[#5E43F3]/15 flex items-center justify-center border border-[#5E43F3]/30 shadow-inner">
          <Loader2 className="w-7 h-7 text-[#5E43F3] animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white tracking-wide">Uploading video...</p>
          <p className="text-xs text-neutral-400">Your video is uploading securely</p>
        </div>
      </div>
    );
  }

  // 2. STATE: PROCESSING / PREPARING (NO NATIVE VIDEO PLAYER / NO 0:00)
  if (isProcessing && !isFailed) {
    const previewPoster = poster || (mediaUrl && (mediaUrl.startsWith('data:image') || mediaUrl.includes('image.mux.com')) ? mediaUrl : undefined);

    return (
      <div className={`relative w-full ${aspectClass} rounded-2xl bg-neutral-900 border border-neutral-800/80 overflow-hidden flex flex-col items-center justify-center p-6 text-center ${className}`}>
        {/* Background Poster Blur if present */}
        {previewPoster && (
          <img
            src={previewPoster}
            alt="Video preview frame"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

        {/* Processing Indicator */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-3 max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#5E43F3]/20 border border-[#5E43F3]/40 backdrop-blur-md flex items-center justify-center shadow-xl">
            <Loader2 className="w-8 h-8 text-[#5E43F3] animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white tracking-wide">Video processing...</p>
            <p className="text-xs text-neutral-300/80 leading-relaxed">
              Preparing your video for optimal streaming playback
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-neutral-300 border border-white/10">
            <Film className="w-3 h-3 text-[#5E43F3]" />
            <span>HD Transcoding in background</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. STATE: FAILED
  if (isFailed) {
    return (
      <div className={`relative w-full ${aspectClass} rounded-2xl bg-neutral-900 border border-rose-900/40 flex flex-col items-center justify-center gap-3 p-6 text-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-500 border border-rose-500/30">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Video processing failed</p>
          <p className="text-xs text-neutral-400">Your post text remains active. Please try reprocessing.</p>
        </div>
        {onRetryProcessing && (
          <button
            type="button"
            onClick={onRetryProcessing}
            className="mt-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry processing
          </button>
        )}
      </div>
    );
  }

  // 4. STATE: READY → Mux Player HLS adaptive stream
  if (effectivePlaybackId) {
    const posterUrl = poster ?? `https://image.mux.com/${effectivePlaybackId}/thumbnail.jpg?time=0`;

    return (
      <div ref={containerRef} className={`relative w-full overflow-hidden rounded-[18px] bg-black ${className}`}>
        {!isNearViewport ? (
          // Lightweight off-screen state: just the poster image
          <img
            src={posterUrl}
            alt="Video poster"
            className={`block w-full h-full object-cover ${aspectClass}`}
            loading="lazy"
          />
        ) : (
          // Near viewport: mount player and load metadata
          <MuxPlayer
            ref={playerRef}
            playbackId={effectivePlaybackId}
            poster={posterUrl}
            streamType="on-demand"
            muted={isMuted}
            loop={loop}
            playsInline
            preload="metadata"
            className={`block w-full h-full object-cover ${aspectClass}`}
          />
        )}
      </div>
    );
  }

  // 5. STATE: READY → Basic HTML5 Video (Convex Storage / MP4)
  if (mediaUrl && mediaUrl.length > 0) {
    return (
      <div ref={containerRef} className={`relative w-full overflow-hidden rounded-[18px] bg-neutral-900 ${className}`}>
        {!isNearViewport ? (
           <img
             src={poster || mediaUrl}
             alt="Video poster"
             className={`block w-full h-full object-cover ${aspectClass}`}
             loading="lazy"
           />
        ) : (
          <video
            ref={playerRef}
            src={mediaUrl}
            poster={poster}
            controls={!autoPlay} // Hide controls if it's meant to autoplay like a feed item
            playsInline
            muted={isMuted}
            loop={loop}
            preload="metadata"
            className={`block w-full h-full object-cover ${aspectClass} max-h-[500px]`}
          />
        )}
      </div>
    );
  }

  return null;
}, (prevProps, nextProps) => {
  // Custom comparison to avoid re-rendering purely because of parent state changes
  return (
    prevProps.muxPlaybackId === nextProps.muxPlaybackId &&
    prevProps.mediaStatus === nextProps.mediaStatus &&
    prevProps.mediaUrl === nextProps.mediaUrl &&
    prevProps.poster === nextProps.poster
  );
});
