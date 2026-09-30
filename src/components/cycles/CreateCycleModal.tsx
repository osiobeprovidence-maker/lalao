import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  Check,
  Upload,
  Camera,
  Music,
  ArrowLeft,
  Share2,
  Volume2,
  CheckCircle2,
  Clock,
  Smile,
  Sticker,
  EyeOff,
  Users,
  Play,
  Pause,
  Trash2,
  VolumeX,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { EmojiPickerPopover } from '../create/EmojiPickerPopover';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface CreateCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateStep = 'choose' | 'gallery' | 'customize' | 'audio' | 'preview' | 'camera';
type ContentType = 'photo' | 'video' | 'text' | 'voice' | 'audio';

const BG_GRADIENTS = [
  { id: 'violet', label: 'Violet Twilight', value: 'from-violet-600 to-indigo-800' },
  { id: 'rose', label: 'Sunset Crimson', value: 'from-fuchsia-600 to-rose-600' },
  { id: 'amber', label: 'Warm Amber', value: 'from-amber-500 to-orange-600' },
  { id: 'emerald', label: 'Delta Emerald', value: 'from-emerald-600 to-teal-700' },
  { id: 'ocean', label: 'Deep River', value: 'from-sky-600 to-blue-900' },
  { id: 'slate', label: 'Dark Midnight', value: 'from-neutral-800 to-neutral-950' },
];

const MAX_VIDEO_DURATION = 30; // Maximum status video length in seconds

// Trims a video blob using MediaRecorder + captureStream.
const extractVideoSegment = (fileUrl: string, startTime: number, endTime: number, muted?: boolean): Promise<Blob> => {
  const clipDuration = Math.min(endTime - startTime, MAX_VIDEO_DURATION);
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = fileUrl;
    video.muted = muted || false;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    // Must be in DOM and visible so browser allows play + captureStream
    video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(video);

    const cleanup = () => {
      try { document.body.removeChild(video); } catch {}
    };

    video.onloadeddata = () => {
      video.currentTime = startTime;
    };

    video.onseeked = () => {
      let stream: MediaStream;
      if ('captureStream' in video) {
        stream = (video as any).captureStream();
      } else if ('mozCaptureStream' in video) {
        stream = (video as any).mozCaptureStream();
      } else {
        cleanup();
        reject(new Error('captureStream not supported in this browser'));
        return;
      }
      
      if (muted) {
        stream.getAudioTracks().forEach(track => stream.removeTrack(track));
      }

      // Pick best available codec
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        cleanup();
        resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
      };

      recorder.start();
      video.play().catch((err) => { cleanup(); reject(err); });

      // Stop after clipDuration
      const stopTimer = window.setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
        video.pause();
      }, clipDuration * 1000 + 200); // +200ms buffer for final frames

      // Also stop if video ends early
      video.onended = () => {
        clearTimeout(stopTimer);
        if (recorder.state !== 'inactive') recorder.stop();
      };
    };
    video.onerror = (e) => { cleanup(); reject(e); };
    video.load();
  });
};

const generateThumbnails = (fileUrl: string, duration: number, count: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = fileUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      canvas.width = 100;
      canvas.height = (video.videoHeight / video.videoWidth) * 100;
      
      const thumbnails: string[] = [];
      const interval = duration / count;
      let currentTime = 0;
      let currentIndex = 0;
      
      const captureFrame = () => {
        if (currentIndex >= count) {
          resolve(thumbnails);
          return;
        }
        
        video.currentTime = currentTime;
      };
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.5));
        }
        
        currentIndex++;
        currentTime += interval;
        captureFrame();
      };
      
      video.onerror = reject;
      
      captureFrame();
    };
    
    video.onerror = reject;
    video.load();
  });
};

const FONT_OPTIONS = [
  { id: 'sans', name: 'Lalao Sans', className: 'font-sans', sample: 'Aa' },
  { id: 'serif', name: 'Editorial', className: 'font-serif', sample: 'Aa' },
  { id: 'mono', name: 'Mono', className: 'font-mono', sample: 'Aa' },
  { id: 'display', name: 'Rounded', className: 'font-black tracking-tight', sample: 'Aa' },
];

const STICKER_COLLECTIONS = [
  {
    id: 'featured',
    name: 'Featured',
    stickers: [
      { id: 'football', asset: '⚽️', label: 'Football', animated: true },
      { id: 'sparkle', asset: '✨', label: 'Sparkle', animated: false },
      { id: 'love', asset: '💙', label: 'Love', animated: false },
      { id: 'fire', asset: '🔥', label: 'Fire', animated: true },
      { id: 'party', asset: '🎉', label: 'Party', animated: true },
      { id: 'music', asset: '🎵', label: 'Music', animated: false },
    ],
  },
  {
    id: 'reactions',
    name: 'Reactions',
    stickers: [
      { id: 'heart', asset: '❤️', label: 'Heart', animated: false },
      { id: 'clap', asset: '👏', label: 'Clap', animated: false },
      { id: 'wave', asset: '👋', label: 'Wave', animated: false },
      { id: 'rocket', asset: '🚀', label: 'Rocket', animated: true },
      { id: 'star', asset: '⭐', label: 'Star', animated: false },
      { id: 'laugh', asset: '😂', label: 'Laugh', animated: false },
    ],
  },
  {
    id: 'local',
    name: 'Local',
    stickers: [
      { id: 'community', asset: '🏘️', label: 'Community', animated: false },
      { id: 'sunset', asset: '🌅', label: 'Sunset', animated: false },
      { id: 'city', asset: '🏙️', label: 'City', animated: false },
      { id: 'food', asset: '🍲', label: 'Food', animated: false },
      { id: 'market', asset: '🛍️', label: 'Market', animated: false },
      { id: 'friendship', asset: '🤝', label: 'Friendship', animated: false },
    ],
  },
];

const MUSIC_TRACKS = [
  { id: 'track_1', title: 'Afrobeats Vibe (Trending)', artist: 'Lalao Sounds', duration: '0:30' },
  { id: 'track_2', title: 'Lagos Sunset Breeze', artist: 'Delta Groove', duration: '0:28' },
  { id: 'track_3', title: 'Acoustic Morning', artist: 'Local Strings', duration: '0:35' },
];

type StickerLayer = {
  id: string;
  asset: string;
  label: string;
  animated: boolean;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export const CreateCycleModal: React.FC<CreateCycleModalProps> = ({ isOpen, onClose }) => {
  const { location, postCycleStory, permissions, setActivePermissionPrompt, triggerShareToast, currentUser } = useLalao();
  const generateUploadUrl = useMutation(api.social.generateUploadUrl);

  const [step, setStep] = useState<CreateStep>('choose');
  const [contentType, setContentType] = useState<ContentType>('photo');
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(BG_GRADIENTS[0].value);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].className);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<'community' | 'nearby' | 'friends'>('community');
  const [isAudienceSheetOpen, setIsAudienceSheetOpen] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<StickerLayer[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [galleryTab, setGalleryTab] = useState<'photos' | 'videos'>('photos');
  const [stickerLibraryOpen, setStickerLibraryOpen] = useState(false);
  const [stickerCollection, setStickerCollection] = useState('featured');
  const [stickerSearch, setStickerSearch] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [videoDuration, setVideoDuration] = useState(0);
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [videoEndTime, setVideoEndTime] = useState(0);
  const [videoThumbnails, setVideoThumbnails] = useState<string[]>([]);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  // Waveform / audio review state
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(32).fill(2));
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioReviewRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const waveformAnimRef = useRef<number | null>(null);

  // Exclude from Status state
  const [isExcludeSheetOpen, setIsExcludeSheetOpen] = useState(false);
  const [excludedUsers, setExcludedUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [excludeSearch, setExcludeSearch] = useState('');

  // Video trimmer drag state
  const trimmerRef = useRef<HTMLDivElement | null>(null);
  // 'center' = move whole window, 'left' = resize start, 'right' = resize end
  type TrimDragMode = 'center' | 'left' | 'right';
  const trimDragRef = useRef<{ startX: number; startWindowStart: number; startWindowEnd: number; mode: TrimDragMode } | null>(null);
  // Ref to the preview <video> element in the composer (not the camera feed)
  const composerVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<number | null>(null);

  const stopWaveformAnimation = useCallback(() => {
    if (waveformAnimRef.current) {
      cancelAnimationFrame(waveformAnimRef.current);
      waveformAnimRef.current = null;
    }
  }, []);

  const startWaveformAnimation = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      const barCount = 32;
      const step = Math.floor(dataArray.length / barCount);
      const bars: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        bars.push(Math.max(2, Math.round(value * 40)));
      }
      setWaveformBars(bars);
      waveformAnimRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const resetAudioRecording = () => {
    stopWaveformAnimation();
    setWaveformBars(Array(32).fill(2));
    setIsPlayingAudio(false);
    if (audioReviewRef.current) {
      audioReviewRef.current.pause();
      audioReviewRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setAudioError(null);
    setRecordingSeconds(0);
    setIsRecordingVoice(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioTimerRef.current) {
      window.clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  };

  // Toggle audio playback in review mode
  const toggleAudioPlayback = () => {
    if (!audioUrl) return;
    if (!audioReviewRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audioReviewRef.current = audio;
    }
    if (isPlayingAudio) {
      audioReviewRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioReviewRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Clean slate on every open
      setStep('choose');
      setContentType('text');
      setSelectedMedia('');
      setMediaType('image');
      setTextContent('');
      setSelectedGradient(BG_GRADIENTS[0].value);
      setSelectedAudio(null);
      setSelectedFile(null);
      setAudioBlob(null);
      resetAudioRecording();
      setSelectedStickers([]);
      setActiveStickerId(null);
      setStickerLibraryOpen(false);
      setEmojiPickerOpen(false);
      setIsVideoLoading(false);
      setVideoMuted(false);
      setExcludedUsers([]);
      setExcludeSearch('');
      
      // Cleanup object URLs if they exist to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (selectedMedia && selectedMedia.startsWith('blob:')) {
        URL.revokeObjectURL(selectedMedia);
      }
      
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      // Cleanup on close
      resetAudioRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (selectedMedia && selectedMedia.startsWith('blob:')) URL.revokeObjectURL(selectedMedia);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmojiSelect = (emoji: string) => {
    addSticker({ id: `emoji-${Date.now()}`, asset: emoji, label: 'emoji', animated: false });
    setEmojiPickerOpen(false);
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleSelectContentType = (type: ContentType) => {
    setContentType(type);
    if (type === 'text') {
      setStep('customize');
    } else if (type === 'voice') {
      setStep('audio');
    } else {
      setStep('gallery');
    }
  };



    const startCameraPreview = async () => {
    if (permissions.camera !== 'granted' || permissions.microphone !== 'granted') {
      setActivePermissionPrompt('camera');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      mediaStreamRef.current = stream;
      setStep('camera');
      setContentType('video');
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
      }, 100);
    } catch (e) {
      console.error('Camera access failed', e);
      // Fallback to file picker if camera fails
      startCameraPreview();
    }
  };

  const startVideoRecording = () => {
    if (!mediaStreamRef.current) return;
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) videoChunksRef.current.push(event.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setSelectedMedia(url);
      setSelectedFile(blob);
      setMediaType('video');
      setContentType('video');
      setStep('customize');
      
      // Cleanup stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsRecordingVideo(false);
    };
    
    recorder.start();
    setIsRecordingVideo(true);
    setRecordingSeconds(0);
    let elapsed = 0;
    audioTimerRef.current = window.setInterval(() => {
      elapsed += 1;
      setRecordingSeconds(elapsed);
    }, 1000);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  
  const takePhoto = () => {
     if (!videoPreviewRef.current || !mediaStreamRef.current) return;
     const canvas = document.createElement('canvas');
     canvas.width = videoPreviewRef.current.videoWidth;
     canvas.height = videoPreviewRef.current.videoHeight;
     canvas.getContext('2d')?.drawImage(videoPreviewRef.current, 0, 0);
     const url = canvas.toDataURL('image/jpeg');
     setSelectedMedia(url);
     canvas.toBlob((blob) => {
       if (blob) setSelectedFile(blob);
     }, 'image/jpeg');
     setMediaType('image');
     setContentType('photo');
     setStep('customize');
     
     // Cleanup
     mediaStreamRef.current.getTracks().forEach(track => track.stop());
     mediaStreamRef.current = null;
  };
  const handleCameraCapture = () => {
    if (permissions.camera !== 'granted') {
      setActivePermissionPrompt('camera');
      return;
    }
    photoInputRef.current?.click();
  };

  const handleVideoCapture = () => {
    if (permissions.camera !== 'granted') {
      setActivePermissionPrompt('camera');
      return;
    }
    videoInputRef.current?.click();
  };

  const handleMediaFileSelected = (file: File | null, kind: 'photo' | 'video') => {
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      triggerShareToast('This video is larger than the 10 MB limit.');
      return;
    }

    const url = URL.createObjectURL(file);
    if (kind === 'photo') {
      setSelectedMedia(url);
      setSelectedFile(file);
      setMediaType('image');
      setContentType('photo');
      setStep('customize');
      triggerShareToast('Photo attached to your status.');
    } else {
      setVideoDuration(0);
      setVideoStartTime(0);
      setVideoEndTime(0);
      setVideoThumbnails([]);
      setSelectedMedia(url);
      setSelectedFile(file);
      setMediaType('video');
      setContentType('video');
      setIsVideoLoading(true);
      setStep('customize');
      triggerShareToast('Video attached to your status.');
    }
  };


  const addSticker = (sticker: { id: string; asset: string; label: string; animated: boolean }) => {
    const nextSticker: StickerLayer = {
      id: `${sticker.id}-${Date.now()}`,
      asset: sticker.asset,
      label: sticker.label,
      animated: sticker.animated,
      x: 52,
      y: 52,
      rotation: 0,
      scale: 1,
    };

    setSelectedStickers((prev) => [...prev, nextSticker]);
    setActiveStickerId(nextSticker.id);
    setStickerLibraryOpen(false);
  };

  const selectedStickerCollection = STICKER_COLLECTIONS.find((collection) => collection.id === stickerCollection) ?? STICKER_COLLECTIONS[0];
  const filteredStickers = selectedStickerCollection.stickers.filter((sticker) =>
    sticker.label.toLowerCase().includes(stickerSearch.toLowerCase()) ||
    sticker.asset.toLowerCase().includes(stickerSearch.toLowerCase())
  );

  const handleStickerPointerDown = (event: React.PointerEvent<HTMLButtonElement>, stickerId: string) => {
    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;

    const sticker = selectedStickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    const dx = event.clientX - previewRect.left;
    const dy = event.clientY - previewRect.top;

    const xPercent = ((dx / previewRect.width) * 100);
    const yPercent = ((dy / previewRect.height) * 100);

    setActiveStickerId(stickerId);
    (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);

    const drag = {
      stickerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: sticker.x,
      originY: sticker.y,
      startPercentX: xPercent,
      startPercentY: yPercent,
    };

    (event.currentTarget as HTMLButtonElement).dataset.drag = JSON.stringify(drag);
  };

  const handlePreviewPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const activeElement = event.target as HTMLElement;
    const dragData = activeElement.closest('button')?.dataset.drag;
    if (!dragData || !previewRef.current) return;

    const drag = JSON.parse(dragData) as {
      stickerId: string;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      startPercentX: number;
      startPercentY: number;
    };

    const rect = previewRef.current.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startX) / rect.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * 100;

    setSelectedStickers((prev) => prev.map((sticker) => {
      if (sticker.id !== drag.stickerId) return sticker;
      return {
        ...sticker,
        x: Math.min(94, Math.max(6, drag.originX + deltaX)),
        y: Math.min(94, Math.max(6, drag.originY + deltaY)),
      };
    }));
  };

  const handlePreviewPointerUp = () => {
    const buttons = previewRef.current?.querySelectorAll('button');
    buttons?.forEach((button) => {
      delete (button as HTMLButtonElement).dataset.drag;
    });
  };

  const handleStartAudioRecording = async () => {
    if (permissions.microphone !== 'granted') {
      setActivePermissionPrompt('microphone');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioError('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Setup Web Audio API analyser for live waveform
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;
      startWaveformAnimation(analyser);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopWaveformAnimation();
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const nextUrl = URL.createObjectURL(blob);
        setAudioUrl(nextUrl);
        setAudioBlob(blob);
        setSelectedAudio('Voice note');
        setAudioError(null);
        setIsRecordingVoice(false);
        setRecordingSeconds(0);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
        // Keep waveform bars as a static snapshot — don't reset them
        setStep('customize');
        setContentType('audio');
      };

      recorder.start();
      setAudioError(null);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      let elapsed = 0;
      audioTimerRef.current = window.setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
      }, 1000);
    } catch (error) {
      setAudioError('Microphone access was denied or unavailable. Please allow mic access and try again.');
      setIsRecordingVoice(false);
    }
  };

  const handleStopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopWaveformAnimation();
    setIsRecordingVoice(false);
  };

  const handlePublish = async () => {
    const finalMediaType: 'image' | 'video' | 'audio' | 'text' =
      contentType === 'audio' ? 'audio' : contentType === 'text' ? 'text' : mediaType;

    let storageId: string | undefined = undefined;
    let fileToUpload = finalMediaType === 'audio' ? audioBlob : selectedFile;

    // Auto-trim videos longer than 30 seconds or if trimmed/muted by user
    if (finalMediaType === 'video' && fileToUpload && selectedMedia && videoDuration > 0) {
      const needsTrim = videoDuration > MAX_VIDEO_DURATION || videoStartTime > 0 || videoEndTime < videoDuration;
      if (needsTrim || videoMuted) {
        setIsProcessingVideo(true);
        triggerShareToast(videoMuted ? 'Processing video (removing audio)…' : 'Processing video…');
        try {
          const processedBlob = await extractVideoSegment(selectedMedia, videoStartTime, videoEndTime, videoMuted);
          if (processedBlob.size > 10 * 1024 * 1024) {
            triggerShareToast('The resulting video is too large (over 10 MB limit).');
            setIsProcessingVideo(false);
            return;
          }
          fileToUpload = processedBlob;
        } catch (err) {
          console.error('Video processing failed, uploading original', err);
        }
        setIsProcessingVideo(false);
      }
    }

    if (fileToUpload && finalMediaType !== 'text') {
       try {
         const uploadUrl = await generateUploadUrl();
         const result = await fetch(uploadUrl, {
           method: "POST",
           headers: { "Content-Type": fileToUpload.type },
           body: fileToUpload,
         });
         const { storageId: returnedStorageId } = await result.json();
         storageId = returnedStorageId;
       } catch (e) {
         console.error('Error uploading file', e);
         triggerShareToast('Failed to upload media. Please try again.');
         setIsProcessingVideo(false);
         return;
       }
    }

    postCycleStory({
      mediaType: finalMediaType,
      text: contentType === 'text' || textContent ? textContent : undefined,
      backgroundColor: contentType === 'text' ? selectedGradient : undefined,
      mediaUrl: (contentType !== 'text' && contentType !== 'audio' && !storageId) ? selectedMedia : (audioUrl && !storageId ? audioUrl : undefined),
      mediaStorageId: storageId,
      caption: textContent || undefined,
      audience: selectedAudience,
      location: location.name,
      excludedUserIds: excludedUsers.length > 0 ? excludedUsers.map(u => u.id as any) : undefined,
    });
    
    triggerShareToast('Status published to your 24h Cycle!');
    resetAudioRecording();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="create-cycle-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden animate-in fade-in duration-200"
    >
      <div
        ref={containerRef}
        id="create-cycle-fullscreen"
        className={`relative w-full h-full max-w-[500px] flex flex-col transition-colors duration-500 ${
          contentType === 'text' ? `bg-gradient-to-br ${selectedGradient}` : 'bg-black'
        }`}
      >
                {step === 'camera' && (
          <div className="absolute inset-0 z-40 bg-black">
            <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            
            {/* Top controls */}
            <div className="absolute top-6 left-4 right-4 flex justify-between z-50">
              <button onClick={() => { 
                if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
                setStep('choose'); setContentType('text'); 
              }} className="p-2 bg-black/40 rounded-full text-white">
                <X className="w-6 h-6" />
              </button>
              {isRecordingVideo && (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" /> {recordingSeconds}s
                </div>
              )}
            </div>
            
            {/* Bottom controls */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8 z-50">
               {!isRecordingVideo && (
                 <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-white/30 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                 </button>
               )}
               <button onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording} className={`w-20 h-20 rounded-full border-4 ${isRecordingVideo ? 'border-red-500 bg-red-500/50' : 'border-white bg-red-500'}`}>
               </button>
            </div>
          </div>
        )}
        
        {/* Media Background */}
        {contentType !== 'text' && selectedMedia && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden">
             {/* Blurred background for letterboxing */}
             <div className="absolute inset-0 z-0 pointer-events-none">
                {mediaType === 'video' ? (
                  <video src={selectedMedia} autoPlay loop muted playsInline className="h-full w-full object-cover opacity-40 blur-2xl scale-110" />
                ) : (
                  <img src={selectedMedia} alt="Background" className="h-full w-full object-cover opacity-40 blur-2xl scale-110" />
                )}
             </div>
             {/* Foreground properly contained */}
            {mediaType === 'video' ? (
              <>
                <video
                  ref={composerVideoRef}
                  src={selectedMedia}
                  autoPlay
                  playsInline
                  muted={videoMuted || isVideoLoading}
                  className={`relative z-10 h-full w-full object-contain ${isVideoLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration;
                    if (dur && videoDuration === 0) {
                      setVideoDuration(dur);
                      const initEnd = Math.min(dur, MAX_VIDEO_DURATION);
                      setVideoEndTime(initEnd);
                      setVideoStartTime(0);
                      generateThumbnails(selectedMedia, dur, 10).then((thumbs) => {
                        setVideoThumbnails(thumbs);
                        setIsVideoLoading(false);
                      }).catch((err) => {
                        console.error(err);
                        setIsVideoLoading(false);
                      });
                    }
                  }}
                  onTimeUpdate={(e) => {
                    if (videoEndTime > 0 && e.currentTarget.currentTime >= videoEndTime) {
                      e.currentTarget.currentTime = videoStartTime;
                      e.currentTarget.play().catch(() => {});
                    } else if (e.currentTarget.currentTime < videoStartTime) {
                      e.currentTarget.currentTime = videoStartTime;
                    }
                  }}
                />
                {isVideoLoading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                    <p className="text-white text-sm font-semibold tracking-wide">Processing video...</p>
                  </div>
                )}
              </>
            ) : (
              <img src={selectedMedia} alt="Preview" className="relative z-10 h-full w-full object-contain" />
            )}
            <div className="absolute inset-0 z-20 bg-black/10 pointer-events-none" />
          </div>
        )}

        {/* Top Header */}
        <div className="relative z-30 px-4 py-4 flex items-center justify-between shrink-0 pt-10 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            {mediaType === 'video' && (
              <button
                type="button"
                onClick={() => setVideoMuted(!videoMuted)}
                className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                title={videoMuted ? "Unmute Video" : "Mute Video"}
              >
                {videoMuted ? <VolumeX className="w-6 h-6 text-rose-400" /> : <Volume2 className="w-6 h-6" />}
              </button>
            )}
            
            <button
              type="button"
              onClick={() => {
                const currentIndex = BG_GRADIENTS.findIndex(g => g.value === selectedGradient);
                const nextIndex = (currentIndex + 1) % BG_GRADIENTS.length;
                setSelectedGradient(BG_GRADIENTS[nextIndex].value);
                setContentType('text');
                setSelectedMedia('');
              }}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              title="Change Background Color"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((prev) => !prev)}
                className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                title="Emoji"
              >
                <Smile className="w-6 h-6" />
              </button>
              {emojiPickerOpen && (
                <div className="absolute top-12 right-0">
                  <EmojiPickerPopover onSelectEmoji={handleEmojiSelect} onClose={() => setEmojiPickerOpen(false)} />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStickerLibraryOpen((prev) => !prev)}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              title="Stickers"
            >
              <Sticker className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => setStep(step === 'audio' ? 'customize' : 'audio')}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              title="Music"
            >
              <Music className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Central Text Area */}
        <div 
          ref={previewRef}
          onPointerMove={handlePreviewPointerMove}
          onPointerUp={handlePreviewPointerUp}
          onPointerLeave={handlePreviewPointerUp}
          className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 overflow-hidden touch-none"
        >
          {contentType === 'text' ? (
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Type a status..."
              className="w-full bg-transparent text-center font-bold text-3xl sm:text-4xl text-white placeholder:text-white/50 focus:outline-none resize-none overflow-hidden drop-shadow-md"
              rows={1}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
            />
          ) : (
            <div className="absolute bottom-24 left-0 right-0 px-6 z-30 pointer-events-auto flex justify-center w-full">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Add a caption..."
                className="w-[90%] sm:w-[80%] max-w-[400px] bg-black/40 backdrop-blur-md rounded-2xl p-4 text-center text-white placeholder:text-white/70 focus:outline-none resize-none overflow-hidden shadow-lg border border-white/10"
                rows={1}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = Math.min(150, el.scrollHeight) + 'px';
                  }
                }}
              />
            </div>
          )}

          {selectedStickers.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute z-20"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              }}
            >
              <button
                type="button"
                onPointerDown={(event) => handleStickerPointerDown(event, sticker.id)}
                onClick={() => setActiveStickerId(sticker.id)}
                className={`flex items-center justify-center rounded-xl border text-5xl shadow-lg transition ${
                  activeStickerId === sticker.id ? 'border-white/80 bg-black/10' : 'border-transparent bg-transparent'
                }`}
              >
                <span className={sticker.animated ? 'animate-pulse' : ''}>{sticker.asset}</span>
              </button>
              {activeStickerId === sticker.id && (
                <button
                   onClick={(e) => { e.stopPropagation(); setSelectedStickers(prev => prev.filter(s => s.id !== sticker.id)); setActiveStickerId(null); }}
                   className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
                   title="Remove sticker"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Live Recording Waveform */}
        {isRecordingVoice && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-sm">
            {/* Pulsing record dot */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <span className="text-white text-sm font-bold tracking-wide">Recording</span>
              <span className="text-rose-400 font-mono text-sm font-bold">
                {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Live waveform */}
            <div className="flex items-end gap-[2px] h-12 px-4">
              {waveformBars.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-rose-600 to-rose-300 transition-all duration-75"
                  style={{ height: `${h}px`, minHeight: '2px' }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleStopAudioRecording}
              aria-label="Stop recording"
              className="mt-2 w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center shadow-xl active:scale-95 transition-all"
            >
              <div className="w-5 h-5 rounded bg-white" />
            </button>
            <p className="text-white/50 text-xs">Tap to stop</p>
          </div>
        )}

        {/* Audio Review (after recording, before share) */}
        {audioUrl && !isRecordingVoice && contentType === 'audio' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/80 backdrop-blur-sm">
            <p className="text-white font-bold text-base">Voice Note Ready</p>

            {/* Static waveform snapshot */}
            <div className="flex items-end gap-[2px] h-12 px-4">
              {waveformBars.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-indigo-600 to-violet-300"
                  style={{ height: `${Math.max(2, h)}px` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                type="button"
                onClick={toggleAudioPlayback}
                aria-label={isPlayingAudio ? 'Pause audio' : 'Play audio'}
                className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
              >
                {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-[1px]" />}
              </button>

              {/* Duration label */}
              <span className="text-white/70 text-sm font-mono">{recordingSeconds}s</span>

              {/* Delete / re-record */}
              <button
                type="button"
                aria-label="Delete recording"
                onClick={() => { resetAudioRecording(); setContentType('text'); }}
                className="w-12 h-12 rounded-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/40 flex items-center justify-center text-rose-400 transition-all active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/40 text-xs">Review before sharing — tap Share Cycle to post</p>
          </div>
        )}
        
        {/* Selected Music Indicator */}
        {selectedAudio && !isRecordingVoice && !audioUrl && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-lg">
            <Music className="w-4 h-4 text-[#5E43F3]" />
            {selectedAudio}
            <button onClick={() => { setSelectedAudio(null); }} className="ml-2 text-rose-400 hover:text-rose-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Error Indicator */}
        {audioError && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-rose-500/90 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg">
            {audioError}
          </div>
        )}

        {/* Overlays */}
        {stickerLibraryOpen && (
          <div className="absolute inset-x-0 bottom-24 z-40 bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] max-h-[50vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h4 className="font-bold text-neutral-900">Stickers</h4>
              <button onClick={() => setStickerLibraryOpen(false)} className="p-1 text-neutral-500 hover:bg-neutral-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                {STICKER_COLLECTIONS.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setStickerCollection(collection.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                      stickerCollection === collection.id ? 'bg-[#5E43F3] text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {filteredStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => addSticker(sticker)}
                    className="aspect-square flex flex-col items-center justify-center rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                  >
                    <span className="text-3xl">{sticker.asset}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'audio' && (
          <div className="absolute inset-x-0 bottom-24 z-40 bg-black/90 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] max-h-[50vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h4 className="font-bold text-white">Music</h4>
              <button onClick={() => setStep('customize')} className="p-1 text-neutral-400 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2">
              {MUSIC_TRACKS.map((track) => (
                <div
                  key={track.id}
                  onClick={() => { setSelectedAudio(track.title); setStep('customize'); }}
                  className="group p-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-sm">
                      <Music className="w-5 h-5 text-white/50" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{track.title}</h4>
                      <p className="text-xs text-neutral-400">{track.artist}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-neutral-500">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Trimmer UI — single draggable window */}
        {mediaType === 'video' && videoDuration > 0 && step === 'customize' && (
          <div className="absolute inset-x-0 bottom-24 z-40 bg-black/80 backdrop-blur-xl p-4 flex flex-col gap-3 rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-white/70 font-bold px-1">
              <span className="text-white/60">
                {Math.floor(videoStartTime / 60).toString().padStart(2,'0')}:{(videoStartTime % 60 | 0).toString().padStart(2,'0')}
                {' → '}
                {Math.floor(videoEndTime / 60).toString().padStart(2,'0')}:{(videoEndTime % 60 | 0).toString().padStart(2,'0')}
              </span>
              <span className="text-white">
                {(videoEndTime - videoStartTime).toFixed(1)}s selected (max {MAX_VIDEO_DURATION}s)
              </span>
            </div>

            {/* Filmstrip + draggable window */}
            <div
              ref={trimmerRef}
              className="relative w-full h-14 bg-neutral-900 rounded-xl overflow-hidden select-none touch-none"
              onPointerDown={(e) => {
                const rect = trimmerRef.current?.getBoundingClientRect();
                if (!rect) return;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                
                // Determine what was clicked
                const clickX = e.clientX - rect.left;
                const clickPercent = clickX / rect.width;
                const startPercent = videoStartTime / videoDuration;
                const endPercent = videoEndTime / videoDuration;
                
                const handleTolerance = 0.05; // 5% of width tolerance
                
                let mode: TrimDragMode = 'center';
                if (Math.abs(clickPercent - startPercent) < handleTolerance) {
                  mode = 'left';
                } else if (Math.abs(clickPercent - endPercent) < handleTolerance) {
                  mode = 'right';
                }
                
                trimDragRef.current = { 
                  startX: e.clientX, 
                  startWindowStart: videoStartTime,
                  startWindowEnd: videoEndTime,
                  mode
                };
              }}
              onPointerMove={(e) => {
                if (!trimDragRef.current || !trimmerRef.current) return;
                const rect = trimmerRef.current.getBoundingClientRect();
                const deltaX = e.clientX - trimDragRef.current.startX;
                const deltaTime = (deltaX / rect.width) * videoDuration;
                const dragData = trimDragRef.current;
                
                let newStart = dragData.startWindowStart;
                let newEnd = dragData.startWindowEnd;
                
                if (dragData.mode === 'center') {
                  const windowDuration = dragData.startWindowEnd - dragData.startWindowStart;
                  newStart = dragData.startWindowStart + deltaTime;
                  newStart = Math.max(0, Math.min(videoDuration - windowDuration, newStart));
                  newEnd = newStart + windowDuration;
                } else if (dragData.mode === 'left') {
                  newStart = dragData.startWindowStart + deltaTime;
                  newStart = Math.max(0, Math.min(newEnd - 0.5, newStart)); // At least 0.5s duration
                  if (newEnd - newStart > MAX_VIDEO_DURATION) {
                    newStart = newEnd - MAX_VIDEO_DURATION; // Enforce max duration constraint
                  }
                } else if (dragData.mode === 'right') {
                  newEnd = dragData.startWindowEnd + deltaTime;
                  newEnd = Math.max(newStart + 0.5, Math.min(videoDuration, newEnd)); // At least 0.5s duration
                  if (newEnd - newStart > MAX_VIDEO_DURATION) {
                    newEnd = newStart + MAX_VIDEO_DURATION; // Enforce max duration constraint
                  }
                }
                
                setVideoStartTime(newStart);
                setVideoEndTime(newEnd);
                
                // Seek video live
                if (composerVideoRef.current) {
                  composerVideoRef.current.currentTime = (dragData.mode === 'right') ? newEnd : newStart;
                }
              }}
              onPointerUp={() => { trimDragRef.current = null; }}
              onPointerCancel={() => { trimDragRef.current = null; }}
              style={{ cursor: 'grab' }}
            >
              {/* Thumbnail filmstrip */}
              <div className="absolute inset-0 flex">
                {videoThumbnails.map((thumb, i) => (
                  <img key={i} src={thumb} className="h-full object-cover flex-1 pointer-events-none opacity-70" alt="" />
                ))}
              </div>

              {/* Dim unselected left */}
              <div
                className="absolute inset-y-0 left-0 bg-black/70 pointer-events-none"
                style={{ width: `${(videoStartTime / videoDuration) * 100}%` }}
              />
              {/* Dim unselected right */}
              <div
                className="absolute inset-y-0 right-0 bg-black/70 pointer-events-none"
                style={{ width: `${(1 - videoEndTime / videoDuration) * 100}%` }}
              />

              {/* Selection bracket — left bar + top/bottom + right bar */}
              <div
                className="absolute inset-y-0 pointer-events-none"
                style={{
                  left: `${(videoStartTime / videoDuration) * 100}%`,
                  width: `${((videoEndTime - videoStartTime) / videoDuration) * 100}%`,
                }}
              >
                {/* Top border */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-white rounded-tl-sm rounded-tr-sm" />
                {/* Bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-bl-sm rounded-br-sm" />
                {/* Left handle */}
                <div className="absolute left-0 top-0 bottom-0 w-[12px] -ml-[6px] bg-white rounded-sm flex items-center justify-center cursor-ew-resize pointer-events-auto shadow-md">
                  <div className="w-[2px] h-5 bg-black/40 rounded-full pointer-events-none" />
                </div>
                {/* Right handle */}
                <div className="absolute right-0 top-0 bottom-0 w-[12px] -mr-[6px] bg-white rounded-sm flex items-center justify-center cursor-ew-resize pointer-events-auto shadow-md">
                  <div className="w-[2px] h-5 bg-black/40 rounded-full pointer-events-none" />
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] text-white/40">
              Drag to move the selection window • Max {MAX_VIDEO_DURATION}s
            </p>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessingVideo && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <p className="text-white text-sm font-semibold">Processing video…</p>
            <p className="text-white/60 text-xs">Trimming to {MAX_VIDEO_DURATION}s with original audio</p>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="relative z-30 px-6 py-6 pb-8 flex items-center justify-between shrink-0 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCameraCapture}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              title="Camera"
              aria-label="Take a photo"
            >
              <Camera className="w-7 h-7" />
            </button>
            <button
              type="button"
              onClick={handleGalleryClick}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              title="Gallery"
              aria-label="Pick from gallery"
            >
              <ImageIcon className="w-7 h-7" />
            </button>
            <button
              type="button"
              onClick={isRecordingVoice ? handleStopAudioRecording : handleStartAudioRecording}
              className={`p-2 rounded-full transition-colors ${
                isRecordingVoice ? 'text-rose-500 bg-rose-500/20' : 'text-white hover:bg-white/20'
              }`}
              title={isRecordingVoice ? 'Stop Recording' : 'Record Voice'}
              aria-label={isRecordingVoice ? 'Stop recording' : 'Record voice note'}
            >
              <Mic className="w-7 h-7" />
            </button>
            {/* Exclude from Status */}
            <button
              type="button"
              onClick={() => setIsExcludeSheetOpen(true)}
              className={`p-2 rounded-full transition-colors relative ${
                excludedUsers.length > 0 ? 'text-amber-400 bg-amber-400/20' : 'text-white hover:bg-white/20'
              }`}
              title="Exclude people from Status"
              aria-label="Exclude people from Status"
            >
              <EyeOff className="w-7 h-7" />
              {excludedUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                  {excludedUsers.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePublish}
            className="px-6 py-3 rounded-full bg-white text-purple-700 font-bold text-[15px] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            aria-label="Share Cycle"
          >
            Share Cycle
          </button>
        </div>

        {/* Exclude from Status Sheet */}
        {isExcludeSheetOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end animate-in fade-in"
            onClick={() => setIsExcludeSheetOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-neutral-950 border-t border-neutral-800 rounded-t-3xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom max-h-[75vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Hide Status from</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Selected people won't see this Status</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExcludeSheetOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search people..."
                value={excludeSearch}
                onChange={(e) => setExcludeSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 transition-colors"
                aria-label="Search people to exclude"
              />

              {/* Currently excluded */}
              {excludedUsers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide font-bold">Excluded ({excludedUsers.length})</p>
                  {excludedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between py-2 px-1">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-white text-sm font-bold">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-medium">{user.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExcludedUsers(prev => prev.filter(u => u.id !== user.id))}
                        aria-label={`Remove ${user.name} from exclusion list`}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Hint: In a real app, show a list of followers to pick from */}
              <p className="text-center text-neutral-600 text-xs py-2">
                {excludeSearch
                  ? 'Follower search results will appear here when connected.'
                  : excludedUsers.length === 0
                  ? 'Type a name to search your followers and exclude them.'
                  : ''}
              </p>

              <button
                type="button"
                onClick={() => setIsExcludeSheetOpen(false)}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaFileSelected(file, 'photo');
            e.target.value = '';
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaFileSelected(file, 'video');
            e.target.value = '';
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaFileSelected(file, file.type.startsWith('video') ? 'video' : 'photo');
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
