import React, { useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Play, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface MuxVideoPlayerProps {
  muxPlaybackId?: string;
  mediaUrl?: string; // Fallback or client-extracted poster preview
  poster?: string;
  mediaStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  /** If true, show a small inline player. Otherwise full-width. */
  inline?: boolean;
  onRetryProcessing?: () => void;
}

/**
 * MuxVideoPlayer
 *
 * Renders:
 * 1. A Mux Player (HLS adaptive streaming) if muxPlaybackId is present (or extractable)
 * 2. An instant poster frame with a subtle non-blocking processing badge while Mux transcodes in background
 * 3. A friendly failure badge if processing failed
 * 4. A basic <video> tag fallback for raw MP4 videos
 */
export const MuxVideoPlayer: React.FC<MuxVideoPlayerProps> = ({
  muxPlaybackId,
  mediaUrl,
  poster,
  mediaStatus = 'ready',
  autoPlay = false,
  loop = false,
  muted = false,
  className = '',
  onRetryProcessing,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);

  // Auto-extract muxPlaybackId if mediaUrl is a Mux thumbnail URL
  let effectivePlaybackId = muxPlaybackId;
  if (!effectivePlaybackId && mediaUrl && mediaUrl.includes('image.mux.com')) {
    const match = mediaUrl.match(/image\.mux\.com\/([^/]+)\/thumbnail/);
    if (match && match[1]) {
      effectivePlaybackId = match[1];
    }
  }

  // --- Case 1: Mux playback ID is present & ready → use Mux HLS adaptive stream ---
  if (effectivePlaybackId) {
    const posterUrl = poster ?? `https://image.mux.com/${effectivePlaybackId}/thumbnail.jpg?time=0`;

    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-black ${className}`}>
        {isPlaying ? (
          <MuxPlayer
            playbackId={effectivePlaybackId}
            poster={posterUrl}
            streamType="on-demand"
            autoPlay={true}
            muted={isMuted}
            loop={loop}
            playsInline
            preload="auto"
            className="w-full h-full object-cover aspect-video"
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="relative aspect-video w-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
            <img
              src={posterUrl}
              alt="Video thumbnail"
              loading="lazy"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-opacity duration-200"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/85 group-hover:scale-110 transition-all duration-200 shadow-lg">
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </div>
            </div>
            {/* Mux quality badge */}
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              HD
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Case 2: Media processing in background but poster preview available ---
  if (mediaStatus === 'processing' && !effectivePlaybackId) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-neutral-900 ${className}`}>
        <div className="relative aspect-video w-full flex items-center justify-center bg-neutral-900 group">
          {mediaUrl && (mediaUrl.startsWith('data:image') || mediaUrl.includes('image.mux.com') || poster) ? (
            <img
              src={poster || mediaUrl}
              alt="Video preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center" />
          )}

          {/* Subtle non-blocking processing badge overlay */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md z-10">
            <Loader2 className="w-3.5 h-3.5 text-[#5E43F3] animate-spin" />
            <span>Processing HD Video...</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center shadow-md">
              <Play className="w-6 h-6 text-white/80 ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Case 3: Processing Failed ---
  if (mediaStatus === 'failed') {
    return (
      <div className={`relative w-full aspect-video rounded-2xl bg-rose-950/20 border border-rose-200/40 flex flex-col items-center justify-center gap-3 p-4 text-center ${className}`}>
        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-rose-900">Media processing encountered an issue</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Your caption remains posted. Video preview will update shortly.</p>
        </div>
        {onRetryProcessing && (
          <button
            type="button"
            onClick={onRetryProcessing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry processing
          </button>
        )}
      </div>
    );
  }

  // --- Case 4: Fallback — basic HTML5 video (Convex Storage / Cloudinary / direct MP4) ---
  if (mediaUrl) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-neutral-900 ${className}`}>
        <video
          src={mediaUrl}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-cover max-h-[500px]"
        />
      </div>
    );
  }

  return null;
};
