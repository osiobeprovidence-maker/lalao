const fs = require('fs');
const filePath = 'src/components/cycles/CreateCycleModal.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Aspect Ratio Fix
const oldMediaBg = `{/* Media Background */}
        {contentType !== 'text' && selectedMedia && (
          <div className="absolute inset-0 z-0">
            {mediaType === 'video' ? (
              <video src={selectedMedia} autoPlay loop muted playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={selectedMedia} alt="Preview" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}`;

const newMediaBg = `{/* Media Background */}
        {contentType !== 'text' && selectedMedia && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden">
             {/* Blurred background for letterboxing */}
             <div className="absolute inset-0 z-0">
                {mediaType === 'video' ? (
                  <video src={selectedMedia} autoPlay loop muted playsInline className="h-full w-full object-cover opacity-40 blur-2xl scale-110" />
                ) : (
                  <img src={selectedMedia} alt="Background" className="h-full w-full object-cover opacity-40 blur-2xl scale-110" />
                )}
             </div>
             {/* Foreground properly contained */}
            {mediaType === 'video' ? (
              <video src={selectedMedia} autoPlay loop muted playsInline className="relative z-10 h-full w-full object-contain" />
            ) : (
              <img src={selectedMedia} alt="Preview" className="relative z-10 h-full w-full object-contain" />
            )}
            <div className="absolute inset-0 z-20 bg-black/10 pointer-events-none" />
          </div>
        )}`;
content = content.replace(oldMediaBg, newMediaBg);

// 2. Stickers Removable
const oldStickers = `{selectedStickers.map((sticker) => (
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
          ))}`;

const newStickers = `{selectedStickers.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute z-20"
              style={{
                left: \`\${sticker.x}%\`,
                top: \`\${sticker.y}%\`,
                transform: \`translate(-50%, -50%) rotate(\${sticker.rotation}deg) scale(\${sticker.scale})\`,
              }}
            >
              <button
                type="button"
                onPointerDown={(event) => handleStickerPointerDown(event, sticker.id)}
                onClick={() => setActiveStickerId(sticker.id)}
                className={\`flex items-center justify-center rounded-xl border text-5xl shadow-lg transition \${
                  activeStickerId === sticker.id ? 'border-white/80 bg-black/10' : 'border-transparent bg-transparent'
                }\`}
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
          ))}`;
content = content.replace(oldStickers, newStickers);

// 3. Caption / Text overlay distinction
const oldTextArea = `<textarea
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
          />`;

const newTextArea = `{contentType === 'text' ? (
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
          )}`;
content = content.replace(oldTextArea, newTextArea);

// 4. Draft reset logic
const oldUseEffect = `useEffect(() => {
    if (isOpen) {
      setStep('choose');
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isOpen]);`;

const newUseEffect = `useEffect(() => {
    if (isOpen) {
      // Clean slate on every open
      setStep('choose');
      setContentType('text');
      setSelectedMedia('');
      setMediaType('image');
      setTextContent('');
      setSelectedGradient(BG_GRADIENTS[0].value);
      setSelectedAudio(null);
      resetAudioRecording();
      setSelectedStickers([]);
      setActiveStickerId(null);
      setStickerLibraryOpen(false);
      setEmojiPickerOpen(false);
      
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
  }, [isOpen]);`;
content = content.replace(oldUseEffect, newUseEffect);

// 5. In-app camera video/photo recording preview
// To implement this fully we would need a lot of changes.
// The easiest fix for the camera recording issue is to add a proper in-app camera view mode.
// We'll add a 'camera' step and handle MediaRecorder for video.

// Add camera state
const stateAdditions = `  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const videoChunksRef = useRef<Blob[]>([]);`;

content = content.replace("const containerRef = useRef<HTMLDivElement>(null);", stateAdditions + "\\n  const containerRef = useRef<HTMLDivElement>(null);");

// Video recording functions
const videoRecordingFuncs = `  const startCameraPreview = async () => {
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
      photoInputRef.current?.click();
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
     setMediaType('image');
     setContentType('photo');
     setStep('customize');
     
     // Cleanup
     mediaStreamRef.current.getTracks().forEach(track => track.stop());
     mediaStreamRef.current = null;
  };
`;

content = content.replace("const handleCameraCapture = () => {", videoRecordingFuncs + "\\n  const handleCameraCapture = () => {");
content = content.replace("photoInputRef.current?.click();", "startCameraPreview();");

// Add camera step UI
const cameraUI = `        {step === 'camera' && (
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
               <button onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording} className={\`w-20 h-20 rounded-full border-4 \${isRecordingVideo ? 'border-red-500 bg-red-500/50' : 'border-white bg-red-500'}\`}>
               </button>
            </div>
          </div>
        )}
        
        {/* Media Background */}`;

content = content.replace("{/* Media Background */}", cameraUI);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated CreateCycleModal.tsx with fixes.');
