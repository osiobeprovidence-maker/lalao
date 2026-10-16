import React from 'react';
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
  Phone,
  PhoneMissed,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { AppIcon } from '../common/AppIcon';
import { getPublicIdentityLabel } from '../common/UserIdentity';

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
    hasRemoteVideo,
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

  // Callback refs for video container attachment upon mounting
  const localVideoCallbackRef = (node: HTMLDivElement | null) => {
    attachLocalVideo(node);
  };

  const remoteVideoCallbackRef = (node: HTMLDivElement | null) => {
    attachRemoteVideo(node);
  };

  // Don't show active modal while receiving incoming call (IncomingCallModal handles it)
  if (!activeCall || isIncomingCall) return null;

  const isVideo = activeCall.type === 'video';
  const otherUser = activeCall.otherUser || (activeCall.isCaller ? activeCall.recipient : activeCall.caller);
  const displayName = otherUser?.name || 'Lalao User';
  const username = otherUser?.username || 'user';
  const identityLabel = getPublicIdentityLabel(otherUser) || displayName;

  const isTerminalState = ['declined', 'canceled', 'completed', 'missed', 'failed'].includes(activeCall.status);

  const getStatusLabel = () => {
    if (activeCall.status === 'declined') return 'Call Declined';
    if (activeCall.status === 'canceled') return 'Call Canceled';
    if (activeCall.status === 'missed') return 'Call Missed';
    if (activeCall.status === 'completed') return `Call Ended · ${formattedDuration || '0:00'}`;
    if (activeCall.status === 'failed') return 'Call Failed';
    if (connectionState === 'ringing') return activeCall.isCaller ? 'Ringing...' : 'Incoming...';
    if (connectionState === 'connecting') return 'Connecting...';
    if (connectionState === 'reconnecting') return 'Reconnecting...';
    if (connectionState === 'connected') return formattedDuration || 'Connected';
    return 'Calling...';
  };

  // ── Minimized Floating Island Widget ───────────────────────────────────────
  if (isMinimized) {
    return (
      <div
        id="minimized-call-widget"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[130] w-72 rounded-2xl bg-theme-surface/95 dark:bg-[#12141F]/95 border border-theme-divider-light dark:border-white/10 p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <Avatar
              src={otherUser?.avatar || undefined}
              alt={displayName}
              size="sm"
              className="w-10 h-10 ring-2 ring-[#5E43F3]/50 shrink-0"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-black ${
                isTerminalState
                  ? 'bg-rose-500'
                  : connectionState === 'connected'
                  ? 'bg-emerald-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-theme-primary dark:text-white truncate">{identityLabel}</h4>
            <p
              className={`text-[10px] font-medium truncate ${
                isTerminalState
                  ? 'text-rose-500'
                  : connectionState === 'connected'
                  ? 'text-emerald-500 font-semibold'
                  : 'text-theme-tertiary dark:text-white/60'
              }`}
            >
              {getStatusLabel()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className={`p-1.5 rounded-full transition-colors ${
              isMuted
                ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400'
                : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={toggleMinimize}
            className="p-1.5 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            title="Maximize call"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={endCall}
            className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            title="End call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Responsive Call Screen Overlay ─────────────────────────────────────────
  return (
    <div
      id="active-call-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${isVideo ? 'Video' : 'Voice'} Call`}
      className="fixed inset-0 z-[120] flex flex-col bg-theme-base dark:bg-[#0A0C14] text-theme-primary dark:text-white overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/20 dark:from-black/60 to-transparent">
        {/* Minimize Button */}
        <button
          type="button"
          onClick={toggleMinimize}
          className="p-2 rounded-full bg-theme-surface-hover/80 dark:bg-white/10 hover:bg-theme-divider dark:hover:bg-white/20 active:scale-95 text-theme-primary dark:text-white transition-all cursor-pointer shadow-xs"
          title="Minimize to floating pill"
          aria-label="Minimize call"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* Lalao Brand & Call Info Header */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <AppIcon className="w-5 h-5 rounded-full overflow-hidden shadow-xs" />
            <span className="lalao-wordmark text-lg text-theme-primary dark:text-white">lalao</span>
            <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#5E43F3]/15 text-[#5E43F3] dark:text-[#A494FD]">
              {isVideo ? 'Video' : 'Voice'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span
              className={`text-xs font-semibold ${
                isTerminalState
                  ? 'text-rose-500'
                  : connectionState === 'connected'
                  ? 'text-emerald-500'
                  : 'text-amber-500 dark:text-amber-400'
              }`}
            >
              {getStatusLabel()}
            </span>
          </div>
        </div>

        {/* Empty placeholder for symmetrical balance */}
        <div className="w-9" />
      </header>

      {/* Media or Configuration Alert Banner */}
      {(!isAgoraConfigured || mediaError) && (
        <div className="relative z-20 mx-4 my-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 max-w-md self-center">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="truncate">
            {mediaError || 'Agora RTC configured. Waiting for media connection.'}
          </span>
        </div>
      )}

      {/* Main Call Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-4">
        {isVideo ? (
          /* ── VIDEO CALL VIEW ── */
          <div className="relative w-full max-w-4xl h-full max-h-[750px] rounded-3xl overflow-hidden bg-black flex items-center justify-center border border-theme-divider-light dark:border-white/10 shadow-2xl">
            {/* Primary Remote Video Stream */}
            <div
              ref={remoteVideoCallbackRef}
              id="remote-video-container"
              className="w-full h-full flex items-center justify-center object-cover"
            />

            {/* Placeholder when remote camera is inactive / connecting */}
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#121420] to-[#0A0C14] p-6 text-center">
                <div className="relative mb-4">
                  {connectionState === 'connected' && (
                    <div className="absolute inset-0 rounded-full border-2 border-[#5E43F3]/40 animate-ping opacity-25" />
                  )}
                  <Avatar
                    src={otherUser?.avatar || undefined}
                    alt={displayName}
                    size="xl"
                    className="w-28 h-28 ring-4 ring-[#5E43F3]/40 shadow-2xl"
                  />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="text-xl font-bold text-white">{identityLabel}</h3>
                  {otherUser?.verified && <VerificationBadge user={otherUser} size="xs" />}
                </div>
                <p className="text-xs text-white/50">@{username}</p>
                <div className="mt-3 px-3 py-1 rounded-full bg-white/10 text-xs text-white/80">
                  {isTerminalState
                    ? getStatusLabel()
                    : connectionState === 'connected'
                    ? 'Remote camera is off'
                    : getStatusLabel()}
                </div>
              </div>
            )}

            {/* Local Video Picture-in-Picture (PiP) Tile */}
            <div
              id="local-video-pip"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#161822] z-30"
            >
              <div
                ref={localVideoCallbackRef}
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
          <div className="relative flex flex-col items-center justify-center p-6 text-center max-w-md w-full">
            {/* Ambient purple aura pulse */}
            <div className="absolute w-72 h-72 bg-[#5E43F3]/15 dark:bg-[#5E43F3]/25 rounded-full blur-3xl pointer-events-none" />

            {/* Profile Avatar Card */}
            <div className="relative z-10 w-full rounded-3xl bg-theme-surface/80 dark:bg-[#12141F]/80 border border-theme-divider-light dark:border-white/10 p-8 shadow-xl backdrop-blur-xl flex flex-col items-center">
              {/* Speaking audio halo */}
              <div className="relative mb-6">
                {connectionState === 'connected' && (
                  <div className="absolute inset-0 rounded-full border-2 border-[#5E43F3]/50 animate-ping opacity-30" />
                )}
                <Avatar
                  src={otherUser?.avatar || undefined}
                  alt={displayName}
                  size="xl"
                  className="w-32 h-32 ring-4 ring-[#5E43F3]/40 shadow-2xl"
                />
              </div>

              {/* Identity Header */}
              <div className="flex items-center gap-1.5 mb-1 max-w-full px-2">
                <h2 className="text-2xl font-black tracking-tight text-theme-primary dark:text-white truncate">
                  {identityLabel}
                </h2>
                {otherUser?.verified && <VerificationBadge user={otherUser} size="sm" />}
              </div>
              <p className="text-sm text-theme-tertiary dark:text-white/60 mb-5">@{username}</p>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-theme-base dark:bg-white/5 border border-theme-divider-light dark:border-white/10 text-xs font-semibold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isTerminalState
                      ? 'bg-rose-500'
                      : connectionState === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className={isTerminalState ? 'text-rose-500' : 'text-theme-primary dark:text-white'}>
                  {getStatusLabel()}
                </span>
              </div>

              {/* Animated Soundwave Visualizer (Active during connection) */}
              {connectionState === 'connected' && !isTerminalState && (
                <div className="flex items-center gap-1 mt-6 h-8">
                  {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((height, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-[#5E43F3] animate-pulse"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${(i * 120) % 1000}ms`,
                        animationDuration: '900ms',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <footer className="relative z-20 flex items-center justify-center gap-4 sm:gap-6 px-4 py-6 bg-gradient-to-t from-black/20 dark:from-black/60 to-transparent">
        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={toggleMute}
          disabled={isTerminalState}
          className={`w-13 h-13 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md ${
            isMuted
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-500 dark:text-rose-400'
              : 'bg-theme-surface dark:bg-white/10 hover:bg-theme-surface-hover dark:hover:bg-white/20 text-theme-primary dark:text-white border border-theme-divider dark:border-white/10'
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
            disabled={isTerminalState}
            className={`w-13 h-13 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md ${
              isCameraOff
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-500 dark:text-rose-400'
                : 'bg-theme-surface dark:bg-white/10 hover:bg-theme-surface-hover dark:hover:bg-white/20 text-theme-primary dark:text-white border border-theme-divider dark:border-white/10'
            }`}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            aria-label={isCameraOff ? 'Camera on' : 'Camera off'}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Switch Camera (Video Calls only) */}
        {isVideo && (
          <button
            type="button"
            onClick={switchCamera}
            disabled={isTerminalState}
            className="w-13 h-13 rounded-full bg-theme-surface dark:bg-white/10 hover:bg-theme-surface-hover dark:hover:bg-white/20 active:scale-95 text-theme-primary dark:text-white border border-theme-divider dark:border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-md"
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
          disabled={isTerminalState}
          className={`w-13 h-13 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md ${
            !isSpeakerOn
              ? 'bg-theme-surface dark:bg-white/5 text-theme-tertiary dark:text-white/40 border border-theme-divider dark:border-white/5'
              : 'bg-theme-surface dark:bg-white/10 hover:bg-theme-surface-hover dark:hover:bg-white/20 text-theme-primary dark:text-white border border-theme-divider dark:border-white/10'
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
