import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

interface CreateCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateStep = 'choose' | 'gallery' | 'customize' | 'audio' | 'preview';
type ContentType = 'photo' | 'video' | 'text' | 'voice' | 'audio';

const BG_GRADIENTS = [
  { id: 'violet', label: 'Violet Twilight', value: 'from-violet-600 to-indigo-800' },
  { id: 'rose', label: 'Sunset Crimson', value: 'from-fuchsia-600 to-rose-600' },
  { id: 'amber', label: 'Warm Amber', value: 'from-amber-500 to-orange-600' },
  { id: 'emerald', label: 'Delta Emerald', value: 'from-emerald-600 to-teal-700' },
  { id: 'ocean', label: 'Deep River', value: 'from-sky-600 to-blue-900' },
  { id: 'slate', label: 'Dark Midnight', value: 'from-neutral-800 to-neutral-950' },
];

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

  const [step, setStep] = useState<CreateStep>('choose');
  const [contentType, setContentType] = useState<ContentType>('photo');
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(BG_GRADIENTS[0].value);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].className);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('choose');
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const resetAudioRecording = () => {
    setAudioUrl(null);
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
    const url = URL.createObjectURL(file);
    if (kind === 'photo') {
      setSelectedMedia(url);
      setMediaType('image');
      setContentType('photo');
      setStep('customize');
      triggerShareToast('Photo attached to your status.');
    } else {
      setSelectedMedia(url);
      setMediaType('video');
      setContentType('video');
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
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const nextUrl = URL.createObjectURL(blob);
        setAudioUrl(nextUrl);
        setSelectedAudio('Voice note');
        setAudioError(null);
        setIsRecordingVoice(false);
        setRecordingSeconds(0);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (audioTimerRef.current) window.clearInterval(audioTimerRef.current);
        setStep('customize');
        setContentType('audio');
        triggerShareToast('Audio recording ready to post.');
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
    setIsRecordingVoice(false);
  };

  const handlePublish = () => {
    const finalMediaType: 'image' | 'video' | 'audio' | 'text' =
      contentType === 'audio' ? 'audio' : contentType === 'text' ? 'text' : mediaType;

    postCycleStory({
      mediaType: finalMediaType,
      text: contentType === 'text' || textContent ? textContent : undefined,
      backgroundColor: contentType === 'text' ? selectedGradient : undefined,
      mediaUrl: contentType !== 'text' && contentType !== 'audio' ? selectedMedia : audioUrl || undefined,
      caption: textContent || undefined,
      audience: selectedAudience,
      location: location.name,
    });
    triggerShareToast('Status published to your 24h Cycle!');
    resetAudioRecording();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="create-cycle-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        id="create-cycle-fullscreen-wizard"
        className="w-full max-w-[680px] bg-[#f6f3ee] text-neutral-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200 px-4 py-3.5 flex items-center justify-between shrink-0">
          <button
          type="button"
          onClick={() => {
            if (step === 'choose') onClose();
            else if (step === 'gallery' || step === 'customize') setStep('choose');
            else if (step === 'audio') setStep('customize');
            else if (step === 'preview') setStep('customize');
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
        >
          {step !== 'choose' && <ArrowLeft className="w-4 h-4" />}
          <span>{step === 'choose' ? 'Cancel' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm sm:text-base text-neutral-950">
            {step === 'choose' && 'Create Status'}
            {step === 'gallery' && 'Select from Gallery'}
            {step === 'customize' && 'Customize & Edit'}
            {step === 'audio' && 'Add Audio & Music'}
            {step === 'preview' && 'Review & Share'}
          </h3>
        </div>

        {step !== 'preview' ? (
          <button
            type="button"
            onClick={() => {
              if (step === 'choose') setStep('customize');
              else if (step === 'gallery') setStep('customize');
              else if (step === 'customize') setStep('preview');
              else if (step === 'audio') setStep('preview');
            }}
            className="px-4 py-1.5 rounded-full bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Next &rarr;
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        )}
      </div>

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

      <div className="flex-1 overflow-y-auto max-w-xl mx-auto w-full p-4 sm:p-6 pb-8 flex flex-col justify-center">
        {/* ========================================================
           STEP 2: CHOOSE WHAT TO POST (Photo, Video, Text, Voice)
           ======================================================== */}
        {step === 'choose' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Post What Matters
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500">
                Share photos, videos, text, voice and more — your way.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Write your status</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Write your status..."
                  rows={6}
                  className="mt-2 w-full resize-none border-0 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-neutral-700 transition hover:border-[#5E43F3] hover:bg-[#5E43F3]/5 shadow-sm"
                >
                  <ImageIcon className="h-5 w-5 text-[#5E43F3]" />
                  <span className="text-xs font-semibold">Add Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-neutral-700 transition hover:border-[#5E43F3] hover:bg-[#5E43F3]/5 shadow-sm"
                >
                  <VideoIcon className="h-5 w-5 text-[#5E43F3]" />
                  <span className="text-xs font-semibold">Add Video</span>
                </button>

                <button
                  type="button"
                  onClick={isRecordingVoice ? handleStopAudioRecording : handleStartAudioRecording}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-neutral-700 transition hover:border-rose-500 hover:bg-rose-50 shadow-sm"
                >
                  <Mic className={`h-5 w-5 ${isRecordingVoice ? 'text-rose-500' : 'text-[#5E43F3]'}`} />
                  <span className="text-xs font-semibold">{isRecordingVoice ? 'Stop' : 'Record'}</span>
                </button>
              </div>

              {audioError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">{audioError}</div>
              )}

              {audioUrl && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Audio preview</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioUrl(null);
                        setSelectedAudio(null);
                        setContentType('text');
                      }}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                    >
                      Remove
                    </button>
                  </div>
                  <audio controls src={audioUrl} className="w-full" />
                </div>
              )}

              {selectedMedia && (
                <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white p-2 shadow-sm">
                  {mediaType === 'video' ? (
                    <video src={selectedMedia} controls className="h-48 w-full rounded-xl object-cover" />
                  ) : (
                    <img src={selectedMedia} alt="Status media" className="h-48 w-full rounded-xl object-cover" />
                  )}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedMedia('')}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                    >
                      Remove media
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsAudienceSheetOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Audience</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-neutral-900 capitalize">{selectedAudience}</span>
                    <span className="text-neutral-400 text-xs">›</span>
                  </div>
                </button>
                {isAudienceSheetOpen && (
                  <div className="mt-3 space-y-2">
                    {(['community', 'nearby', 'friends'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedAudience(option);
                          setIsAudienceSheetOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${selectedAudience === option ? 'border-[#5E43F3] bg-[#5E43F3]/5 text-[#5E43F3] font-semibold' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'}`}
                      >
                        <span className="capitalize">{option}</span>
                        {selectedAudience === option && <Check className="h-4 w-4 text-[#5E43F3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 gap-3">
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 shadow-sm hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Review status
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="flex-1 rounded-full bg-[#5E43F3] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#4E34E0] transition-colors cursor-pointer"
              >
                Post Status
              </button>
            </div>

          </div>
        )}

        {/* ========================================================
           STEP 3: SELECT FROM GALLERY OR CAMERA
           ======================================================== */}
        {step === 'gallery' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setGalleryTab('photos')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    galleryTab === 'photos' ? 'bg-[#5E43F3] text-white' : 'text-neutral-400'
                  }`}
                >
                  Photos
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryTab('videos')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    galleryTab === 'videos' ? 'bg-[#5E43F3] text-white' : 'text-neutral-400'
                  }`}
                >
                  Videos
                </button>
              </div>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span>Upload file</span>
                <input
                  type="file"
                  accept={galleryTab === 'videos' ? 'video/*' : 'image/*'}
                  capture={galleryTab === 'videos' ? 'environment' : undefined}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleMediaFileSelected(file, galleryTab === 'videos' ? 'video' : 'photo');
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCameraCapture}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors cursor-pointer"
              >
                <Camera className="h-6 w-6 text-[#5E43F3]" />
                <span className="text-xs font-bold">Camera</span>
              </button>

              <button
                type="button"
                onClick={handleVideoCapture}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors cursor-pointer"
              >
                <VideoIcon className="h-6 w-6 text-[#5E43F3]" />
                <span className="text-xs font-bold">Video Camera</span>
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/60 p-4 text-center text-xs text-neutral-400">
              Choose a file from your device, or use the camera option above. No fake gallery content is used.
            </div>
          </div>
        )}

        {/* ========================================================
           STEP 4 & 5: CUSTOMIZE BACKGROUND, TEXT, STICKERS & FONTS
           ======================================================== */}
        {step === 'customize' && (
          <div className="space-y-5 animate-in fade-in lg:mx-auto lg:max-w-[1100px] lg:w-full">
            <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_340px] lg:gap-5">
              <div
                ref={previewRef}
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={handlePreviewPointerUp}
                onPointerLeave={handlePreviewPointerUp}
                className={`relative w-full max-w-[420px] lg:max-w-none mx-auto aspect-[4/5] overflow-hidden rounded-[28px] border border-neutral-200 shadow-[0_20px_50px_rgba(15,23,42,0.08)] ${
                  contentType === 'text' ? `bg-gradient-to-br ${selectedGradient}` : 'bg-neutral-900'
                }`}
              >
                {contentType !== 'text' && (
                  <div className="absolute inset-0 z-0">
                    {mediaType === 'video' ? (
                      <video src={selectedMedia} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <img src={selectedMedia} alt="Preview" className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-between px-4 pt-4">
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    Live Preview
                  </span>
                  {selectedAudio && (
                    <span className="flex items-center gap-1 rounded-full bg-[#5E43F3]/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                      <Music className="h-3 w-3" />
                      <span>Audio</span>
                    </span>
                  )}
                </div>

                <div className="relative z-10 my-auto flex min-h-[180px] items-center justify-center px-6 py-8">
                  <textarea
                    id="input-story-caption"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type your caption or story message..."
                    rows={3}
                    className={`w-full bg-transparent text-center font-bold text-lg text-white placeholder:text-white/70 focus:outline-none resize-none drop-shadow-lg ${selectedFont}`}
                  />
                </div>

                {selectedStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onPointerDown={(event) => handleStickerPointerDown(event, sticker.id)}
                    onClick={() => setActiveStickerId(sticker.id)}
                    className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border text-3xl shadow-lg transition ${
                      activeStickerId === sticker.id ? 'border-white/80 bg-black/10' : 'border-transparent bg-transparent'
                    }`}
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                    }}
                    title={sticker.label}
                  >
                    <span className={sticker.animated ? 'animate-pulse' : ''}>{sticker.asset}</span>
                  </button>
                ))}

                <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center px-4">
                  <div className="rounded-full bg-black/30 px-3 py-1 text-[11px] text-white/90 backdrop-blur-md">
                    {location.name} · 24h Cycle
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-white/80 rounded-[24px] border border-neutral-200 p-4 shadow-sm mt-4 lg:mt-0">
                {contentType === 'text' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Background</label>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {BG_GRADIENTS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGradient(g.value)}
                          className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-br ${g.value} transition-transform ${
                            selectedGradient === g.value ? 'scale-110 ring-2 ring-[#5E43F3]' : 'opacity-80'
                          }`}
                        >
                          {selectedGradient === g.value && <Check className="h-4 w-4 text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Typography</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setSelectedFont(font.className)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          selectedFont === font.className
                            ? 'border-[#5E43F3] bg-[#5E43F3]/5 shadow-sm'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className={`text-3xl leading-none ${font.className}`}>Aa</div>
                        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                          {font.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Sticker</label>
                    <button
                      type="button"
                      onClick={() => setStickerLibraryOpen((prev) => !prev)}
                      className="rounded-full bg-[#5E43F3] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4E34E0]"
                    >
                      + Add Sticker
                    </button>
                  </div>

                  {selectedStickers.length > 0 && (
                    <div className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2">
                      {selectedStickers.map((sticker) => (
                        <div key={sticker.id} className="flex items-center justify-between rounded-xl bg-white px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{sticker.asset}</span>
                            <span className="text-xs font-medium text-neutral-700">{sticker.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedStickers((prev) => prev.map((item) => item.id === sticker.id ? { ...item, rotation: item.rotation + 15 } : item))}
                              className="text-[10px] font-bold text-neutral-500"
                            >
                              Rotate
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedStickers((prev) => prev.filter((item) => item.id !== sticker.id))}
                              className="text-[10px] font-bold text-rose-500"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {stickerLibraryOpen && (
              <div className="rounded-[24px] border border-neutral-200 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <h4 className="text-sm font-bold text-neutral-900">Stickers</h4>
                  <button
                    type="button"
                    onClick={() => setStickerLibraryOpen(false)}
                    className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="relative">
                    <input
                      value={stickerSearch}
                      onChange={(event) => setStickerSearch(event.target.value)}
                      placeholder="Search stickers..."
                      className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-[#5E43F3]"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {STICKER_COLLECTIONS.map((collection) => (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => setStickerCollection(collection.id)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                          stickerCollection === collection.id
                            ? 'bg-[#5E43F3] text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {collection.name}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                    {filteredStickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => addSticker(sticker)}
                        className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-center transition hover:border-[#5E43F3] hover:bg-[#F6F3FF]"
                        title={sticker.label}
                      >
                        <span className="text-3xl leading-none">{sticker.asset}</span>
                        <span className="mt-2 text-[10px] font-semibold text-neutral-600">{sticker.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
           STEP 6: ADD AUDIO OR VOICE (Step 6 in diagram)
           ======================================================== */}
        {step === 'audio' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center space-y-1">
              <Music className="w-8 h-8 text-[#5E43F3] mx-auto" />
              <h3 className="text-lg font-bold text-white">Add Music or Voice</h3>
              <p className="text-xs text-neutral-400">Search trending tracks or record a voice note</p>
            </div>

            {/* Voice Recording Section */}
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={isRecordingVoice ? handleStopAudioRecording : handleStartAudioRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-lg ${
                  isRecordingVoice ? 'bg-rose-600 animate-pulse scale-110' : 'bg-[#5E43F3] hover:bg-[#4E34E0]'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>
              <span className="text-xs font-bold text-neutral-300">
                {isRecordingVoice ? `Recording... ${recordingSeconds}s` : 'Tap to record voice message'}
              </span>
              {audioError && (
                <span className="text-xs text-red-300">{audioError}</span>
              )}
            </div>

            {audioUrl && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Audio preview</span>
                  <button type="button" onClick={() => setAudioUrl(null)} className="text-xs font-semibold text-neutral-400 hover:text-white">Remove</button>
                </div>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}

            {/* Trending Music Tracks */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400">Trending Music</label>
              <div className="space-y-2">
                {MUSIC_TRACKS.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedAudio(track.title)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedAudio === track.title
                        ? 'bg-[#5E43F3]/20 border-[#5E43F3] text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{track.title}</h4>
                        <p className="text-[10px] text-neutral-400">{track.artist} · {track.duration}</p>
                      </div>
                    </div>
                    {selectedAudio === track.title && (
                      <CheckCircle2 className="w-5 h-5 text-[#5E43F3]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
           STEP 7: REVIEW & SHARE
           ======================================================== */}
        {step === 'preview' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Review & Share</h3>
              <p className="text-xs text-neutral-400">Preview your post and hit share when you are ready.</p>
            </div>

            {/* Final Preview Container */}
            <div className="w-full aspect-[4/5] max-h-[380px] rounded-3xl overflow-hidden relative flex flex-col justify-between p-6 shadow-2xl border border-neutral-800 bg-neutral-900 mx-auto max-w-[320px]">
              {contentType === 'text' ? (
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedGradient}`} />
              ) : (
                <div className="absolute inset-0">
                  <img src={selectedMedia} alt="Final Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                </div>
              )}

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-white bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                  @{currentUser.username || 'you'}
                </span>
                <span className="text-xs text-neutral-300">24h Cycle</span>
              </div>

              <div className="relative z-10 text-center my-auto">
                <p className={`text-white font-bold text-lg drop-shadow-md ${selectedFont}`}>
                  {textContent}
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-center gap-1 text-[11px] text-neutral-300 bg-black/40 py-1.5 px-3 rounded-full backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span>Active for 24 hours in {location.name}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePublish}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#5E43F3] to-fuchsia-600 hover:opacity-95 active:scale-98 text-white font-bold text-sm tracking-tight transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Publish Status to Cycle</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
