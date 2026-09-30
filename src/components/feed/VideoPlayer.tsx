import React, { useState, useEffect, useRef, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import {
  Play,
  Pause,
  Loader2,
  AlertCircle,
  RefreshCw,
  Film,
  Volume2,
  VolumeX,
  Rewind,
  FastForward,
  Maximize2,
  Minimize2,
  Settings,
} from 'lucide-react';

/**
 * VideoPlayer – unified component for Mux adaptive streaming and fallback MP4.
 * Handles portrait / landscape / square aspect ratios, viewport‑aware loading,
 * custom controls (play/pause, seek, volume, speed, PiP, fullscreen), and
 * accessibility.
 */
export const VideoPlayer = React.memo(
  function VideoPlayer({
    muxPlaybackId,
    mediaUrl,
    poster,
    mediaStatus = 'ready',
    autoPlay = false,
    loop = false,
    muted = true,
    className = '',
    aspect = 'video', // fallback if we cannot determine
    onRetryProcessing,
    onExpandVideo,
    hideMuteButton,
    onMuteToggle,
  }: {
    muxPlaybackId?: string;
    mediaUrl?: string;
    poster?: string;
    mediaStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    className?: string;
    aspect?: 'video' | 'square' | 'portrait' | 'auto';
    onRetryProcessing?: () => void;
    onExpandVideo?: () => void;
    hideMuteButton?: boolean;
    onMuteToggle?: (muted: boolean) => void;
  }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    const [isNearViewport, setIsNearViewport] = useState(false);
    const [isInViewport, setIsInViewport] = useState(false);
    const [isMuted, setIsMuted] = useState(muted);

    useEffect(() => {
      setIsMuted(muted);
      if (playerRef.current) {
        playerRef.current.muted = muted;
      }
    }, [muted]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [exactAspectRatio, setExactAspectRatio] = useState<number | null>(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [supportsPiP, setSupportsPiP] = useState(false);

    // Determine effective playback id (Mux or fallback)
    let effectivePlaybackId = muxPlaybackId;
    if (!effectivePlaybackId && mediaUrl && mediaUrl.includes('image.mux.com')) {
      const match = mediaUrl.match(/image\.mux\.com\/([^/]+)\/thumbnail/);
      if (match && match[1]) effectivePlaybackId = match[1];
    }

    const isMuxReady = Boolean(effectivePlaybackId);
    const isFallbackVideo =
      !isMuxReady &&
      mediaUrl &&
      mediaUrl.length > 0 &&
      !mediaUrl.startsWith('data:image') &&
      !mediaUrl.includes('image.mux.com');
    const isVideoReady =
      isMuxReady ||
      isFallbackVideo ||
      (mediaStatus === 'ready' && mediaUrl && mediaUrl.length > 0 && !mediaUrl.startsWith('data:image'));
    const isProcessing =
      !isVideoReady && (mediaStatus === 'processing' || mediaStatus === 'uploading' || !mediaStatus);
    const isFailed = mediaStatus === 'failed';

    // Viewport detection
    useEffect(() => {
      if (!containerRef.current) return;
      const nearObserver = new IntersectionObserver(
        ([entry]) => setIsNearViewport(entry.isIntersecting),
        { rootMargin: '100% 0px' },
      );
      const inObserver = new IntersectionObserver(
        ([entry]) => setIsInViewport(entry.isIntersecting),
        { threshold: 0.5 },
      );
      nearObserver.observe(containerRef.current);
      inObserver.observe(containerRef.current);
      return () => {
        nearObserver.disconnect();
        inObserver.disconnect();
      };
    }, []);

    // Autoplay handling (muted only)
    useEffect(() => {
      if (autoPlay && playerRef.current) {
        if (isInViewport) {
          const p = playerRef.current.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        } else {
          try {
            playerRef.current.pause();
          } catch {}
        }
      }
    }, [isInViewport, autoPlay]);

    // Media event listeners
    useEffect(() => {
      const videoEl = playerRef.current?.getInternalPlayer?.() || playerRef.current;
      if (!videoEl) return;
      const onLoadedMetadata = () => {
        setDuration(videoEl.duration);
        setIsLoading(false);
        // Aspect‑ratio detection
        const w = videoEl.videoWidth;
        const h = videoEl.videoHeight;
        if (w && h) {
          setExactAspectRatio(w / h);
        }
      };
      const onTimeUpdate = () => setCurrentTime(videoEl.currentTime);
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => setIsPlaying(false);
      const onVolumeChange = () => {
        setVolume(videoEl.volume);
        setIsMuted(videoEl.muted);
      };
      const onWaiting = () => setIsLoading(true);
      const onCanPlay = () => setIsLoading(false);
      const onError = () => setHasError(true);

      videoEl.addEventListener('loadedmetadata', onLoadedMetadata);
      videoEl.addEventListener('timeupdate', onTimeUpdate);
      videoEl.addEventListener('play', onPlay);
      videoEl.addEventListener('pause', onPause);
      videoEl.addEventListener('ended', onEnded);
      videoEl.addEventListener('volumechange', onVolumeChange);
      videoEl.addEventListener('waiting', onWaiting);
      videoEl.addEventListener('canplay', onCanPlay);
      videoEl.addEventListener('error', onError);

      return () => {
        videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoEl.removeEventListener('timeupdate', onTimeUpdate);
        videoEl.removeEventListener('play', onPlay);
        videoEl.removeEventListener('pause', onPause);
        videoEl.removeEventListener('ended', onEnded);
        videoEl.removeEventListener('volumechange', onVolumeChange);
        videoEl.removeEventListener('waiting', onWaiting);
        videoEl.removeEventListener('canplay', onCanPlay);
        videoEl.removeEventListener('error', onError);
      };
    }, [playerRef.current]);

    // PiP support detection (run once)
    useEffect(() => {
      const videoEl = playerRef.current?.getInternalPlayer?.() || playerRef.current;
      if (videoEl && typeof videoEl.requestPictureInPicture === 'function') {
        setSupportsPiP(true);
      }
    }, []);

    // Show controls on interaction
    const showControls = useCallback(() => {
      setControlsVisible(true);
      if (isPlaying) {
        const timeout = setTimeout(() => setControlsVisible(false), 2000);
        return () => clearTimeout(timeout);
      }
    }, [isPlaying]);

    const togglePlayPause = () => {
      if (!playerRef.current) return;
      if (isPlaying) playerRef.current.pause();
      else playerRef.current.play();
    };
    const toggleMute = () => {
      if (!playerRef.current) return;
      const newMuted = !isMuted;
      playerRef.current.muted = newMuted;
      setIsMuted(newMuted);
      onMuteToggle?.(newMuted);
    };
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = parseFloat(e.target.value);
      if (playerRef.current) playerRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    };
    const skip = (seconds: number) => {
      if (playerRef.current) {
        const newTime = Math.min(Math.max(playerRef.current.currentTime + seconds, 0), duration);
        playerRef.current.currentTime = newTime;
      }
    };
    const toggleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };
    const toggleSpeedMenu = () => setShowSpeedMenu((prev) => !prev);
    const changeSpeed = (speed: number) => {
      if (playerRef.current) playerRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    };
    const enterPiP = async () => {
      const videoEl = playerRef.current?.getInternalPlayer?.() || playerRef.current;
      if (videoEl && typeof videoEl.requestPictureInPicture === 'function') {
        try {
          await videoEl.requestPictureInPicture();
        } catch (e) {
          console.warn('PiP failed', e);
        }
      }
    };

    // Progress bar click/drag
    const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!playerRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPos = e.clientX - rect.left;
      const percent = clickPos / rect.width;
      const newTime = percent * duration;
      playerRef.current.currentTime = newTime;
    };

    // Dynamic aspect ratio styling for the wrapper before metadata loads
    const wrapperStyle = exactAspectRatio ? { aspectRatio: exactAspectRatio } : {};

    // Loading / error UI
    if (mediaStatus === 'uploading') {
      return (
        <div className={`relative w-full rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center p-6 gap-3 text-center ${className}`} style={wrapperStyle}>
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
    if (isProcessing && !isFailed) {
      const previewPoster = poster || (mediaUrl && (mediaUrl.startsWith('data:image') || mediaUrl.includes('image.mux.com')) ? mediaUrl : undefined);
      return (
        <div className={`relative w-full rounded-2xl bg-neutral-900 border border-neutral-800/80 overflow-hidden flex flex-col items-center justify-center p-6 text-center ${className}`} style={wrapperStyle}>
          {previewPoster && (
            <img
              src={previewPoster}
              alt="Video preview frame"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
          <div className="relative z-10 flex flex-col items-center justify-center gap-3 max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#5E43F3]/20 border border-[#5E43F3]/40 backdrop-blur-md flex items-center justify-center shadow-xl">
              <Loader2 className="w-8 h-8 text-[#5E43F3] animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white tracking-wide">Video processing...</p>
              <p className="text-xs text-neutral-300/80 leading-relaxed">Preparing your video for optimal streaming playback</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-neutral-300 border border-white/10">
              <Film className="w-3 h-3 text-[#5E43F3]" />
              <span>HD Transcoding in background</span>
            </div>
          </div>
        </div>
      );
    }
    if (isFailed) {
      return (
        <div className={`relative w-full rounded-2xl bg-neutral-900 border border-rose-900/40 flex flex-col items-center justify-center gap-3 p-6 text-center ${className}`} style={wrapperStyle}>
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

    // Ready state – render either Mux or fallback video
    const posterUrl = poster ?? (effectivePlaybackId ? `https://image.mux.com/${effectivePlaybackId}/thumbnail.jpg?time=0` : undefined);

    const renderPlayer = () => {
      if (effectivePlaybackId) {
        return (
          <MuxPlayer
            ref={playerRef}
            playbackId={effectivePlaybackId}
            poster={posterUrl}
            streamType="on-demand"
            muted={isMuted}
            loop={loop}
            playsInline
            preload="metadata"
            className={`block w-full h-auto max-h-[600px] object-contain mx-auto`}
          />
        );
      }
      // fallback MP4
      return (
        <video
          ref={playerRef}
          src={mediaUrl}
          poster={poster}
          muted={isMuted}
          loop={loop}
          playsInline
          preload="metadata"
          controls={false}
          className={`block w-full h-auto max-h-[600px] object-contain mx-auto`}
        />
      );
    };

    return (
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden ${className}`}
        onMouseMove={showControls}
        onTouchStart={showControls}
        style={wrapperStyle}
      >
        {!isNearViewport ? (
          <img
            src={posterUrl}
            alt="Video poster"
            className={`block w-full h-auto max-h-[600px] object-contain filter blur-sm transition-all duration-300 mx-auto`}
            loading="lazy"
          />
        ) : (
          renderPlayer()
        )}
        
        {/* Animated Loading Line along the top edge */}
        {isLoading && !hasError && (
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-30">
            <div className="w-full h-full bg-white/20"></div>
            <div className="absolute top-0 left-0 h-full w-1/3 bg-[#5E43F3] animate-[slide_1.5s_ease-in-out_infinite]"></div>
          </div>
        )}

        {/* Video Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 backdrop-blur-sm z-30 gap-2">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-white">Video couldn't load</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                setIsLoading(true);
                if (playerRef.current?.load) playerRef.current.load();
              }}
              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Play/Pause Indicator (Fades out when playing) */}
        {!isPlaying && isNearViewport && !isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Progress Bar (like mobile VideoProgressIndicator) */}
        {!hasError && (
          <div 
            className="absolute inset-x-0 bottom-0 h-2 cursor-pointer bg-transparent z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleBarClick(e);
            }}
          >
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/30">
              <div
                className="absolute h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        {!hasError && (
          <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-20">
            {!hideMuteButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm text-white transition"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.muxPlaybackId === nextProps.muxPlaybackId &&
    prevProps.mediaStatus === nextProps.mediaStatus &&
    prevProps.mediaUrl === nextProps.mediaUrl &&
    prevProps.poster === nextProps.poster,
);
