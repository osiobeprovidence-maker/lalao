import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Upload,
  Music,
  Play,
  Pause,
  Sliders,
  Check,
  AlertCircle,
  Sparkles,
  Lock,
  Globe,
  Radio,
  FileAudio,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { WaveformVisualizer } from './WaveformVisualizer';
import {
  getAudioContext,
  decodeAudioBlob,
  sliceAudioBuffer,
  bufferToWaveBlob,
  extractWaveformFromBuffer,
  PRESET_SOUNDS,
  generateSynthesizedBuffer,
  PresetSoundDef,
} from '../../services/audio/soundEngine';

interface CreateSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSoundCreated?: (sound: any) => void;
}

export const CreateSoundModal: React.FC<CreateSoundModalProps> = ({
  isOpen,
  onClose,
  onSoundCreated,
}) => {
  const { currentUser, requireAuth } = useLalao();
  const generateUploadUrl = useMutation(api.sounds.generateAudioUploadUrl);
  const createSoundMutation = useMutation(api.sounds.createSound);

  const [activeMode, setActiveMode] = useState<'record' | 'upload' | 'presets'>('record');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);

  // Audio source buffer & waveform
  const [loadedBuffer, setLoadedBuffer] = useState<AudioBuffer | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);

  // Trimming state (in seconds)
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(15);
  const [maxDuration, setMaxDuration] = useState<number>(15);

  // Preview playback state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewIntervalRef = useRef<any>(null);

  // Metadata form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'music' | 'original' | 'effects' | 'voice'>('original');
  const [genre, setGenre] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Submit & Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopPreview();
      stopRecording();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setLoadedBuffer(null);
    setWaveformPeaks([]);
    setOriginalBlob(null);
    setTrimStart(0);
    setTrimEnd(15);
    setMaxDuration(15);
    setTitle('');
    setDescription('');
    setCategory('original');
    setGenre('');
    setVisibility('public');
    setErrorMsg(null);
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    setIsPlayingPreview(false);
    setPreviewProgress(0);
  };

  // --- RECORDING HANDLERS ---
  const startRecording = async () => {
    setErrorMsg(null);
    stopPreview();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processRawAudioBlob(blob, 'voice');
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setErrorMsg('Microphone access was denied or not supported on this device.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // --- FILE UPLOAD HANDLER ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    stopPreview();

    const fileName = file.name.replace(/\.[^/.]+$/, '');
    if (!title) setTitle(fileName);

    const isEffect = file.size < 500000 && file.type.includes('audio');
    await processRawAudioBlob(file, isEffect ? 'effects' : 'music');
  };

  // --- PRESET SELECTION HANDLER ---
  const handleSelectPreset = async (preset: PresetSoundDef) => {
    stopPreview();
    setErrorMsg(null);
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setGenre(preset.genre);

    try {
      const buffer = await generateSynthesizedBuffer(preset.type, preset.duration);
      const peaks = await extractWaveformFromBuffer(buffer, 48);
      const blob = bufferToWaveBlob(buffer);
      setLoadedBuffer(buffer);
      setWaveformPeaks(peaks);
      setOriginalBlob(blob);
      setTrimStart(0);
      setTrimEnd(Math.min(60, buffer.duration));
      setMaxDuration(buffer.duration);
    } catch {
      setErrorMsg('Failed to generate preset audio buffer.');
    }
  };

  // Common processor for recorded or uploaded blob
  const processRawAudioBlob = async (blob: Blob, suggestedCategory: 'music' | 'original' | 'effects' | 'voice') => {
    try {
      const buffer = await decodeAudioBlob(blob);
      const duration = buffer.duration;
      if (duration < 0.3) {
        setErrorMsg('Audio clip is too short. Please record or upload at least 1 second.');
        return;
      }
      const peaks = await extractWaveformFromBuffer(buffer, 48);
      setLoadedBuffer(buffer);
      setWaveformPeaks(peaks);
      setOriginalBlob(blob);
      setCategory(suggestedCategory);
      setTrimStart(0);
      setTrimEnd(Math.min(60, Math.round(duration * 10) / 10));
      setMaxDuration(Math.round(duration * 10) / 10);
    } catch {
      setErrorMsg('Could not decode audio. Please ensure the file is an audio format (MP3, WAV, M4A, AAC).');
    }
  };

  // --- PREVIEW TRIMMED AUDIO ---
  const togglePlayPreview = () => {
    if (!loadedBuffer) return;

    if (isPlayingPreview) {
      stopPreview();
      return;
    }

    try {
      // Slice buffer to trim range
      const sliced = sliceAudioBuffer(loadedBuffer, trimStart, trimEnd);
      const slicedBlob = bufferToWaveBlob(sliced);
      const url = URL.createObjectURL(slicedBlob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;

      const duration = trimEnd - trimStart;

      audio.onended = () => {
        stopPreview();
      };

      audio.play().then(() => {
        setIsPlayingPreview(true);
        previewIntervalRef.current = setInterval(() => {
          if (audio) {
            const prog = (audio.currentTime / (duration || 1));
            setPreviewProgress(Math.min(1, prog));
          }
        }, 80);
      }).catch(() => {
        stopPreview();
      });
    } catch {
      stopPreview();
    }
  };

  // --- PUBLISH SOUND ---
  const handlePublish = () => {
    requireAuth(async () => {
      if (!title.trim()) {
        setErrorMsg('Please enter a sound title.');
        return;
      }
      if (!loadedBuffer) {
        setErrorMsg('Please record audio, upload a sound file, or select a preset.');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg(null);
      stopPreview();

      try {
        // Render final trimmed buffer
        const finalDuration = Math.max(0.5, Math.min(60, trimEnd - trimStart));
        const finalSliced = sliceAudioBuffer(loadedBuffer, trimStart, trimEnd);
        const finalBlob = bufferToWaveBlob(finalSliced);
        const finalPeaks = await extractWaveformFromBuffer(finalSliced, 40);

        // 1. Get upload URL from Convex
        const postUrl = await generateUploadUrl();

        // 2. Upload file blob
        const uploadRes = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'audio/wav' },
          body: finalBlob,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload audio to cloud storage');
        }

        const { storageId } = await uploadRes.json();

        // 3. Save to sounds table
        const soundDoc = await createSoundMutation({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          genre: genre.trim() || undefined,
          tags: genre ? [genre.toLowerCase()] : [],
          duration: Math.round(finalDuration * 10) / 10,
          audioUrl: `storage:${storageId}`,
          audioStorageId: storageId,
          waveform: finalPeaks,
          visibility,
          isOfficial: false,
          license: 'Original Sound / Royalty-Free on LaLao',
          authorUserId: currentUser?.id,
        });

        if (onSoundCreated) {
          onSoundCreated(soundDoc);
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to publish sound. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, 'Sign in to create and publish original sounds');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F1422] border border-white/10 shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-[#0F1422]/90 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#5E43F3]/20 flex items-center justify-center text-[#5E43F3]">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Original Sound</h2>
              <p className="text-[11px] text-gray-400">Record, trim, and publish music or voice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/5">
            <button
              onClick={() => { setActiveMode('record'); stopPreview(); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMode === 'record'
                  ? 'bg-[#5E43F3] text-white shadow-lg shadow-[#5E43F3]/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record</span>
            </button>
            <button
              onClick={() => { setActiveMode('upload'); stopPreview(); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMode === 'upload'
                  ? 'bg-[#5E43F3] text-white shadow-lg shadow-[#5E43F3]/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
            <button
              onClick={() => { setActiveMode('presets'); stopPreview(); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeMode === 'presets'
                  ? 'bg-[#5E43F3] text-white shadow-lg shadow-[#5E43F3]/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
          </div>

          {/* Active Mode Panels */}
          {activeMode === 'record' && (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <div className="relative mb-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                      : 'bg-[#5E43F3] text-white hover:bg-[#5E43F3]/90 shadow-lg shadow-[#5E43F3]/30 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isRecording ? <div className="w-6 h-6 rounded-md bg-white" /> : <Mic className="w-8 h-8" />}
                </button>
                {isRecording && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-white">
                {isRecording ? `Recording (${recordingSeconds}s / 60s)` : 'Tap microphone to start recording'}
              </div>
              <p className="mt-1 text-xs text-gray-400 max-w-xs">
                Speak, sing, or capture original environmental audio up to 60 seconds.
              </p>
            </div>
          )}

          {activeMode === 'upload' && (
            <label className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.03] border border-dashed border-white/15 hover:border-[#5E43F3]/60 cursor-pointer transition-colors group">
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#5E43F3]/15 text-[#5E43F3] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileAudio className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-white">Select Audio File</span>
              <span className="mt-1 text-xs text-gray-400">Supports MP3, WAV, AAC, M4A (Max 15MB)</span>
            </label>
          )}

          {activeMode === 'presets' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Royalty-Free Audio Library
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {PRESET_SOUNDS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#5E43F3]/40 text-left transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#5E43F3]/20 flex items-center justify-center text-[#5E43F3] shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{preset.title}</div>
                      <div className="text-[10px] text-gray-400 truncate">{preset.genre} • {preset.duration}s</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Waveform & Trimmer Panel (Visible when buffer is loaded) */}
          {loadedBuffer && (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#5E43F3]" />
                  <span className="text-xs font-bold text-white">Audio Waveform & Trim</span>
                </div>
                <div className="text-xs font-mono text-[#5E43F3]">
                  Duration: {(trimEnd - trimStart).toFixed(1)}s
                </div>
              </div>

              {/* Waveform */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <WaveformVisualizer
                  waveform={waveformPeaks}
                  isPlaying={isPlayingPreview}
                  progress={previewProgress}
                  height={42}
                />
              </div>

              {/* Trimmer controls */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Start Offset: {trimStart.toFixed(1)}s</label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, trimEnd - 0.5)}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => {
                      setTrimStart(parseFloat(e.target.value));
                      stopPreview();
                    }}
                    className="w-full accent-[#5E43F3]"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">End Offset: {trimEnd.toFixed(1)}s</label>
                  <input
                    type="range"
                    min={trimStart + 0.5}
                    max={maxDuration}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) => {
                      setTrimEnd(parseFloat(e.target.value));
                      stopPreview();
                    }}
                    className="w-full accent-[#5E43F3]"
                  />
                </div>
              </div>

              {/* Preview Button */}
              <button
                type="button"
                onClick={togglePlayPreview}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {isPlayingPreview ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#5E43F3]" />
                    <span>Pause Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#5E43F3] fill-[#5E43F3]" />
                    <span>Play Trimmed Section</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Metadata Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Sound Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lagos Morning Chill"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#5E43F3] text-sm text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#161B2E] border border-white/10 text-xs text-white outline-none focus:border-[#5E43F3]"
                >
                  <option value="original">Original Sound</option>
                  <option value="music">Music</option>
                  <option value="effects">Sound Effect</option>
                  <option value="voice">Voice / Speech</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Genre / Tag</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Afrobeats, Lofi, Comedy"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#5E43F3] text-xs text-white placeholder-gray-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your sound or suggest how creators can use it..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#5E43F3] text-xs text-white placeholder-gray-500 outline-none resize-none transition-colors"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2.5">
                {visibility === 'public' ? (
                  <Globe className="w-4 h-4 text-[#5E43F3]" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">
                    {visibility === 'public' ? 'Public Sound' : 'Private Sound'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {visibility === 'public'
                      ? 'Anyone can discover and reuse this sound in their videos'
                      : 'Only visible and usable by you'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  visibility === 'public'
                    ? 'border-[#5E43F3]/40 bg-[#5E43F3]/15 text-[#5E43F3]'
                    : 'border-white/10 bg-white/5 text-gray-400'
                }`}
              >
                {visibility === 'public' ? 'Public' : 'Private'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 px-5 py-4 bg-[#0F1422]/95 backdrop-blur-md border-t border-white/5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isSubmitting || !loadedBuffer || !title.trim()}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#5E43F3] hover:bg-[#5E43F3]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-[#5E43F3]/25 flex items-center gap-2 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Publish Sound</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
