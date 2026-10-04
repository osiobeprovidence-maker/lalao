import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Camera,
  Image as ImageIcon,
  Play,
  Pause,
  Trash2,
  Square,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { DirectMessage } from '../../types';

// ─── Receipt Indicator ──────────────────────────────────────────────────────

export const MessageReceiptIndicator: React.FC<{
  status?: DirectMessage['status'];
  className?: string;
  theme?: 'dark-bubble' | 'light-bg';
}> = ({ status = 'read', className = '', theme = 'dark-bubble' }) => {
  if (status === 'sending') {
    return (
      <span
        className={`inline-flex items-center ${
          theme === 'dark-bubble' ? 'text-indigo-200/70' : 'text-theme-tertiary'
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
          theme === 'dark-bubble' ? 'text-indigo-200/90' : 'text-theme-tertiary'
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
          theme === 'dark-bubble' ? 'text-indigo-200' : 'text-theme-tertiary'
        } ${className}`}
        title="Delivered"
      >
        <CheckCheck className="w-3.5 h-3.5 stroke-[2.4]" />
      </span>
    );
  }
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDur(secs: number): string {
  if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getBestMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

// ─── Stickers ────────────────────────────────────────────────────────────────

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
          fill="#FFD214" stroke="#1E1E1E" strokeWidth="3.5"
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
        <circle cx="52" cy="22" r="11" fill="#FF80B5" />
        <circle cx="68" cy="25" r="10" fill="#FF6584" />
        <circle cx="58" cy="32" r="12" fill="#FFA3C8" />
        <circle cx="42" cy="28" r="9" fill="#FF85A2" />
        <path d="M60 12 C 60 8, 65 6, 68 9 C 71 6, 76 8, 76 12 C 76 18, 68 22, 68 22 C 68 22, 60 18, 60 12 Z" fill="#FF2E93" />
        <path d="M22 48 L 45 48 L 52 35 L 75 35 L 85 48 L 88 56 L 18 56 Z" fill="#7E57C2" stroke="#4A148C" strokeWidth="3" />
        <polygon points="54,37 72,37 80,48 54,48" fill="#E1BEE7" />
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
        <path d="M20 75 C 15 45, 25 15, 45 15 C 65 15, 75 45, 70 75 Z" fill="#8E24AA" stroke="#4A148C" strokeWidth="3.5" />
        <ellipse cx="48" cy="52" rx="18" ry="16" fill="#FFF176" stroke="#4A148C" strokeWidth="2.5" />
        <ellipse cx="44" cy="48" rx="3.5" ry="4.5" fill="#212121" />
        <circle cx="45" cy="46" r="1.2" fill="#FFFFFF" />
        <ellipse cx="56" cy="49" rx="3" ry="4" fill="#212121" />
        <circle cx="57" cy="47" r="1" fill="#FFFFFF" />
        <path d="M46 56 Q 50 60 54 56" fill="none" stroke="#212121" strokeWidth="2" strokeLinecap="round" />
        <polygon points="38,70 58,70 52,78 44,78" fill="#FF9800" stroke="#E65100" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'sticker_star',
    name: 'Chubby Star',
    render: () => (
      <svg viewBox="0 0 90 90" className="w-14 h-14 object-contain filter drop-shadow-xs">
        <path
          d="M45 10 C 48 24, 60 22, 70 28 C 78 33, 72 48, 80 58 C 85 66, 75 75, 65 76 C 56 77, 52 84, 45 84 C 38 84, 34 77, 25 76 C 15 75, 5 66, 10 58 C 18 48, 12 33, 20 28 C 30 22, 42 24, 45 10 Z"
          fill="#FFCA28" stroke="#D79A00" strokeWidth="3.5"
        />
        <polygon points="35,16 39,24 33,26" fill="#212121" />
        <polygon points="55,16 51,24 57,26" fill="#212121" />
        <path d="M45 68 L 45 80" stroke="#D79A00" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ─── Live Waveform (during recording) ────────────────────────────────────────

const LiveWaveform: React.FC<{ analyser: AnalyserNode | null; barCount?: number; color?: string }> = ({
  analyser,
  barCount = 40,
  color = '#f43f5e',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArr = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArr);

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barW = W / barCount - 1.5;
      const step = Math.floor(dataArr.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArr[i * step] / 255;
        const barH = Math.max(3, value * H);
        const x = i * (barW + 1.5);
        const y = (H - barH) / 2;

        ctx.fillStyle = color;
        const radius = Math.min(barW / 2, barH / 2, 3);
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, radius);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, barCount, color]);

  return <canvas ref={canvasRef} width={240} height={36} className="w-full h-9" />;
};

// ─── Static Waveform bars (for preview/playback) ──────────────────────────────

const StaticWaveform: React.FC<{
  bars: number[];
  progress: number; // 0–1
  onSeek?: (ratio: number) => void;
  activeColor?: string;
  inactiveColor?: string;
}> = ({ bars, progress, onSeek, activeColor = '#ffffff', inactiveColor = 'rgba(255,255,255,0.3)' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!onSeek || !containerRef.current) return;
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-[2px] cursor-pointer select-none flex-1"
      style={{ height: 28 }}
      onClick={handleClick}
    >
      {bars.map((h, i) => {
        const ratio = (i + 1) / bars.length;
        const active = ratio <= progress;
        return (
          <div
            key={i}
            style={{
              width: 3,
              height: `${Math.max(15, h)}%`,
              backgroundColor: active ? activeColor : inactiveColor,
              borderRadius: 2,
              transition: 'height 0.05s',
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Audio Player (in chat message) ──────────────────────────────────────────

export const CustomAudioPlayer = ({
  url,
  duration,
  isMine,
  waveformBars,
}: {
  url: string;
  duration?: number;
  isMine?: boolean;
  waveformBars?: number[];
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [realDuration, setRealDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bars = waveformBars || Array.from({ length: 30 }, (_, i) => 30 + Math.abs(Math.sin(i * 0.7)) * 60);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };
    const onDurationChange = () => { if (audio.duration && isFinite(audio.duration)) setRealDuration(audio.duration); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.pause();
      audio.src = '';
    };
  }, [url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.warn);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (ratio: number) => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (!dur || !isFinite(dur)) return;
    audioRef.current.currentTime = ratio * dur;
    setProgress(ratio);
  };

  const displayTime = isPlaying ? currentTime : realDuration;

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-[240px] ${
      isMine ? 'bg-black text-white dark:bg-[#0a0a0a]' : 'bg-[#5E43F3] text-white'
    }`}>
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors shrink-0"
      >
        {isPlaying
          ? <Pause className="w-3.5 h-3.5" />
          : <Play className="w-3.5 h-3.5 ml-0.5" />
        }
      </button>

      <StaticWaveform
        bars={bars}
        progress={progress}
        onSeek={handleSeek}
        activeColor="#ffffff"
        inactiveColor="rgba(255,255,255,0.28)"
      />

      <span className="text-[10px] font-mono opacity-75 shrink-0 min-w-[30px] text-right">
        {formatDur(displayTime)}
      </span>
    </div>
  );
};

// ─── Voice Recording State Machine ───────────────────────────────────────────

type VoiceState = 'idle' | 'recording' | 'preview' | 'playing' | 'paused' | 'sending';

// ─── Helpers for Timestamps ───────────────────────────────────────────────

function formatMessageTime(createdAt: number): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateSeparator(createdAt: number): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeString = formatMessageTime(createdAt);

  if (isToday) return timeString;
  if (isYesterday) return `Yesterday · ${timeString}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${timeString}`;
}

// ─── ChatModal ────────────────────────────────────────────────────────────────

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
    markConversationRead,
    editMessage,
    deleteMessage,
  } = useLalao();

  // Text / editing state
  const [inputMessage, setInputMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string } | null>(null);
  const [editingMsg, setEditingMsg] = useState<{ id: string; text: string } | null>(null);
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);

  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [activeViewOnceMedia, setActiveViewOnceMedia] = useState<{ id: string, url: string, type: 'image' | 'video' | 'voice', duration?: number } | null>(null);
  const generateUploadUrl = useMutation(api.social.generateUploadUrl);
  const markViewOnceOpenedMutation = useMutation(api.social.markViewOnceOpened);

  // Voice recording state machine
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewBars, setPreviewBars] = useState<number[]>([]);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

  // Refs for preview playback
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesRef = useRef<DirectMessage[]>([]);

  const conv = conversations.find((c) => c.id === activeChatId);

  useEffect(() => {
    if (activeChatId) markConversationRead(activeChatId);
  }, [activeChatId, conv?.messages?.length]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeChatId, conv?.messages?.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMic();
      cleanupPreview();
    };
  }, []);

  // Notification sound for incoming messages
  useEffect(() => {
    if (!conv) return;
    const prevCount = prevMessagesRef.current.length;
    const currentCount = conv.messages.length;
    if (currentCount > prevCount && prevCount > 0) {
      const newMessages = conv.messages.slice(prevCount);
      if (newMessages.some((m) => !m.isMine)) playNotificationSound();
    }
    prevMessagesRef.current = conv.messages;
  }, [conv?.messages]);

  if (!activeChatId || !conv) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function playNotificationSound() {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }

  function stopMic() {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (analyserRef.current) { try { analyserRef.current.disconnect(); } catch (_) {} analyserRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (_) {} audioCtxRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setAnalyserNode(null);
  }

  function cleanupPreview() {
    if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
      previewAudioRef.current = null;
    }
    if (previewUrl) { URL.revokeObjectURL(previewUrl); }
  }

  // Capture waveform snapshot from analyser for preview bars
  function snapshotWaveformBars(analyser: AnalyserNode): number[] {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const N = 32;
    const step = Math.floor(data.length / N);
    return Array.from({ length: N }, (_, i) => {
      const v = data[i * step] / 255;
      return Math.max(15, v * 90);
    });
  }

  // ── Recording ─────────────────────────────────────────────────────────────

  async function startRecording() {
    setMicError(null);
    chunksRef.current = [];
    durationRef.current = 0;
    setRecordingDuration(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow mic access in your browser settings.'
        : 'Could not access microphone. Please check your device settings.';
      setMicError(msg);
      return;
    }

    streamRef.current = stream;

    // Set up analyser for live waveform
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AC();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
    } catch (_) {}

    const mimeType = getBestMimeType();
    const recorderOpts = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(stream, recorderOpts);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      stopMic();

      const mType = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mType });
      const url = URL.createObjectURL(blob);

      // Capture final waveform bars (will be a bit stale but acceptable)
      const bars = analyserRef.current
        ? snapshotWaveformBars(analyserRef.current)
        : Array.from({ length: 32 }, (_, i) => 20 + Math.abs(Math.sin(i * 0.5)) * 60);

      setPreviewBlob(blob);
      setPreviewUrl(url);
      setPreviewDuration(durationRef.current);
      setPreviewBars(bars);
      setPlaybackProgress(0);
      setVoiceState('preview');
    };

    // Start with 250ms timeslice — data arrives every 250ms.
    // This is the critical fix: without timeslice, data only arrives on stop(),
    // making browsers that background-pause the recorder lose all audio.
    recorder.start(250);

    setVoiceState('recording');

    recordingTimerRef.current = setInterval(() => {
      durationRef.current += 1;
      setRecordingDuration((p) => p + 1);
    }, 1000);
  }

  function stopRecording() {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      stopMic();
      setVoiceState('idle');
    }
  }

  function cancelRecording() {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    const recorder = mediaRecorderRef.current;
    // Override onstop so it doesn't transition to preview
    if (recorder) {
      recorder.onstop = () => { stopMic(); };
      if (recorder.state !== 'inactive') recorder.stop();
      else stopMic();
    } else {
      stopMic();
    }
    chunksRef.current = [];
    setRecordingDuration(0);
    durationRef.current = 0;
    setVoiceState('idle');
  }

  // ── Preview playback ──────────────────────────────────────────────────────

  function playPreview() {
    if (!previewUrl) return;
    const audio = new Audio(previewUrl);
    previewAudioRef.current = audio;

    audio.onended = () => {
      setVoiceState('preview');
      setPlaybackProgress(0);
      if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
      if (previewAudioRef.current) { previewAudioRef.current = null; }
    };

    audio.play().catch(console.warn);
    setVoiceState('playing');

    previewTimerRef.current = setInterval(() => {
      if (!previewAudioRef.current) return;
      const dur = previewAudioRef.current.duration;
      const t = previewAudioRef.current.currentTime;
      if (dur && isFinite(dur)) setPlaybackProgress(t / dur);
    }, 100);
  }

  function pausePreview() {
    if (previewAudioRef.current) previewAudioRef.current.pause();
    if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
    setVoiceState('paused');
  }

  function resumePreview() {
    if (previewAudioRef.current) {
      previewAudioRef.current.play().catch(console.warn);
      setVoiceState('playing');
      previewTimerRef.current = setInterval(() => {
        if (!previewAudioRef.current) return;
        const dur = previewAudioRef.current.duration;
        const t = previewAudioRef.current.currentTime;
        if (dur && isFinite(dur)) setPlaybackProgress(t / dur);
      }, 100);
    }
  }

  function seekPreview(ratio: number) {
    if (!previewAudioRef.current) return;
    const dur = previewAudioRef.current.duration;
    if (!dur || !isFinite(dur)) return;
    previewAudioRef.current.currentTime = ratio * dur;
    setPlaybackProgress(ratio);
  }

  function discardPreview() {
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null; }
    if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
    if (previewUrl) { URL.revokeObjectURL(previewUrl); }
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewDuration(0);
    setPreviewBars([]);
    setPlaybackProgress(0);
    setVoiceState('idle');
    setIsViewOnce(false);
  }

  // ── Send voice note ───────────────────────────────────────────────────────

  async function sendVoiceNote() {
    if (!previewBlob || voiceState === 'sending') return;

    // Stop preview playback
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null; }
    if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }

    setVoiceState('sending');

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': previewBlob.type || 'audio/webm' },
        body: previewBlob,
      });
      if (!result.ok) throw new Error(`Upload failed: ${result.status}`);
      const { storageId } = await result.json();

      sendDirectMessage(
        conv.id,
        '🎙️ Voice note',
        undefined,
        replyingTo?.id,
        storageId,
        previewDuration || 1,
        { viewOnce: isViewOnce }
      );

      // Clean up
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewBlob(null);
      setPreviewUrl(null);
      setPreviewDuration(0);
      setPreviewBars([]);
      setPlaybackProgress(0);
      setReplyingTo(null);
      setVoiceState('idle');
      setIsViewOnce(false);
    } catch (err) {
      console.error('Failed to upload voice note', err);
      triggerShareToast('Failed to send voice note. Please try again.');
      setVoiceState('preview');
    }
  }

  // ── Mic button handler ───────────────────────────────────────────────────

  const handleMicClick = async () => {
    if (voiceState === 'recording') {
      stopRecording();
      return;
    }
    if (voiceState !== 'idle') return;

    if (permissions.microphone !== 'granted') {
      setActivePermissionPrompt('microphone');
      return;
    }
    await startRecording();
  };

  // ── Text send ────────────────────────────────────────────────────────────

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    if (editingMsg) {
      editMessage(editingMsg.id, inputMessage.trim());
      setEditingMsg(null);
    } else {
      sendDirectMessage(conv.id, inputMessage.trim(), undefined, replyingTo?.id);
      setReplyingTo(null);
    }
    setInputMessage('');
  };

  const handleSendSticker = (sticker: StickerItem) => {
    sendDirectMessage(conv.id, `Sent ${sticker.name}`, sticker.id);
    triggerShareToast(`Sent sticker to ${conv.participant.name}`);
  };

  const handleViewCommunity = () => {
    setActiveUserProfile(conv.participant);
    setActiveChatId(null);
  };

  // ── Media handling ───────────────────────────────────────────────────────

  const handleOpenViewOnce = (msg: DirectMessage) => {
    if (msg.isMine || msg.viewOnceOpened) return;
    
    markViewOnceOpenedMutation({ messageId: msg.id as any }).catch(console.error);
    
    if (msg.audioUrl) {
      setActiveViewOnceMedia({ id: msg.id, url: msg.audioUrl, type: 'voice', duration: msg.audioDuration });
    } else if (msg.mediaUrl) {
      setActiveViewOnceMedia({ id: msg.id, url: msg.mediaUrl, type: (msg.type as 'image'|'video') || 'image' });
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      triggerShareToast('Unsupported file type');
      return;
    }
    
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
  };
  
  const cancelMediaPreview = () => {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaType(null);
    setInputMessage('');
    setIsViewOnce(false);
  };
  
  const handleSendMedia = async () => {
    if (!mediaFile || !activeChatId) return;
    
    setIsUploadingMedia(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': mediaFile.type },
        body: mediaFile,
      });
      
      if (!result.ok) throw new Error('Failed to upload media');
      const { storageId } = await result.json();
      
      sendDirectMessage(activeChatId, inputMessage.trim(), undefined, replyingTo?.id, undefined, undefined, {
        type: mediaType as 'image' | 'video',
        mediaStorageId: storageId,
        mimeType: mediaFile.type,
        fileName: mediaFile.name,
        fileSize: mediaFile.size,
        viewOnce: isViewOnce
      });
      
      cancelMediaPreview();
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to send media', err);
      triggerShareToast('Failed to send media');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const isVoiceActive = voiceState !== 'idle';

  return (
    <div id="chat-screen" className="w-full min-h-screen bg-theme-base flex justify-center overflow-hidden animate-in fade-in duration-200">
      
      {/* ── VIEW ONCE PLAYER ─────────────────────────────────────────────────── */}
      {activeViewOnceMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col backdrop-blur-sm">
          <div className="flex justify-end p-4">
            <button onClick={() => setActiveViewOnceMedia(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {activeViewOnceMedia.type === 'image' && (
              <img src={activeViewOnceMedia.url} alt="View Once" className="max-w-full max-h-full object-contain" />
            )}
            {activeViewOnceMedia.type === 'video' && (
              <video src={activeViewOnceMedia.url} autoPlay controls className="max-w-full max-h-full object-contain" />
            )}
            {activeViewOnceMedia.type === 'voice' && (
              <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#5E43F3]/20 flex items-center justify-center text-[#5E43F3]">
                    <Mic className="w-8 h-8" />
                  </div>
                  <span className="text-white font-medium">Voice message</span>
                  <div className="w-full">
                    <CustomAudioPlayer url={activeViewOnceMedia.url} duration={activeViewOnceMedia.duration} isMine={false} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-[960px] min-h-screen bg-theme-base flex flex-col border-x border-theme-divider/80">

        {/* Header */}
        <header className="shrink-0 border-b border-theme-divider/80 bg-theme-base/95 backdrop-blur-md px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                id="btn-chat-back"
                type="button"
                onClick={() => setActiveChatId(null)}
                className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover active:scale-95 transition-all cursor-pointer"
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
                  <Avatar src={conv.participant.avatar || undefined} alt={conv.participant.name} size="sm" className="w-9 h-9" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-theme-primary">{conv.participant.name}</span>
                  </div>
                  <span className="block truncate text-[11px] text-theme-tertiary">@{conv.participant.username}</span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => triggerShareToast('Voice calls coming in v0.2')}
                className="rounded-full p-2 text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors cursor-pointer"
                title="Voice call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors cursor-pointer"
                title="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 bg-theme-base min-h-0">
          {[...conv.messages].sort((a, b) => a.createdAt - b.createdAt).map((msg: DirectMessage, index: number, arr: DirectMessage[]) => {
            const prevMsg = index > 0 ? arr[index - 1] : null;
            
            let showSeparator = false;
            if (!prevMsg) {
              showSeparator = true;
            } else if (msg.createdAt && prevMsg.createdAt) {
              const gap = msg.createdAt - prevMsg.createdAt;
              const dateMsg = new Date(msg.createdAt);
              const datePrev = new Date(prevMsg.createdAt);
              if (gap > 30 * 60 * 1000 || dateMsg.getHours() !== datePrev.getHours() || dateMsg.getDate() !== datePrev.getDate()) {
                showSeparator = true;
              }
            }
            
            const isGrouped = !showSeparator && prevMsg && prevMsg.senderId === msg.senderId && msg.createdAt && prevMsg.createdAt && (msg.createdAt - prevMsg.createdAt < 5 * 60 * 1000);
            
            const timeString = msg.createdAt ? formatMessageTime(msg.createdAt) : msg.timestamp;

            return (
              <React.Fragment key={msg.id}>
                {showSeparator && msg.createdAt && (
                  <div className="flex items-center justify-center my-4 opacity-50">
                    <div className="flex-1 h-px bg-theme-divider-strong"></div>
                    <span className="mx-4 text-[11px] font-medium text-theme-tertiary">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-theme-divider-strong"></div>
                  </div>
                )}
                
                <div
                  id={`chat-msg-${msg.id}`}
                  className="flex flex-col animate-in zoom-in-95 duration-150 relative"
                >
                  {!isGrouped && (
                    <div className="flex items-center gap-1.5 text-theme-tertiary select-none mb-1">
                      <span className="text-xs font-bold tracking-wide">{msg.isMine ? 'Me' : conv.participant.name}</span>
                      <span className="text-[10px] opacity-70 ml-1">{timeString}</span>
                      {msg.isMine && <MessageReceiptIndicator status={msg.status || 'read'} theme="light-bg" className="ml-0.5" />}
                    </div>
                )}

                <div
                  className={`flex justify-start relative group border-l border-t ${msg.isMine ? 'border-neutral-800' : 'border-[#5E43F3]/40'} pl-3 pt-2 pb-1 mt-0.5`}
                  onClick={() => setActiveContextMenu(activeContextMenu === msg.id ? null : msg.id)}
                >
                  <div className="flex flex-col max-w-[90%] cursor-pointer">
                    {msg.replyToMessageText && (
                      <div className={`flex flex-col gap-0.5 mb-2 opacity-80 border-l border-t ${msg.isMine ? 'border-neutral-800' : 'border-[#5E43F3]/40'} pl-2 pt-1`}>
                        <span className="text-[10px] text-theme-tertiary font-medium">Replying to:</span>
                        <span className="text-[11px] text-theme-tertiary truncate max-w-[200px] italic">{msg.replyToMessageText}</span>
                      </div>
                    )}

                    {msg.viewOnce ? (
                      msg.viewOnceOpened ? (
                        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border ${msg.isMine ? 'border-neutral-800 bg-black' : 'border-[#5E43F3]/20 bg-[#5E43F3]'}`}>
                          <CheckCheck className="w-4 h-4 text-theme-tertiary opacity-70" />
                          <span className="text-xs font-medium text-theme-tertiary italic">Opened</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenViewOnce(msg)}
                          disabled={msg.isMine}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${msg.isMine ? 'border-neutral-800 bg-black cursor-default' : 'border-[#5E43F3]/30 bg-[#5E43F3]/10 hover:bg-[#5E43F3]/20 cursor-pointer transition-colors'}`}
                        >
                          <div className={`flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] ${msg.isMine ? 'border-theme-tertiary text-theme-tertiary' : 'border-[#5E43F3] text-[#5E43F3]'}`}>
                            <span className="text-[9px] font-bold">1</span>
                          </div>
                          <span className={`text-xs font-medium ${msg.isMine ? 'text-theme-tertiary' : 'text-[#5E43F3]'}`}>
                            {msg.audioUrl ? 'Voice message' : (msg.type === 'video' ? 'Video' : 'Photo')}
                          </span>
                        </button>
                      )
                    ) : msg.isSticker && msg.stickerId ? (
                      <div className="p-2 hover:scale-105 transition-transform -ml-2">
                        {STICKERS.find((s) => s.id === msg.stickerId)?.render() || <Sparkles className="w-12 h-12 text-amber-500" />}
                      </div>
                    ) : msg.audioUrl ? (
                      <CustomAudioPlayer
                        url={msg.audioUrl}
                        duration={msg.audioDuration}
                        isMine={msg.isMine}
                      />
                    ) : msg.mediaUrl ? (
                      <div className="flex flex-col gap-1 max-w-[280px]">
                        {msg.type === 'video' ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveViewOnceMedia({ id: msg.id + '_view', url: msg.mediaUrl!, type: 'video' }); }}
                            className="rounded-md overflow-hidden w-full focus:outline-none"
                          >
                            <video src={msg.mediaUrl} className="rounded-md w-full max-h-[300px] object-contain bg-black/50 pointer-events-none" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveViewOnceMedia({ id: msg.id + '_view', url: msg.mediaUrl!, type: 'image' }); }}
                            className="rounded-md overflow-hidden w-full focus:outline-none"
                          >
                            <img src={msg.mediaUrl} alt="attachment" className="rounded-md w-full max-h-[300px] object-contain bg-black/50" />
                          </button>
                        )}
                        {msg.text && (
                          <div className={`px-3 py-2 text-sm leading-relaxed rounded-sm ${msg.isMine ? 'bg-black text-white dark:bg-[#0a0a0a]' : 'bg-[#5E43F3] text-white'}`}>
                            <p className="break-words">{msg.text}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`px-3 py-2 text-sm leading-relaxed rounded-sm ${
                        msg.isMine ? 'bg-black text-white dark:bg-[#0a0a0a]' : 'bg-[#5E43F3] text-white'
                      }`}>
                        <p className="break-words">{msg.text}</p>
                      </div>
                    )}

                    {msg.isEdited && (
                      <span className="text-[10px] text-theme-tertiary mt-1 select-none italic">edited</span>
                    )}
                  </div>

                  {/* Context Menu */}
                  {activeContextMenu === msg.id && (
                    <div className="absolute top-full left-4 mt-1 bg-theme-surface border border-theme-divider rounded-xl shadow-lg shadow-black/10 flex flex-col min-w-[120px] z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {msg.isMine ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyingTo({ id: msg.id, text: msg.text }); setActiveContextMenu(null); document.getElementById('input-direct-message')?.focus(); }}
                            className="text-left px-3 py-2 text-xs text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >Reply</button>
                          {/* Edit: only show if message has text (caption). Media-only messages are not editable. */}
                          {(!msg.mediaUrl || msg.text) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingMsg({ id: msg.id, text: msg.text }); setInputMessage(msg.text); setActiveContextMenu(null); document.getElementById('input-direct-message')?.focus(); }}
                              className="text-left px-3 py-2 text-xs text-theme-primary hover:bg-theme-surface-hover transition-colors"
                            >Edit{msg.mediaUrl ? ' Caption' : ''}</button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this message?')) { deleteMessage(msg.id); } setActiveContextMenu(null); }}
                            className="text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                          >Delete</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyingTo({ id: msg.id, text: msg.text }); setActiveContextMenu(null); document.getElementById('input-direct-message')?.focus(); }}
                            className="text-left px-3 py-2 text-xs text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >Reply</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(msg.text); triggerShareToast('Copied'); setActiveContextMenu(null); }}
                            className="text-left px-3 py-2 text-xs text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >Copy</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

        {/* Composer */}
        <div className="border-t border-theme-divider/80 bg-theme-base p-3 shrink-0 flex flex-col gap-2">

          {/* Reply / Edit banner */}
          {(replyingTo || editingMsg) && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-theme-surface rounded-lg border border-theme-divider">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-0.5 h-4 bg-[#5E43F3] rounded-full" />
                <span className="text-xs text-theme-secondary truncate">
                  {replyingTo ? 'Replying: ' : 'Editing: '}
                  <span className="text-theme-primary">{replyingTo?.text || editingMsg?.text}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setReplyingTo(null); setEditingMsg(null); setInputMessage(''); }}
                className="p-1 text-theme-tertiary hover:text-theme-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mic error banner */}
          {micError && (
            <div className="flex items-center justify-between px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <span className="text-xs text-rose-400 flex-1">{micError}</span>
              <button onClick={() => setMicError(null)} className="ml-2 text-rose-400 hover:text-rose-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── RECORDING STATE ─────────────────────────────────────── */}
          {voiceState === 'recording' && (
            <div className="flex flex-col gap-2 px-3 py-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Recording</span>
                  <span className="text-sm font-mono text-rose-400 tabular-nums">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-theme-surface-hover text-theme-secondary hover:text-theme-primary text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-500/25"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    Stop
                  </button>
                </div>
              </div>
              <LiveWaveform analyser={analyserNode} barCount={40} color="#f43f5e" />
            </div>
          )}

          {/* ── PREVIEW / PLAYING / PAUSED / SENDING STATE ──────────── */}
          {(voiceState === 'preview' || voiceState === 'playing' || voiceState === 'paused' || voiceState === 'sending') && (
            <div className="flex flex-col gap-2.5 px-3 py-2.5 rounded-2xl border border-[#5E43F3]/30 bg-[#5E43F3]/5">
              {/* Waveform + playback controls row */}
              <div className="flex items-center gap-2.5">
                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={() => {
                    if (voiceState === 'preview') playPreview();
                    else if (voiceState === 'playing') pausePreview();
                    else if (voiceState === 'paused') resumePreview();
                  }}
                  disabled={voiceState === 'sending'}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E43F3] text-white hover:bg-[#4E34E0] active:scale-95 transition-all shrink-0 disabled:opacity-50"
                >
                  {voiceState === 'playing'
                    ? <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5 ml-0.5" />
                  }
                </button>

                {/* Waveform */}
                <StaticWaveform
                  bars={previewBars.length ? previewBars : Array.from({ length: 32 }, (_, i) => 25 + Math.abs(Math.sin(i * 0.6)) * 55)}
                  progress={playbackProgress}
                  onSeek={seekPreview}
                  activeColor="#5E43F3"
                  inactiveColor="rgba(94,67,243,0.25)"
                />

                {/* Duration */}
                <span className="text-[10px] font-mono text-theme-tertiary shrink-0 min-w-[30px] text-right tabular-nums">
                  {formatDur(previewDuration)}
                </span>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsViewOnce(!isViewOnce)}
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border transition-colors ${isViewOnce ? 'bg-[#5E43F3] border-[#5E43F3] text-white' : 'border-theme-divider-strong text-theme-tertiary hover:bg-theme-surface-hover'}`}
                    title="View once"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={discardPreview}
                    disabled={voiceState === 'sending'}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-theme-surface-hover text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>

                <button
                  type="button"
                  onClick={sendVoiceNote}
                  disabled={voiceState === 'sending'}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-md shadow-[#5E43F3]/25"
                >
                  {voiceState === 'sending' ? (
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── MEDIA PREVIEW: overrides idle composer ─────────────────── */}
          {mediaPreviewUrl && (
            <div className="flex flex-col gap-2 p-3 bg-theme-surface rounded-xl border border-theme-divider">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-theme-primary">{mediaType === 'video' ? 'Video Preview' : 'Image Preview'}</span>
                <button type="button" onClick={cancelMediaPreview} className="p-1 rounded-full text-theme-secondary hover:bg-theme-surface-hover">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-center bg-black/20 rounded-md overflow-hidden max-h-[200px]">
                {mediaType === 'video' ? (
                  <video src={mediaPreviewUrl} controls className="max-h-[200px] object-contain" />
                ) : (
                  <img src={mediaPreviewUrl} alt="preview" className="max-h-[200px] object-contain" />
                )}
              </div>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Add a caption (optional)"
                className="w-full rounded-md border border-theme-divider bg-theme-base px-3 py-2 text-sm text-theme-primary outline-none focus:border-[#5E43F3]"
              />
              <div className="flex justify-between items-center mt-1">
                <button
                  type="button"
                  onClick={() => setIsViewOnce(!isViewOnce)}
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border transition-colors ${isViewOnce ? 'bg-[#5E43F3] border-[#5E43F3] text-white' : 'border-theme-divider-strong text-theme-tertiary hover:bg-theme-surface-hover'}`}
                  title="View once"
                >
                  1
                </button>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={cancelMediaPreview} className="px-4 py-2 text-sm font-medium text-theme-secondary hover:bg-theme-surface-hover rounded-md">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendMedia}
                    disabled={isUploadingMedia}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#5E43F3] text-white hover:bg-[#4E34E0] rounded-md disabled:opacity-50"
                  >
                    {isUploadingMedia ? 'Sending...' : 'Send'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── IDLE: normal text composer ──────────────────────────── */}
          {voiceState === 'idle' && !mediaPreviewUrl && (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-direct-message"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Message"
                  className="w-full rounded-full border border-theme-divider bg-theme-surface pl-4 pr-16 py-3 text-sm text-theme-primary placeholder:text-theme-tertiary outline-none transition-all focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/15"
                  autoFocus
                />

                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-theme-tertiary">
                  {/* Gallery: pick existing images or videos from device */}
                  <label className="rounded-full p-1.5 text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-secondary transition-colors cursor-pointer" title="Attach photo or video">
                    <ImageIcon className="w-4 h-4" />
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaSelect} />
                  </label>

                  {/* Camera: capture a new photo only — no gallery access */}
                  <label className="rounded-full p-1.5 text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-secondary transition-colors cursor-pointer" title="Take a photo">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleMediaSelect} />
                  </label>

                  <button
                    type="button"
                    onClick={handleMicClick}
                    className="rounded-full p-1.5 transition-all cursor-pointer text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-secondary"
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
                    : 'bg-theme-surface-active text-theme-tertiary'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mx-auto mt-2.5 h-1 w-24 rounded-full bg-theme-divider-strong" />
        </div>
      </div>
    </div>
  );
};
