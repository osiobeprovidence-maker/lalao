const fs = require('fs');
const filePath = 'src/components/cycles/CreateCycleModal.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add EmojiPickerPopover import
content = content.replace(
  "import { useLalao } from '../../context/LalaoContext';",
  "import { useLalao } from '../../context/LalaoContext';\nimport { EmojiPickerPopover } from '../create/EmojiPickerPopover';"
);

// 2. Add Smile, Sticker to lucide-react imports
content = content.replace(
  "Clock,",
  "Clock,\n  Smile,\n  Sticker,"
);

// 3. Add emojiPickerOpen state and galleryInputRef
content = content.replace(
  "const [stickerSearch, setStickerSearch] = useState('');",
  "const [stickerSearch, setStickerSearch] = useState('');\n  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);"
);
content = content.replace(
  "const photoInputRef = useRef<HTMLInputElement | null>(null);",
  "const photoInputRef = useRef<HTMLInputElement | null>(null);\n  const galleryInputRef = useRef<HTMLInputElement | null>(null);"
);

// 4. Add handleEmojiSelect and handleGalleryClick
content = content.replace(
  "const handleSelectContentType = (type: ContentType) => {",
  `const handleEmojiSelect = (emoji: string) => {
    addSticker({ id: \`emoji-\${Date.now()}\`, asset: emoji, label: 'emoji', animated: false });
    setEmojiPickerOpen(false);
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleSelectContentType = (type: ContentType) => {`
);

// 5. Replace Top bar buttons (remove shadows, split emoji & sticker)
const oldTopBarButtons = `<button
              type="button"
              onClick={() => {
                const currentIndex = BG_GRADIENTS.findIndex(g => g.value === selectedGradient);
                const nextIndex = (currentIndex + 1) % BG_GRADIENTS.length;
                setSelectedGradient(BG_GRADIENTS[nextIndex].value);
                setContentType('text');
                setSelectedMedia('');
              }}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors shadow-sm"
              title="Change Background Color"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setStickerLibraryOpen((prev) => !prev)}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors shadow-sm"
              title="Stickers & Emojis"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setStep(step === 'audio' ? 'customize' : 'audio')}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors shadow-sm"
              title="Music"
            >
              <Music className="w-6 h-6" />
            </button>`;

const newTopBarButtons = `<button
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
            </button>`;
content = content.replace(oldTopBarButtons, newTopBarButtons);

// 6. Bottom Bar buttons (Gallery icon addition and remove shadows)
const oldBottomBarButtons = `<button
              type="button"
              onClick={handleCameraCapture}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors shadow-sm"
              title="Camera / Gallery"
            >
              <Camera className="w-7 h-7" />
            </button>
            <button
              type="button"
              onClick={isRecordingVoice ? handleStopAudioRecording : handleStartAudioRecording}
              className={\`p-2 rounded-full transition-colors shadow-sm \${
                isRecordingVoice ? 'text-rose-500 bg-rose-500/20' : 'text-white hover:bg-white/20'
              }\`}
              title={isRecordingVoice ? 'Stop Recording' : 'Record Voice'}
            >
              <Mic className="w-7 h-7" />
            </button>`;

const newBottomBarButtons = `<button
              type="button"
              onClick={handleCameraCapture}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              title="Camera"
            >
              <Camera className="w-7 h-7" />
            </button>
            <button
              type="button"
              onClick={handleGalleryClick}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              title="Gallery"
            >
              <ImageIcon className="w-7 h-7" />
            </button>
            <button
              type="button"
              onClick={isRecordingVoice ? handleStopAudioRecording : handleStartAudioRecording}
              className={\`p-2 rounded-full transition-colors \${
                isRecordingVoice ? 'text-rose-500 bg-rose-500/20' : 'text-white hover:bg-white/20'
              }\`}
              title={isRecordingVoice ? 'Stop Recording' : 'Record Voice'}
            >
              <Mic className="w-7 h-7" />
            </button>`;
content = content.replace(oldBottomBarButtons, newBottomBarButtons);

// 7. Add Selected Music Indicator
const errorIndicator = `{/* Error Indicator */}`;
const selectedMusicIndicator = `{/* Selected Music Indicator */}
        {selectedAudio && !isRecordingVoice && !audioUrl && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-lg">
            <Music className="w-4 h-4 text-[#5E43F3]" />
            {selectedAudio}
            <button onClick={() => { setSelectedAudio(null); }} className="ml-2 text-rose-400 hover:text-rose-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Error Indicator */}`;
content = content.replace(errorIndicator, selectedMusicIndicator);

// 8. Music UI redesign
const oldMusicTracks = `{MUSIC_TRACKS.map((track) => (
                <div
                  key={track.id}
                  onClick={() => { setSelectedAudio(track.title); setStep('customize'); }}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{track.title}</h4>
                      <p className="text-xs text-neutral-400">{track.artist} · {track.duration}</p>
                    </div>
                  </div>
                </div>
              ))}`;

const newMusicTracks = `{MUSIC_TRACKS.map((track) => (
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
              ))}`;
content = content.replace(oldMusicTracks, newMusicTracks);

// 9. Add Hidden Gallery Input
const hiddenVideoInput = `<input
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
        />`;
const newHiddenGalleryInput = `<input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaFileSelected(file, file.type.startsWith('video') ? 'video' : 'photo');
            e.target.value = '';
          }}
        />`;
content = content.replace(hiddenVideoInput, hiddenVideoInput + "\\n        " + newHiddenGalleryInput);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated CreateCycleModal.tsx');
