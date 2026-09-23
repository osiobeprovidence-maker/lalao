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
  }: {
    muxPlaybackId?: string;
    mediaUrl?: string;
    poster?: string;
    mediaStatus?: 'uploading' | 'processing' | 'ready' | 'failed';
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    className?: string;
    aspect?: 'video' | 'square';
    onRetryProcessing?: () => void;
  }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    const [isNearViewport, setIsNearViewport] = useState(false);
    const [isInViewport, setIsInViewport] = useState(false);
    const [isMuted, setIsMuted] = useState(muted);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape' | 'square'>('landscape');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [supportsPiP, setSupportsPiP] = useState(false);

    const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-video';

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
          const ratio = w / h;
          if (ratio > 1.2) setAspectRatio('landscape');
          else if (ratio < 0.8) setAspectRatio('portrait');
          else setAspectRatio('square');
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

    // Control actions
    const togglePlayPause = () => {
      if (!playerRef.current) return;
      if (isPlaying) playerRef.current.pause();
      else playerRef.current.play();
    };
    const toggleMute = () => {
      if (!playerRef.current) return;
      playerRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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

    // Loading / error UI
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
    if (isProcessing && !isFailed) {
      const previewPoster = poster || (mediaUrl && (mediaUrl.startsWith('data:image') || mediaUrl.includes('image.mux.com')) ? mediaUrl : undefined);
      return (
        <div className={`relative w-full ${aspectClass} rounded-2xl bg-neutral-900 border border-neutral-800/80 overflow-hidden flex flex-col items-center justify-center p-6 text-center ${className}`}>
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
            className={`block w-full h-full object-contain ${aspectClass}`}
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
          className={`block w-full h-full object-contain ${aspectClass}`}
        />
      );
    };

    return (
      <div
        ref={containerRef}
        data-aspect={aspectRatio}
        className={`relative w-full overflow-hidden rounded-[18px] bg-black ${className}`}
        onMouseMove={showControls}
        onTouchStart={showControls}
        style={{ maxHeight: aspectRatio === 'portrait' ? '70vh' : undefined }}
      >
        {!isNearViewport ? (
          <img
            src={posterUrl}
            alt="Video poster"
            className={`block w-full h-full object-cover ${aspectClass}`}
            loading="lazy"
          />
        ) : (
          renderPlayer()
        )}
        {/* Controls Overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 flex items-center justify-between p-2 bg-black/60 backdrop-blur-sm transition-opacity ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Play / Pause */}
          <button onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'} className="text-white">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          {/* Skip */}
          <div className="flex items-center space-x-1">
            <button onClick={() => skip(-10)} aria-label="Rewind 10 seconds" className="text-white">
              <Rewind className="w-5 h-5" />
            </button>
            <button onClick={() => skip(10)} aria-label="Forward 10 seconds" className="text-white">
              <FastForward className="w-5 h-5" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex-1 mx-2" onClick={handleBarClick}>
            <div className="relative h-1 bg-neutral-600/40 rounded">
              <div
                className="absolute h-1 bg-[#5E43F3] rounded"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
          {/* Time */}
          <div className="text-xs text-white whitespace-nowrap mr-2">
            {`${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')} / ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`}
          </div>
          {/* Volume */}
          <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="text-white">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-neutral-600/40 rounded"
          />
          {/* Settings (speed) */}
          <div className="relative">
            <button onClick={toggleSpeedMenu} aria-label="Playback speed" className="text-white mr-1">
              <Settings className="w-5 h-5" />
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-neutral-800 text-white rounded shadow-lg p-2 space-y-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full text-left px-2 py-1 ${playbackSpeed === s ? 'bg-[#5E43F3]/30' : ''}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Picture-in-Picture */}
          {supportsPiP && (
            <button onClick={enterPiP} aria-label="Picture in picture" className="text-white mr-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v8H7V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14v14H5V5z" />
              </svg>
            </button>
          )}
          {/* Fullscreen */}
          <button onClick={toggleFullscreen} aria-label="Toggle Fullscreen" className="text-white">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.muxPlaybackId === nextProps.muxPlaybackId &&
    prevProps.mediaStatus === nextProps.mediaStatus &&
    prevProps.mediaUrl === nextProps.mediaUrl &&
    prevProps.poster === nextProps.poster,
);
