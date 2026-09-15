import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Type,
  Mic,
  Clock,
  Check,
  Upload,
  Camera,
  Music,
  Smile,
  Edit3,
  Sliders,
  Crop,
  ArrowLeft,
  Send,
  Share2,
  Volume2,
  Layers,
  CheckCircle2,
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

const GALLERY_ITEMS = [
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    label: 'Udu Riverside Sunset',
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    label: 'Local Cafe & Pastry',
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    label: 'DSC Kickabout Pitch',
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    label: 'Local Banga Kitchen',
  },
  {
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41528-large.mp4',
    label: 'City Night Traffic',
  },
  {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    label: 'Community Hangout',
  },
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
  const [selectedMedia, setSelectedMedia] = useState(GALLERY_ITEMS[0].url);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [textContent, setTextContent] = useState('Good vibes only ✨');
  const [selectedGradient, setSelectedGradient] = useState(BG_GRADIENTS[0].value);
  const [selectedFont, setSelectedFont] = useState(FONTS_LIST[0].className);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [activeStickers, setActiveStickers] = useState<string[]>(['✨']);
  const [galleryTab, setGalleryTab] = useState<'photos' | 'videos'>('photos');

  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleCameraCapture = () => {
    if (permissions.camera !== 'granted') {
      setActivePermissionPrompt('camera');
      return;
    }
    setSelectedMedia('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80');
    setMediaType('image');
    triggerShareToast('Camera snapshot captured!');
    setStep('customize');
  };

  const handlePublish = () => {
    postCycleStory({
      mediaType: contentType === 'text' ? 'text' : mediaType,
      text: contentType === 'text' || textContent ? textContent : undefined,
      backgroundColor: contentType === 'text' ? selectedGradient : undefined,
      mediaUrl: contentType !== 'text' ? selectedMedia : undefined,
      caption: textContent,
      location: location.name,
    });
    triggerShareToast('Status published to your 24h Cycle!');
    onClose();
  };

  return (
    <div
      ref={containerRef}
      id="create-cycle-fullscreen-wizard"
      className="fixed inset-0 z-50 bg-neutral-950 flex flex-col min-h-full overflow-y-auto animate-in fade-in duration-200 text-white"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3.5 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => {
            if (step === 'choose') onClose();
            else if (step === 'gallery' || step === 'customize') setStep('choose');
            else if (step === 'audio') setStep('customize');
            else if (step === 'preview') setStep('customize');
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          {step !== 'choose' && <ArrowLeft className="w-4 h-4" />}
          <span>{step === 'choose' ? 'Cancel' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#5E43F3] to-fuchsia-500 animate-pulse" />
          <h3 className="font-bold text-sm sm:text-base text-white">
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

            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Photo Card */}
              <div
                onClick={() => handleSelectContentType('photo')}
                className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 active:scale-98 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 shadow-xl border border-blue-400/30 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Photo</h4>
                  <p className="text-[11px] text-blue-100/80 mt-0.5">Select gallery or camera</p>
                </div>
              </div>

              {/* Video Card */}
              <div
                onClick={() => handleSelectContentType('video')}
                className="p-5 rounded-3xl bg-gradient-to-br from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-600 active:scale-98 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 shadow-xl border border-purple-400/30 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <VideoIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Video</h4>
                  <p className="text-[11px] text-purple-100/80 mt-0.5">Choose video clip</p>
                </div>
              </div>

              {/* Text Card */}
              <div
                onClick={() => handleSelectContentType('text')}
                className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-98 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 shadow-xl border border-emerald-400/30 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Type className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Text Status</h4>
                  <p className="text-[11px] text-emerald-100/80 mt-0.5">Custom gradient background</p>
                </div>
              </div>

              {/* Voice Card */}
              <div
                onClick={() => handleSelectContentType('voice')}
                className="p-5 rounded-3xl bg-gradient-to-br from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 active:scale-98 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 shadow-xl border border-rose-400/30 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Voice & Audio</h4>
                  <p className="text-[11px] text-rose-100/80 mt-0.5">Record voice or add music</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
              <p className="text-xs text-neutral-400">
                ⚡ Status updates are shared with your community and disappear automatically after 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
           STEP 3: SELECT FROM GALLERY OR CAMERA
           ======================================================== */}
        {step === 'gallery' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Gallery Top Tabs */}
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

              {/* Upload Custom File button */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span>Upload file</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = (evt) => {
                        if (evt.target?.result) {
                          setSelectedMedia(evt.target.result as string);
                          setMediaType(f.type.startsWith('video') ? 'video' : 'image');
                          setStep('customize');
                        }
                      };
                      r.readAsDataURL(f);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Gallery Grid including Camera tile first */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {/* Camera Snapshot Tile */}
              <div
                onClick={handleCameraCapture}
                className="aspect-square rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#5E43F3]/20 flex items-center justify-center text-[#5E43F3] group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-neutral-300">Camera</span>
              </div>

              {/* Gallery Items */}
              {GALLERY_ITEMS.filter((item) => (galleryTab === 'photos' ? item.type === 'image' : item.type === 'video')).map(
                (item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedMedia(item.url);
                      setMediaType(item.type === 'video' ? 'video' : 'image');
                      setStep('customize');
                    }}
                    className={`aspect-square rounded-2xl overflow-hidden relative cursor-pointer border-2 transition-all ${
                      selectedMedia === item.url ? 'border-[#5E43F3] scale-98 shadow-lg' : 'border-transparent hover:opacity-90'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                    )}
                    {selectedMedia === item.url && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                )
              )}
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
                onClick={() => {
                  setIsRecordingVoice(!isRecordingVoice);
                  if (!isRecordingVoice) {
                    triggerShareToast('Recording voice note...');
                  } else {
                    setSelectedAudio('Voice Note (0:12)');
                    triggerShareToast('Voice note attached!');
                  }
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-lg ${
                  isRecordingVoice ? 'bg-rose-600 animate-pulse scale-110' : 'bg-[#5E43F3] hover:bg-[#4E34E0]'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>
              <span className="text-xs font-bold text-neutral-300">
                {isRecordingVoice ? 'Recording... Tap to stop' : 'Tap to record voice message'}
              </span>
            </div>

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
