import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Phone,
  Mic,
  Smile,
  X,
  Check,
  CheckCheck,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { DirectMessage } from '../../types';

// Read receipt indicator component for visual message delivery & read feedback
export const MessageReceiptIndicator: React.FC<{
  status?: DirectMessage['status'];
  className?: string;
  theme?: 'dark-bubble' | 'light-bg';
}> = ({ status = 'read', className = '', theme = 'dark-bubble' }) => {
  if (status === 'sending') {
    return (
      <span
        className={`inline-flex items-center ${
          theme === 'dark-bubble' ? 'text-indigo-200/70' : 'text-neutral-400'
        } ${className}`}
        title="Sending..."
      >
        <Check className="w-3 h-3 stroke-[2] opacity-60" />
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span
        className={`inline-flex items-center ${
          theme === 'dark-bubble' ? 'text-indigo-200/90' : 'text-neutral-400'
        } ${className}`}
        title="Sent"
      >
        <Check className="w-3 h-3 stroke-[2.4]" />
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span
        className={`inline-flex items-center ${
          theme === 'dark-bubble' ? 'text-indigo-200' : 'text-neutral-400'
        } ${className}`}
        title="Delivered"
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2.4]" />
      </span>
    );
  }

  // 'read' / seen status -> distinct sky blue double checkmarks
  return (
    <span
      className={`inline-flex items-center ${
        theme === 'dark-bubble' ? 'text-sky-300' : 'text-[#0095F6]'
      } ${className}`}
      title="Read / Seen"
    >
      <CheckCheck className="w-3.5 h-3.5 stroke-[2.6]" />
    </span>
  );
};

// Instagram Verified Badge
const VerifiedBadge: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full bg-[#0095F6] text-white shrink-0 shadow-2xs ${
      size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
    }`}
    title="Verified"
    aria-label="Verified account"
  >
    <Check className={size === 'md' ? 'w-3 h-3 stroke-[3.5]' : 'w-2.5 h-2.5 stroke-[3.5]'} />
  </span>
);

function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
    return formatted + 'K';
  }
  return num.toString();
}

// 4 Inspo Stickers
interface StickerItem {
  id: string;
  name: string;
  render: () => React.ReactNode;
}

const STICKERS: StickerItem[] = [
  {
    id: 'sticker_swoosh',
    name: 'Wavy Eye',
    render: () => (
      <svg viewBox="0 0 100 70" className="w-16 h-12 object-contain filter drop-shadow-xs">
        <path
          d="M10 45 C 15 25, 30 15, 60 18 C 85 20, 95 35, 90 48 C 85 58, 65 60, 45 58 C 25 56, 12 52, 10 45 Z"
          fill="#FFD214"
          stroke="#1E1E1E"
          strokeWidth="3.5"
        />
        <path d="M40 32 Q 55 23 70 34" fill="none" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="48" cy="38" rx="6" ry="7" fill="#1E1E1E" />
        <ellipse cx="68" cy="40" rx="5" ry="6" fill="#1E1E1E" />
        <circle cx="50" cy="36" r="2" fill="#FFFFFF" />
        <circle cx="70" cy="38" r="1.8" fill="#FFFFFF" />
        <path d="M25 48 C 35 52, 50 52, 60 48" fill="none" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'sticker_truck',
    name: 'Flower Truck',
    render: () => (
      <svg viewBox="0 0 100 85" className="w-16 h-14 object-contain filter drop-shadow-xs">
        {/* Pink blossoms & hearts */}
        <circle cx="52" cy="22" r="11" fill="#FF80B5" />
        <circle cx="68" cy="25" r="10" fill="#FF6584" />
        <circle cx="58" cy="32" r="12" fill="#FFA3C8" />
        <circle cx="42" cy="28" r="9" fill="#FF85A2" />
        <path
          d="M60 12 C 60 8, 65 6, 68 9 C 71 6, 76 8, 76 12 C 76 18, 68 22, 68 22 C 68 22, 60 18, 60 12 Z"
          fill="#FF2E93"
        />
        {/* Purple truck body */}
        <path
          d="M22 48 L 45 48 L 52 35 L 75 35 L 85 48 L 88 56 L 18 56 Z"
          fill="#7E57C2"
          stroke="#4A148C"
          strokeWidth="3"
        />
        {/* Cab window */}
        <polygon points="54,37 72,37 80,48 54,48" fill="#E1BEE7" />
        {/* Wheels */}
        <circle cx="34" cy="62" r="9" fill="#FFD54F" stroke="#3E2723" strokeWidth="3" />
        <circle cx="34" cy="62" r="4" fill="#3E2723" />
        <circle cx="74" cy="62" r="9" fill="#FFD54F" stroke="#3E2723" strokeWidth="3" />
        <circle cx="74" cy="62" r="4" fill="#3E2723" />
      </svg>
    ),
  },
  {
    id: 'sticker_hoodie',
    name: 'Hooded Smile',
    render: () => (
      <svg viewBox="0 0 90 90" className="w-14 h-14 object-contain filter drop-shadow-xs">
        {/* Purple hood */}
        <path
          d="M20 75 C 15 45, 25 15, 45 15 C 65 15, 75 45, 70 75 Z"
          fill="#8E24AA"
          stroke="#4A148C"
          strokeWidth="3.5"
        />
        {/* Yellow face inside hood */}
        <ellipse cx="48" cy="52" rx="18" ry="16" fill="#FFF176" stroke="#4A148C" strokeWidth="2.5" />
        {/* Big cute eyes */}
        <ellipse cx="44" cy="48" rx="3.5" ry="4.5" fill="#212121" />
        <circle cx="45" cy="46" r="1.2" fill="#FFFFFF" />
        <ellipse cx="56" cy="49" rx="3" ry="4" fill="#212121" />
        <circle cx="57" cy="47" r="1" fill="#FFFFFF" />
        {/* Cheerful mouth */}
        <path d="M46 56 Q 50 60 54 56" fill="none" stroke="#212121" strokeWidth="2" strokeLinecap="round" />
        {/* Orange collar / bow */}
        <polygon points="38,70 58,70 52,78 44,78" fill="#FF9800" stroke="#E65100" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'sticker_star',
    name: 'Chubby Star',
    render: () => (
      <svg viewBox="0 0 90 90" className="w-14 h-14 object-contain filter drop-shadow-xs">
        {/* Golden chubby star character */}
        <path
          d="M45 10 C 48 24, 60 22, 70 28 C 78 33, 72 48, 80 58 C 85 66, 75 75, 65 76 C 56 77, 52 84, 45 84 C 38 84, 34 77, 25 76 C 15 75, 5 66, 10 58 C 18 48, 12 33, 20 28 C 30 22, 42 24, 45 10 Z"
          fill="#FFCA28"
          stroke="#D79A00"
          strokeWidth="3.5"
        />
        {/* Cute little black ears/horns */}
        <polygon points="35,16 39,24 33,26" fill="#212121" />
        <polygon points="55,16 51,24 57,26" fill="#212121" />
        {/* Leg division */}
        <path d="M45 68 L 45 80" stroke="#D79A00" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const ChatModal: React.FC = () => {
  const {
    activeChatId,
    setActiveChatId,
    conversations,
    sendDirectMessage,
    triggerShareToast,
    permissions,
    setActivePermissionPrompt,
    setActiveUserProfile,
    currentUser,
    setGlobalTab,
    markConversationRead,
  } = useLalao();

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showStickerTray, setShowStickerTray] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeChatId) {
      markConversationRead(activeChatId);
    }
  }, [activeChatId]);

  const conv = conversations.find((c) => c.id === activeChatId);

  // Auto-scroll to bottom on conversation change or new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeChatId, conv?.messages?.length]);

  if (!activeChatId || !conv) return null;

  const isVerified = conv.participant.isVerified ?? (conv.participant.badge !== undefined);
  const followersStr = formatCount(conv.participant.followersCount || 1200);
  const postsStr = formatCount(conv.participant.postsCount || 15000);
  const mutualFollowStr = conv.participant.mutualInfo || 'You both follow instablog9ja';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendDirectMessage(conv.id, inputMessage.trim());
    setInputMessage('');
  };

  const handleSendSticker = (sticker: StickerItem) => {
    sendDirectMessage(conv.id, `Sent ${sticker.name}`, sticker.id);
    triggerShareToast(`Sent sticker to ${conv.participant.name}`);
  };

  const handleMicClick = () => {
    if (permissions.microphone !== 'granted') {
      setActivePermissionPrompt('microphone');
      return;
    }
    setIsRecording(!isRecording);
    if (!isRecording) {
      triggerShareToast('Recording voice note...');
      setTimeout(() => {
        setIsRecording(false);
        sendDirectMessage(conv.id, '🎙️ Voice note (0:08)');
        triggerShareToast('Voice note sent!');
      }, 2500);
    }
  };

  const handleViewCommunity = () => {
    setActiveUserProfile(conv.participant);
    setActiveChatId(null);
  };

  return (
    <div
      id="chat-screen"
      className="w-full min-h-screen bg-[#f6f3ee] flex justify-center overflow-hidden animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[960px] min-h-screen bg-[#f6f3ee] flex flex-col border-x border-neutral-200/80">
        <header className="shrink-0 border-b border-neutral-200/80 bg-[#f6f3ee]/95 backdrop-blur-md px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                id="btn-chat-back"
                type="button"
                onClick={() => setActiveChatId(null)}
                className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
                aria-label="Back to messages"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={handleViewCommunity}
                className="flex min-w-0 items-center gap-2.5 text-left cursor-pointer"
                title="View profile"
              >
                <div className="shrink-0">
                  <Avatar
                    src={conv.participant.avatar || undefined}
                    alt={conv.participant.name}
                    size="sm"
                    className="w-9 h-9"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-neutral-950">
                      {conv.participant.name}
                    </span>
                    {isVerified && <VerifiedBadge />}
                  </div>
                  <span className="block truncate text-[11px] text-neutral-500">
                    @{conv.participant.username}
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => triggerShareToast('Voice calls coming in v0.2')}
                className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
                title="Voice call"
                aria-label="Voice call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
                title="More actions"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 bg-[#f6f3ee] min-h-0"
        >
          <div className="rounded-2xl border border-neutral-200/80 bg-white/70 px-3 py-2 text-center shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {conv.participant.name}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {followersStr} followers · {postsStr} posts · {mutualFollowStr}
            </p>
          </div>

          {conv.messages.map((msg: DirectMessage) => {
            if (msg.isSticker && msg.stickerId) {
              const matchedSticker = STICKERS.find((s) => s.id === msg.stickerId);
              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`flex items-end gap-2 ${
                    msg.isMine ? 'justify-end' : 'justify-start'
                  } animate-in zoom-in-95 duration-150`}
                >
                  <div className="flex flex-col items-end">
                    <div className="p-2 hover:scale-105 transition-transform">
                      {matchedSticker ? matchedSticker.render() : <Sparkles className="w-12 h-12 text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 pr-2 select-none">
                      <span className="text-[10px] text-neutral-400">
                        {msg.timestamp}
                      </span>
                      {msg.isMine && (
                        <MessageReceiptIndicator
                          status={msg.status || 'read'}
                          theme="light-bg"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                className={`flex items-end gap-2 ${
                  msg.isMine ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
                    msg.isMine
                      ? 'bg-[#5E43F3] text-white rounded-br-xs'
                      : 'bg-neutral-100 text-neutral-900 rounded-bl-xs'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1.5 mt-1 select-none ${
                      msg.isMine ? 'text-indigo-200' : 'text-neutral-400'
                    }`}
                  >
                    <span className="text-[10px] tracking-tight">
                      {msg.timestamp}
                    </span>
                    {msg.isMine && (
                      <MessageReceiptIndicator
                        status={msg.status || 'read'}
                        theme="dark-bubble"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticker Tray: "Say hello by sending a sticker" (matches screenshot) */}
        {showStickerTray && (
          <div
            id="sticker-tray"
            className="border-t border-neutral-200/80 bg-[#f7f4f0] px-4 pt-3 pb-2 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="mb-3 flex items-center justify-between text-neutral-500">
              <span className="text-xs font-semibold text-neutral-600">
                Say hello by sending a sticker
              </span>
              <button
                type="button"
                onClick={() => setShowStickerTray(false)}
                className="p-1 -mr-1 rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition-colors cursor-pointer"
                title="Dismiss sticker tray"
                aria-label="Dismiss stickers"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="flex items-center justify-around gap-2 px-1 py-1">
              {STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => handleSendSticker(stk)}
                  className="flex items-center justify-center rounded-xl p-1 transition-transform hover:bg-white active:scale-110 cursor-pointer"
                  title={`Send ${stk.name} sticker`}
                >
                  {stk.render()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-neutral-200/80 bg-[#f7f4f0] p-3 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-direct-message"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message"
                className="w-full rounded-full border border-neutral-200 bg-white pl-4 pr-16 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 outline-none transition-all focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/15"
                autoFocus
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-400">
                {!showStickerTray && (
                  <button
                    type="button"
                    onClick={() => setShowStickerTray(true)}
                    className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                    title="Show stickers"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`rounded-full p-1.5 transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                  }`}
                  title="Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              id="btn-send-message"
              type="submit"
              disabled={!inputMessage.trim()}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                inputMessage.trim()
                  ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] active:scale-95 shadow-md shadow-[#5E43F3]/20'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mx-auto mt-2.5 h-1 w-24 rounded-full bg-neutral-300" />
        </div>
      </div>
    </div>
  );
};
