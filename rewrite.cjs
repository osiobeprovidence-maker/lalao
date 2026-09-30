const fs = require('fs');
const filePath = 'src/components/cycles/CreateCycleModal.tsx';
const content = fs.readFileSync(filePath, 'utf-8');
const index = content.indexOf('  return (');

const newJsx = `  return (
    <div
      id="create-cycle-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden animate-in fade-in duration-200"
    >
      <div
        ref={containerRef}
        id="create-cycle-fullscreen"
        className={\`relative w-full h-full max-w-[500px] flex flex-col transition-colors duration-500 \${
          contentType === 'text' ? \\\`bg-gradient-to-br \${selectedGradient}\\\` : 'bg-black'
        }\`}
      >
        {/* Media Background */}
        {contentType !== 'text' && selectedMedia && (
          <div className="absolute inset-0 z-0">
            {mediaType === 'video' ? (
              <video src={selectedMedia} autoPlay loop muted playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={selectedMedia} alt="Preview" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/30" />
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
            <button
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

          {selectedStickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onPointerDown={(event) => handleStickerPointerDown(event, sticker.id)}
              onClick={() => setActiveStickerId(sticker.id)}
              className={\`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border text-5xl shadow-lg transition \${
                activeStickerId === sticker.id ? 'border-white/80 bg-black/10' : 'border-transparent bg-transparent'
              }\`}
              style={{
                left: \`\${sticker.x}%\`,
                top: \`\${sticker.y}%\`,
                transform: \`translate(-50%, -50%) rotate(\${sticker.rotation}deg) scale(\${sticker.scale})\`,
              }}
            >
              <span className={sticker.animated ? 'animate-pulse' : ''}>{sticker.asset}</span>
            </button>
          ))}
        </div>

        {/* Recording Indicator */}
        {isRecordingVoice && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-rose-500/90 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white" />
            Recording... {recordingSeconds}s
          </div>
        )}
        
        {/* Audio Preview Indicator */}
        {audioUrl && !isRecordingVoice && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-lg">
            <Volume2 className="w-4 h-4 text-[#5E43F3]" />
            Audio attached
            <button onClick={() => { setAudioUrl(null); setContentType('text'); }} className="ml-2 text-rose-400 hover:text-rose-300">
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
                    className={\`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap \${
                      stickerCollection === collection.id ? 'bg-[#5E43F3] text-white' : 'bg-neutral-100 text-neutral-600'
                    }\`}
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
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="relative z-30 px-6 py-6 pb-8 flex items-center justify-between shrink-0 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <button
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
            </button>
          </div>

          <button
            type="button"
            onClick={handlePublish}
            className="px-6 py-3 rounded-full bg-white text-purple-700 font-bold text-[15px] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Share Cycle
          </button>
        </div>

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
      </div>
    </div>
  );
}
`;

if (index !== -1) {
    const newContent = content.substring(0, index) + newJsx;
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully updated CreateCycleModal.tsx');
} else {
    console.log('Could not find "  return (" in the file');
}
