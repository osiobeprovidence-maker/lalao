import React, { useState } from 'react';
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
 * 1. A large polished video placeholder ("Uploading video..." / "Video processing...") while media is being uploaded/transcoded.
 * 2. Never renders native <video> controls or 0:00 until playable asset is confirmed ready.
 * 3. A Mux Player (HLS adaptive streaming) once muxPlaybackId is present and ready.
 * 4. A friendly failure placeholder if transcoding encounters an error.
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
  aspect = 'video',
  onRetryProcessing,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-video';

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
  const isVideoReady = isMuxReady || (mediaStatus === 'ready' && mediaUrl && mediaUrl.length > 0 && !mediaUrl.startsWith('data:image'));
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
      <div className={`relative w-full overflow-hidden rounded-[18px] bg-black ${className}`}>
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
            className={`block w-full h-full object-cover ${aspectClass}`}
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className={`relative ${aspectClass} w-full cursor-pointer group`} onClick={() => setIsPlaying(true)}>
            <img
              src={posterUrl}
              alt="Video thumbnail"
              loading="lazy"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-opacity duration-200"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/85 group-hover:scale-110 transition-all duration-200 shadow-lg">
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              HD
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. STATE: READY → Basic HTML5 Video (Convex Storage / MP4)
  if (mediaUrl && mediaUrl.length > 0) {
    return (
      <div className={`relative w-full overflow-hidden rounded-[18px] bg-neutral-900 ${className}`}>
        <video
          src={mediaUrl}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          className={`block w-full h-full object-cover ${aspectClass} max-h-[500px]`}
        />
      </div>
    );
  }

  return null;
};
