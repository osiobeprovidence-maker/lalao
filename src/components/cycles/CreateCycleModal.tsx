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
type ContentType = 'photo' | 'video' | 'text' | 'voice';

const BG_GRADIENTS = [
  { id: 'violet', label: 'Violet Twilight', value: 'from-violet-600 to-indigo-800' },
  { id: 'rose', label: 'Sunset Crimson', value: 'from-fuchsia-600 to-rose-600' },
  { id: 'amber', label: 'Warm Amber', value: 'from-amber-500 to-orange-600' },
  { id: 'emerald', label: 'Delta Emerald', value: 'from-emerald-600 to-teal-700' },
  { id: 'ocean', label: 'Deep River', value: 'from-sky-600 to-blue-900' },
  { id: 'slate', label: 'Dark Midnight', value: 'from-neutral-800 to-neutral-950' },
];

const FONTS_LIST = [
  { id: 'sans', name: 'Clean Sans', className: 'font-sans' },
  { id: 'serif', name: 'Editorial Serif', className: 'font-serif' },
  { id: 'mono', name: 'Mono Code', className: 'font-mono' },
];

const MUSIC_TRACKS = [
  { id: 'track_1', title: 'Afrobeats Vibe (Trending)', artist: 'Lalao Sounds', duration: '0:30' },
  { id: 'track_2', title: 'Lagos Sunset Breeze', artist: 'Delta Groove', duration: '0:28' },
  { id: 'track_3', title: 'Acoustic Morning', artist: 'Local Strings', duration: '0:35' },
];

const STICKERS_LIST = ['🔥', '🎾', '☕️', '📍', '⚽️', '✨', '🚀', '🎉', '💡', '❤️'];

export const CreateCycleModal: React.FC<CreateCycleModalProps> = ({ isOpen, onClose }) => {
  const { location, postCycleStory, permissions, setActivePermissionPrompt, triggerShareToast, currentUser } = useLalao();

  const [step, setStep] = useState<CreateStep>('choose');
  const [contentType, setContentType] = useState<ContentType>('photo');
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(BG_GRADIENTS[0].value);
  const [selectedFont, setSelectedFont] = useState(FONTS_LIST[0].className);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<'community' | 'nearby' | 'friends'>('community');
  const [isAudienceSheetOpen, setIsAudienceSheetOpen] = useState(false);
  const [activeStickers, setActiveStickers] = useState<string[]>([]);
  const [galleryTab, setGalleryTab] = useState<'photos' | 'videos'>('photos');

  const containerRef = useRef<HTMLDivElement>(null);
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

  return (
    <div
      ref={containerRef}
      id="create-cycle-fullscreen-wizard"
      className="fixed inset-0 z-50 bg-[#f6f3ee] text-neutral-900 flex flex-col min-h-full overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#f6f3ee]/90 backdrop-blur-md border-b border-neutral-200 px-4 py-3.5 flex items-center justify-between shrink-0">
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

      <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 pb-24 flex flex-col justify-center">
        {/* ========================================================
           STEP 2: CHOOSE WHAT TO POST (Photo, Video, Text, Voice)
           ======================================================== */}
        {step === 'choose' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Post What Matters
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                Share photos, videos, text, voice and more — your way.
              </p>
            </div>

                <div className="space-y-3 pt-2">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Write your status</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Write your status..."
                  rows={4}
                  className="mt-2 w-full resize-none border-0 bg-transparent text-base text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 text-neutral-200 transition hover:border-[#5E43F3] hover:bg-[#5E43F3]/10"
                >
                  <ImageIcon className="h-5 w-5 text-[#5E43F3]" />
                  <span className="text-xs font-semibold">Add Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 text-neutral-200 transition hover:border-[#5E43F3] hover:bg-[#5E43F3]/10"
                >
                  <VideoIcon className="h-5 w-5 text-[#5E43F3]" />
                  <span className="text-xs font-semibold">Add Video</span>
                </button>

                <button
                  type="button"
                  onClick={isRecordingVoice ? handleStopAudioRecording : handleStartAudioRecording}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 text-neutral-200 transition hover:border-[#5E43F3] hover:bg-[#5E43F3]/10"
                >
                  <Mic className={`h-5 w-5 ${isRecordingVoice ? 'text-rose-500' : 'text-[#5E43F3]'}`} />
                  <span className="text-xs font-semibold">{isRecordingVoice ? 'Stop' : 'Record'}</span>
                </button>
              </div>

              {audioError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">{audioError}</div>
              )}

              {audioUrl && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Audio preview</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioUrl(null);
                        setSelectedAudio(null);
                        setContentType('text');
                      }}
                      className="text-xs font-semibold text-neutral-400 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                  <audio controls src={audioUrl} className="w-full" />
                </div>
              )}

              {selectedMedia && (
                <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/80 p-2">
                  {mediaType === 'video' ? (
                    <video src={selectedMedia} controls className="h-48 w-full rounded-xl object-cover" />
                  ) : (
                    <img src={selectedMedia} alt="Status media" className="h-48 w-full rounded-xl object-cover" />
                  )}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedMedia('')}
                      className="text-xs font-semibold text-neutral-400 hover:text-white"
                    >
                      Remove media
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
                <button
                  type="button"
                  onClick={() => setIsAudienceSheetOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Audience</span>
                  <span className="text-sm font-semibold text-white">{selectedAudience}</span>
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
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${selectedAudience === option ? 'border-[#5E43F3] bg-[#5E43F3]/10 text-white' : 'border-neutral-700 bg-neutral-900 text-neutral-300'}`}
                      >
                        <span className="capitalize">{option}</span>
                        {selectedAudience === option && <Check className="h-4 w-4 text-[#5E43F3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="rounded-full bg-[#5E43F3] px-4 py-2 text-sm font-bold text-white"
              >
                Review status
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900"
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
          <div className="space-y-5 animate-in fade-in">
            {/* Live Editing Preview Canvas */}
            <div
              className={`w-full aspect-[4/5] max-h-[420px] rounded-3xl overflow-hidden relative flex flex-col justify-between p-6 shadow-2xl border border-neutral-800 ${
                contentType === 'text'
                  ? `bg-gradient-to-br ${selectedGradient}`
                  : 'bg-black'
              }`}
            >
              {contentType !== 'text' && (
                <div className="absolute inset-0 z-0">
                  {mediaType === 'video' ? (
                    <video src={selectedMedia} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={selectedMedia} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
              )}

              {/* Top badges in preview */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-bold text-white border border-white/20">
                  Live Preview
                </span>
                {selectedAudio && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#5E43F3]/80 backdrop-blur-md text-[11px] font-bold text-white">
                    <Music className="w-3 h-3" />
                    <span>Audio Attached</span>
                  </span>
                )}
              </div>

              {/* Editable Text Overlay */}
              <div className="relative z-10 my-auto">
                <textarea
                  id="input-story-caption"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your caption or story message..."
                  rows={3}
                  className={`w-full bg-transparent text-white text-center font-bold text-lg sm:text-xl placeholder:text-white/70 focus:outline-none resize-none drop-shadow-lg ${selectedFont}`}
                />
              </div>

              {/* Stickers Attached */}
              <div className="relative z-10 flex items-center justify-center gap-2">
                {activeStickers.map((st, i) => (
                  <span key={i} className="text-2xl drop-shadow-md animate-bounce">
                    {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Customization Toolbars */}
            {contentType === 'text' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400">Background Theme</label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {BG_GRADIENTS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGradient(g.value)}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${g.value} shrink-0 transition-transform flex items-center justify-center cursor-pointer ${
                        selectedGradient === g.value ? 'ring-2 ring-white scale-110' : 'opacity-80'
                      }`}
                    >
                      {selectedGradient === g.value && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Font Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400">Typography Font Style</label>
              <div className="grid grid-cols-3 gap-2">
                {FONTS_LIST.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFont(f.className)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedFont === f.className
                        ? 'bg-[#5E43F3] border-[#5E43F3] text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stickers Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400">Add Stickers & Emojis</label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {STICKERS_LIST.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      if (!activeStickers.includes(st)) {
                        setActiveStickers([...activeStickers, st]);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xl cursor-pointer"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
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
  );
};
