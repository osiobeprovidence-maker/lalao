import React, { useRef, useEffect } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  ChevronDown,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';

export const ActiveCallModal: React.FC = () => {
  const {
    activeCall,
    isIncomingCall,
    isMuted,
    isCameraOff,
    isSpeakerOn,
    isMinimized,
    formattedDuration,
    connectionState,
    mediaError,
    remoteUser,
    isAgoraConfigured,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    toggleMinimize,
    switchCamera,
    attachLocalVideo,
    attachRemoteVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  // Attach DOM containers for video rendering
  useEffect(() => {
    if (localVideoRef.current) {
      attachLocalVideo(localVideoRef.current);
    }
  }, [localVideoRef.current, isCameraOff]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      attachRemoteVideo(remoteVideoRef.current);
    }
  }, [remoteVideoRef.current, remoteUser]);

  // Don't show active modal while receiving incoming call (IncomingCallModal handles it)
  if (!activeCall || isIncomingCall) return null;

  const isVideo = activeCall.type === 'video';
  const otherUser = activeCall.otherUser || (activeCall.isCaller ? activeCall.recipient : activeCall.caller);

  const getStatusLabel = () => {
    if (connectionState === 'ringing') return 'Ringing...';
    if (connectionState === 'connecting') return 'Connecting...';
    if (connectionState === 'reconnecting') return 'Reconnecting...';
    if (connectionState === 'connected') return formattedDuration || 'Connected';
    return 'Calling...';
  };

  // ── Minimized Floating Widget ──────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div
        id="minimized-call-widget"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[130] w-64 rounded-2xl bg-[#12141D]/95 border border-white/10 p-3 shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            src={otherUser?.avatar || undefined}
            alt={otherUser?.name || 'User'}
            size="sm"
            className="w-10 h-10 ring-2 ring-[#5E43F3]/40 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{otherUser?.name || 'User'}</h4>
            <p className="text-[10px] text-emerald-400 font-medium">{getStatusLabel()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleMinimize}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Maximize call"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={endCall}
            className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            title="End call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Fullscreen Call Overlay ────────────────────────────────────────────────
  return (
    <div
      id="active-call-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${isVideo ? 'Video' : 'Voice'} Call`}
      className="fixed inset-0 z-[120] flex flex-col bg-[#0B0D14] text-white overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Header Controls */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={toggleMinimize}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
          title="Minimize call"
          aria-label="Minimize call"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-white/90">
              Lalao {isVideo ? 'Video' : 'Voice'}
            </span>
          </div>
          <span className="text-[11px] font-medium text-emerald-400/90 tracking-wide mt-0.5">
            {getStatusLabel()}
          </span>
        </div>

        <div className="w-9" />
      </header>

      {/* Configuration or Media Alert Banner if needed */}
      {(!isAgoraConfigured || mediaError) && (
        <div className="relative z-20 mx-4 my-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="truncate">
            {mediaError || 'Agora App ID not configured. Real-time signaling active.'}
          </span>
        </div>
      )}

      {/* Main Call View Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {isVideo ? (
          /* ── VIDEO CALL VIEW ── */
          <div className="relative w-full h-full bg-[#05060A] flex items-center justify-center">
            {/* Primary Remote Video Stream */}
            <div
              ref={remoteVideoRef}
              id="remote-video-container"
              className="w-full h-full flex items-center justify-center object-cover"
            />

            {/* Placeholder if remote video track not active */}
            {(!remoteUser || !remoteUser.videoTrack) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e1017]">
                <Avatar
                  src={otherUser?.avatar || undefined}
                  alt={otherUser?.name || 'Participant'}
                  size="xl"
                  className="w-28 h-28 ring-4 ring-[#5E43F3]/30 shadow-2xl mb-4"
                />
                <h3 className="text-lg font-bold text-white">{otherUser?.name}</h3>
                <p className="text-xs text-white/50 mt-1">
                  {connectionState === 'connected' ? 'Remote camera is off' : getStatusLabel()}
                </p>
              </div>
            )}

            {/* Local Video Picture-in-Picture (PiP) Tile */}
            <div
              id="local-video-pip"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#161822] z-30"
            >
              <div
                ref={localVideoRef}
                id="local-video-container"
                className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}
              />
              {isCameraOff && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[#1b1e2e]">
                  <VideoOff className="w-6 h-6 text-white/40 mb-1" />
                  <span className="text-[10px] text-white/60">Camera Off</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── VOICE CALL VIEW ── */
          <div className="relative flex flex-col items-center justify-center p-6 text-center max-w-sm">
            {/* Subtle purple background pulse */}
            <div className="absolute w-64 h-64 bg-[#5E43F3]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Large Avatar with speaking halo */}
            <div className="relative mb-6">
              {connectionState === 'connected' && (
                <div className="absolute inset-0 rounded-full border-2 border-[#5E43F3]/40 animate-ping opacity-25" />
              )}
              <Avatar
                src={otherUser?.avatar || undefined}
                alt={otherUser?.name || 'Participant'}
                size="xl"
                className="w-32 h-32 ring-4 ring-[#5E43F3]/40 shadow-2xl"
              />
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-2xl font-black tracking-tight text-white">{otherUser?.name || 'User'}</h2>
              {otherUser?.verified && <VerificationBadge user={otherUser} size="sm" />}
            </div>
            <p className="text-sm text-white/50 mb-4">@{otherUser?.username || 'user'}</p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80">
              <span className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{getStatusLabel()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <footer className="relative z-20 flex items-center justify-center gap-4 sm:gap-6 px-4 py-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={`w-13 h-13 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Camera Toggle (Video Calls only) */}
        {isVideo && (
          <button
            type="button"
            onClick={toggleCamera}
            className={`w-13 h-13 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isCameraOff
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            aria-label={isCameraOff ? 'Camera on' : 'Camera off'}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Switch Camera (Video Calls only on mobile / multi-camera devices) */}
        {isVideo && (
          <button
            type="button"
            onClick={switchCamera}
            className="w-13 h-13 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer"
            title="Switch camera"
            aria-label="Switch camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        {/* Speaker Output Toggle */}
        <button
          type="button"
          onClick={toggleSpeaker}
          className={`w-13 h-13 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
            !isSpeakerOn
              ? 'bg-white/5 text-white/40 border border-white/5'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
          title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
          aria-label="Speaker"
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          id="btn-end-call"
          type="button"
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-xl shadow-rose-600/30 flex items-center justify-center transition-all cursor-pointer"
          title="End Call"
          aria-label="End Call"
        >
          <PhoneOff className="w-6 h-6 stroke-[2.2]" />
        </button>
      </footer>
    </div>
  );
};
