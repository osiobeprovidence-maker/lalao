import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';

interface MuxVideoPlayerProps {
  muxPlaybackId?: string;
  mediaUrl?: string; // Fallback for older Convex Storage videos
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  /** If true, show a small inline player. Otherwise full-width. */
  inline?: boolean;
}

/**
 * MuxVideoPlayer
 *
 * Renders:
 * 1. A Mux Player (HLS adaptive streaming) if muxPlaybackId is present and video is ready
 * 2. A "processing" placeholder if the Mux upload is still being transcoded
 * 3. A basic <video> tag fallback for older Convex Storage videos
 */
export const MuxVideoPlayer: React.FC<MuxVideoPlayerProps> = ({
  muxPlaybackId,
  mediaUrl,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);

  // --- Case 1: Mux playback ID is present → use Mux stream ---
  if (muxPlaybackId) {
    const streamUrl = `https://stream.mux.com/${muxPlaybackId}.m3u8`;
    const posterUrl = poster ?? `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?time=0`;

    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-black ${className}`}>
        {isPlaying ? (
          <video
            src={streamUrl}
            poster={posterUrl}
            autoPlay
            muted={isMuted}
            loop={loop}
            playsInline
            controls
            className="w-full h-full object-cover"
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="relative aspect-video w-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
            <img
              src={posterUrl}
              alt="Video thumbnail"
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

  // --- Case 2: muxUploadId present but no playbackId → still processing ---
  if (!muxPlaybackId && !mediaUrl) {
    return (
      <div className={`relative w-full aspect-video rounded-2xl bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-[#5E43F3]/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#5E43F3] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-700">Video processing…</p>
          <p className="text-xs text-neutral-400 mt-0.5">This usually takes less than a minute</p>
        </div>
      </div>
    );
  }

  // --- Case 3: Fallback — basic HTML5 video (Convex Storage / Cloudinary) ---
  if (mediaUrl) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-neutral-900 ${className}`}>
        {isPlaying ? (
          <video
            src={mediaUrl}
            autoPlay
            muted={isMuted}
            loop={loop}
            playsInline
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setIsPlaying(false)}
          />
        ) : (
          <div className="relative aspect-video w-full flex items-center justify-center bg-neutral-900 cursor-pointer group" onClick={() => setIsPlaying(true)}>
            <img
              src={mediaUrl}
              alt="Video preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-75 group-hover:opacity-60 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-black/80 hover:scale-105 transition-all shadow-md">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
