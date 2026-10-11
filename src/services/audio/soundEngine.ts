// Web Audio API Synthesizer, Recorder, Trimmer & Waveform Engine
// Royalty-free procedural sounds & authentic instruments without external CDN dependencies

export interface PresetSoundDef {
  id: string;
  title: string;
  creatorName: string;
  category: 'music' | 'original' | 'effects' | 'voice';
  genre: string;
  duration: number; // in seconds
  description: string;
  type: 'synth_afrobeat' | 'synth_lofi' | 'synth_upbeat' | 'synth_ambient' | 'sfx_whoosh' | 'sfx_pop' | 'sfx_scratch' | 'sfx_shutter';
}

export const PRESET_SOUNDS: PresetSoundDef[] = [
  {
    id: 'preset-afrobeat-vibes',
    title: 'Lagos Groove & Log Drum',
    creatorName: 'LaLao Originals',
    category: 'music',
    genre: 'Afrobeats',
    duration: 16,
    description: 'Bouncy syncopated percussion, warm log bass and chord stabs.',
    type: 'synth_afrobeat',
  },
  {
    id: 'preset-chill-lofi',
    title: 'Midnight Coffee Lofi',
    creatorName: 'Klyro Beats',
    category: 'music',
    genre: 'Lofi Hip Hop',
    duration: 15,
    description: 'Dusty vinyl chords, mellow Rhodes progression, and laid-back boom bap bounce.',
    type: 'synth_lofi',
  },
  {
    id: 'preset-upbeat-pop',
    title: 'Sunny Days Energy',
    creatorName: 'Nova Pulse',
    category: 'music',
    genre: 'Pop / Dance',
    duration: 12,
    description: 'Bright synth arpeggios, driving four-on-the-floor kick, and vibrant bass.',
    type: 'synth_upbeat',
  },
  {
    id: 'preset-ambient-pad',
    title: 'Golden Hour Dreamscape',
    creatorName: 'Aura Soundscapes',
    category: 'music',
    genre: 'Ambient',
    duration: 14,
    description: 'Lush atmospheric pads and soothing melodic chimes for aesthetic vlogs.',
    type: 'synth_ambient',
  },
  {
    id: 'preset-sfx-whoosh',
    title: 'Cinematic Transition Whoosh',
    creatorName: 'FX Studio',
    category: 'effects',
    genre: 'Sound Effects',
    duration: 1.2,
    description: 'Smooth stereo filtered white-noise sweep for video cut transitions.',
    type: 'sfx_whoosh',
  },
  {
    id: 'preset-sfx-scratch',
    title: 'Vinyl Rewind Scratch',
    creatorName: 'DJ Deck',
    category: 'effects',
    genre: 'Sound Effects',
    duration: 1.5,
    description: 'Classic turntablist vinyl brake scratch sound effect.',
    type: 'sfx_scratch',
  },
  {
    id: 'preset-sfx-pop',
    title: 'Juicy Bubble Pop',
    creatorName: 'Cartoon SFX',
    category: 'effects',
    genre: 'Sound Effects',
    duration: 0.6,
    description: 'Satisfying resonant pitch-drop bubble pop for comedic timing.',
    type: 'sfx_pop',
  },
  {
    id: 'preset-sfx-shutter',
    title: 'Camera Shutter Snap',
    creatorName: 'Snap Studio',
    category: 'effects',
    genre: 'Sound Effects',
    duration: 0.8,
    description: 'Mechanical shutter click and wind-up sound for photo reveals.',
    type: 'sfx_shutter',
  },
];

// AudioContext singleton helper
let sharedAudioCtx: AudioContext | null = null;
export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Convert AudioBuffer to 16-bit PCM WAV Blob
export function bufferToWaveBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataLength, true);

  // Write interleaved PCM samples
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // clamp
      sample = Math.max(-1, Math.min(1, sample));
      // convert to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Generate synthesized audio buffers offline
export async function generateSynthesizedBuffer(
  type: PresetSoundDef['type'],
  duration: number
): Promise<AudioBuffer> {
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate);

  if (type === 'synth_afrobeat') {
    // 112 BPM Syncopated Afrobeat rhythm + Log drum bass + Rhodes stabs
    const bpm = 112;
    const beatSec = 60 / bpm;
    const sixteenth = beatSec / 4;
    const totalSixteenths = Math.floor(duration / sixteenth);

    // Chords progression: Dm7 - G7 - Em7 - Am7
    const chords = [
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [246.94, 293.66, 392.0, 440.0],  // G7
      [329.63, 392.0, 493.88, 587.33], // Em7
      [220.0, 261.63, 329.63, 392.0],  // Am7
    ];

    for (let step = 0; step < totalSixteenths; step++) {
      const time = step * sixteenth;
      const beatInBar = step % 16;

      // Kick on 0, 6, 10
      if (beatInBar === 0 || beatInBar === 6 || beatInBar === 10) {
        const kickOsc = offlineCtx.createOscillator();
        const kickGain = offlineCtx.createGain();
        kickOsc.frequency.setValueAtTime(130, time);
        kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
        kickGain.gain.setValueAtTime(0.7, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
        kickOsc.connect(kickGain);
        kickGain.connect(offlineCtx.destination);
        kickOsc.start(time);
        kickOsc.stop(time + 0.25);
      }

      // Shaker on every 16th with accents
      const shakerBuffer = offlineCtx.createBuffer(1, Math.floor(sampleRate * 0.05), sampleRate);
      const sData = shakerBuffer.getChannelData(0);
      for (let i = 0; i < sData.length; i++) sData[i] = (Math.random() * 2 - 1) * 0.15;
      const shakerSrc = offlineCtx.createBufferSource();
      shakerSrc.buffer = shakerBuffer;
      const shakerFilter = offlineCtx.createBiquadFilter();
      shakerFilter.type = 'highpass';
      shakerFilter.frequency.value = 4500;
      const shakerGain = offlineCtx.createGain();
      const accent = step % 4 === 2 ? 0.35 : 0.18;
      shakerGain.gain.setValueAtTime(accent, time);
      shakerGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      shakerSrc.connect(shakerFilter);
      shakerFilter.connect(shakerGain);
      shakerGain.connect(offlineCtx.destination);
      shakerSrc.start(time);

      // Log drum bass note on 3, 8, 12
      if (beatInBar === 3 || beatInBar === 8 || beatInBar === 12) {
        const bassOsc = offlineCtx.createOscillator();
        bassOsc.type = 'sine';
        const bassGain = offlineCtx.createGain();
        const bassFreq = beatInBar === 3 ? 73.42 : beatInBar === 8 ? 82.41 : 65.41;
        bassOsc.frequency.setValueAtTime(bassFreq * 1.5, time);
        bassOsc.frequency.exponentialRampToValueAtTime(bassFreq, time + 0.04);
        bassGain.gain.setValueAtTime(0.6, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        bassOsc.connect(bassGain);
        bassGain.connect(offlineCtx.destination);
        bassOsc.start(time);
        bassOsc.stop(time + 0.4);
      }

      // Syncopated chords on 4, 11
      if (beatInBar === 4 || beatInBar === 11) {
        const chordIndex = Math.floor(step / 16) % chords.length;
        const currentChord = chords[chordIndex];
        currentChord.forEach((freq) => {
          const chordOsc = offlineCtx.createOscillator();
          chordOsc.type = 'triangle';
          chordOsc.frequency.value = freq;
          const chordGain = offlineCtx.createGain();
          chordGain.gain.setValueAtTime(0.12, time);
          chordGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
          chordOsc.connect(chordGain);
          chordGain.connect(offlineCtx.destination);
          chordOsc.start(time);
          chordOsc.stop(time + 0.32);
        });
      }
    }
  } else if (type === 'synth_lofi') {
    // 82 BPM mellow lofi chords and warm vinyl noise
    const bpm = 82;
    const beatSec = 60 / bpm;
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    const totalBars = Math.floor(duration / (beatSec * 4));
    for (let bar = 0; bar < totalBars; bar++) {
      const chord = chords[bar % chords.length];
      const barTime = bar * beatSec * 4;

      chord.forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        osc.type = 'sine';
        // Add subtle detune for lofi wobble
        osc.detune.setValueAtTime((idx - 1.5) * 8, barTime);
        osc.frequency.setValueAtTime(freq, barTime);

        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;

        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(0.001, barTime);
        gain.gain.linearRampToValueAtTime(0.18, barTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, barTime + beatSec * 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(barTime);
        osc.stop(barTime + beatSec * 4);
      });

      // Soft rim shot on beats 2 and 4
      [1, 3].forEach((b) => {
        const rimTime = barTime + b * beatSec;
        const rimOsc = offlineCtx.createOscillator();
        const rimGain = offlineCtx.createGain();
        rimOsc.frequency.setValueAtTime(420, rimTime);
        rimGain.gain.setValueAtTime(0.3, rimTime);
        rimGain.gain.exponentialRampToValueAtTime(0.001, rimTime + 0.08);
        rimOsc.connect(rimGain);
        rimGain.connect(offlineCtx.destination);
        rimOsc.start(rimTime);
        rimOsc.stop(rimTime + 0.1);
      });
    }
  } else if (type === 'synth_upbeat') {
    // 124 BPM upbeat pop arpeggio and punchy kick
    const bpm = 124;
    const sixteenth = (60 / bpm) / 4;
    const totalSteps = Math.floor(duration / sixteenth);
    const arpNotes = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25];

    for (let step = 0; step < totalSteps; step++) {
      const time = step * sixteenth;
      // Kick on quarter notes
      if (step % 4 === 0) {
        const kick = offlineCtx.createOscillator();
        const kGain = offlineCtx.createGain();
        kick.frequency.setValueAtTime(150, time);
        kick.frequency.exponentialRampToValueAtTime(45, time + 0.08);
        kGain.gain.setValueAtTime(0.75, time);
        kGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        kick.connect(kGain);
        kGain.connect(offlineCtx.destination);
        kick.start(time);
        kick.stop(time + 0.2);
      }

      // Bright Synth Pluck
      const noteFreq = arpNotes[step % arpNotes.length];
      const pluck = offlineCtx.createOscillator();
      pluck.type = 'sawtooth';
      pluck.frequency.setValueAtTime(noteFreq, time);

      const pFilter = offlineCtx.createBiquadFilter();
      pFilter.type = 'lowpass';
      pFilter.frequency.setValueAtTime(2600, time);
      pFilter.frequency.exponentialRampToValueAtTime(500, time + 0.12);

      const pGain = offlineCtx.createGain();
      pGain.gain.setValueAtTime(0.12, time);
      pGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      pluck.connect(pFilter);
      pFilter.connect(pGain);
      pGain.connect(offlineCtx.destination);

      pluck.start(time);
      pluck.stop(time + 0.15);
    }
  } else if (type === 'synth_ambient') {
    // Dreamy long drone chords with binaural drift
    const freqs = [174.61, 220.0, 261.63, 329.63, 392.0, 523.25];
    freqs.forEach((f, i) => {
      const osc = offlineCtx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, 0);

      const panner = offlineCtx.createStereoPanner ? offlineCtx.createStereoPanner() : null;
      if (panner) panner.pan.value = (i / freqs.length) * 1.6 - 0.8;

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0.001, 0);
      gain.gain.linearRampToValueAtTime(0.14, 2.5);
      gain.gain.setValueAtTime(0.14, duration - 2.5);
      gain.gain.linearRampToValueAtTime(0.001, duration);

      if (panner) {
        osc.connect(panner);
        panner.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(offlineCtx.destination);

      osc.start(0);
      osc.stop(duration);
    });
  } else if (type === 'sfx_whoosh') {
    // Filtered white noise stereo sweep
    const noiseBuffer = offlineCtx.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = noiseBuffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const noiseSrc = offlineCtx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.5;
    filter.frequency.setValueAtTime(150, 0);
    filter.frequency.exponentialRampToValueAtTime(3200, duration * 0.6);
    filter.frequency.exponentialRampToValueAtTime(200, duration);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.exponentialRampToValueAtTime(0.8, duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);
    noiseSrc.start(0);
  } else if (type === 'sfx_scratch') {
    // Turntable scratch sound
    const osc = offlineCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, 0);
    osc.frequency.linearRampToValueAtTime(1400, 0.2);
    osc.frequency.linearRampToValueAtTime(250, 0.5);
    osc.frequency.linearRampToValueAtTime(900, 0.8);
    osc.frequency.exponentialRampToValueAtTime(60, duration);

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, 0);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.5, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(0);
    osc.stop(duration);
  } else if (type === 'sfx_pop') {
    const osc = offlineCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, 0);
    osc.frequency.exponentialRampToValueAtTime(120, duration);

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(0.8, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(0);
    osc.stop(duration);
  } else if (type === 'sfx_shutter') {
    // Mechanical click + release
    const click = offlineCtx.createOscillator();
    click.type = 'square';
    click.frequency.setValueAtTime(1800, 0);
    const cGain = offlineCtx.createGain();
    cGain.gain.setValueAtTime(0.6, 0);
    cGain.gain.exponentialRampToValueAtTime(0.001, 0.04);
    click.connect(cGain);
    cGain.connect(offlineCtx.destination);
    click.start(0);
    click.stop(0.05);

    const snap = offlineCtx.createOscillator();
    snap.type = 'triangle';
    snap.frequency.setValueAtTime(950, 0.08);
    const sGain = offlineCtx.createGain();
    sGain.gain.setValueAtTime(0.7, 0.08);
    sGain.gain.exponentialRampToValueAtTime(0.001, 0.16);
    snap.connect(sGain);
    sGain.connect(offlineCtx.destination);
    snap.start(0.08);
    snap.stop(0.2);
  }

  return await offlineCtx.startRendering();
}

// Generate URL (Blob URL) for a preset sound
const presetUrlCache = new Map<string, string>();
export async function getPresetAudioUrl(preset: PresetSoundDef): Promise<string> {
  if (presetUrlCache.has(preset.id)) {
    return presetUrlCache.get(preset.id)!;
  }
  const buffer = await generateSynthesizedBuffer(preset.type, preset.duration);
  const blob = bufferToWaveBlob(buffer);
  const url = URL.createObjectURL(blob);
  presetUrlCache.set(preset.id, url);
  return url;
}

// Extract normalized waveform points (peaks) from an AudioBuffer or Audio URL
export async function extractWaveformFromBuffer(
  buffer: AudioBuffer,
  numPoints = 40
): Promise<number[]> {
  const channelData = buffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / numPoints);
  const peaks: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0);
    }
    const avg = sum / (blockSize || 1);
    peaks.push(avg);
  }

  // Normalize between 0.15 and 1.0 for visual balance
  const max = Math.max(...peaks, 0.01);
  return peaks.map((p) => Math.max(0.15, Math.min(1, Math.round((p / max) * 100) / 100)));
}

// Decode audio file / Blob to AudioBuffer
export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

// Slice an AudioBuffer (trim start and end in seconds)
export function sliceAudioBuffer(
  buffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(buffer.length, Math.floor(endTime * sampleRate));
  const newLength = Math.max(1, endSample - startSample);

  const newBuffer = ctx.createBuffer(buffer.numberOfChannels, newLength, sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const srcData = buffer.getChannelData(c);
    const destData = newBuffer.getChannelData(c);
    for (let i = 0; i < newLength; i++) {
      destData[i] = srcData[startSample + i];
    }
  }

  return newBuffer;
}

// Single active audio playback controller so only 1 preview plays at a time
class GlobalAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentSoundId: string | null = null;
  private listeners = new Set<(playingId: string | null, isPlaying: boolean) => void>();

  public subscribe(fn: (playingId: string | null, isPlaying: boolean) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public getPlayingSoundId(): string | null {
    return this.currentAudio && !this.currentAudio.paused ? this.currentSoundId : null;
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentSoundId = null;
      this.notify(null, false);
    }
  }

  public async play(soundId: string, audioUrl: string, startOffset = 0, volume = 1) {
    if (this.currentSoundId === soundId && this.currentAudio && !this.currentAudio.paused) {
      this.stop();
      return false;
    }

    this.stop();

    const audio = new Audio(audioUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    if (startOffset > 0) {
      audio.currentTime = startOffset;
    }

    this.currentAudio = audio;
    this.currentSoundId = soundId;

    audio.onended = () => {
      this.currentAudio = null;
      this.currentSoundId = null;
      this.notify(null, false);
    };

    audio.onerror = () => {
      this.currentAudio = null;
      this.currentSoundId = null;
      this.notify(null, false);
    };

    try {
      await audio.play();
      this.notify(soundId, true);
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  private notify(soundId: string | null, isPlaying: boolean) {
    this.listeners.forEach((fn) => fn(soundId, isPlaying));
  }
}

export const globalAudio = new GlobalAudioManager();
