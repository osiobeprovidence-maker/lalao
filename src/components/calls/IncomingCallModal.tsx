import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';

export const IncomingCallModal: React.FC = () => {
  const { isIncomingCall, activeCall, acceptCall, declineCall } = useCall();

  if (!isIncomingCall || !activeCall) return null;

  const otherUser = activeCall.otherUser || activeCall.caller;
  const isVideo = activeCall.type === 'video';

  return (
    <div
      id="incoming-call-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Incoming Call"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-[#12141D] border border-white/10 p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center overflow-hidden">
        {/* Pulsing purple ambient aura */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#5E43F3]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Call type badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5E43F3]/15 border border-[#5E43F3]/30 text-[#8E79FC] text-xs font-semibold mb-6">
          {isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          <span>Incoming {isVideo ? 'Video' : 'Voice'} Call</span>
        </div>

        {/* Caller Avatar with animated pulsing rings */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full border-2 border-[#5E43F3]/30 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full border border-[#5E43F3]/40 animate-pulse" />
          <Avatar
            src={otherUser?.avatar || undefined}
            alt={otherUser?.name || 'Caller'}
            size="xl"
            className="w-20 h-20 ring-4 ring-[#5E43F3]/40 shadow-xl"
          />
        </div>

        {/* Caller Name and Username */}
        <div className="mb-2 flex items-center justify-center gap-1.5 max-w-full px-2">
          <h2 className="text-xl font-bold text-white truncate">{otherUser?.name || 'Lalao User'}</h2>
          {otherUser?.verified && <VerificationBadge user={otherUser} size="xs" />}
        </div>
        <p className="text-xs text-white/50 mb-8">@{otherUser?.username || 'user'}</p>

        {/* Action Buttons: Decline & Accept */}
        <div className="flex items-center justify-center gap-8 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              id="btn-decline-call"
              type="button"
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              title="Decline"
              aria-label="Decline call"
            >
              <PhoneOff className="w-6 h-6 stroke-[2.2]" />
            </button>
            <span className="text-[11px] font-medium text-white/60">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              id="btn-accept-call"
              type="button"
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all cursor-pointer animate-bounce"
              title="Accept"
              aria-label="Accept call"
            >
              {isVideo ? <Video className="w-6 h-6 stroke-[2.2]" /> : <Phone className="w-6 h-6 stroke-[2.2]" />}
            </button>
            <span className="text-[11px] font-medium text-emerald-400">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
