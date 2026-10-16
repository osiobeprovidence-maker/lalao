/**
 * Web Audio API based synthesized ringtones and call alerts.
 * Completely client-side, zero external audio asset dependencies, guaranteed zero 404s.
 */

class CallRingtoneService {
  private audioCtx: AudioContext | null = null;
  private ringInterval: any = null;
  private isRinging = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Start soft, modern incoming call chime ringtone.
   */
  public startIncomingRingtone() {
    if (this.isRinging) return;
    this.isRinging = true;

    const playChimeBurst = () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        // Elegant two-note harmonic chime (523Hz C5 -> 659Hz E5 -> 784Hz G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.65);
        });

        // Trigger gentle vibration on mobile if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch (err) {
        console.warn('Ringtone playback notice:', err);
      }
    };

    playChimeBurst();
    this.ringInterval = setInterval(playChimeBurst, 2400);
  }

  /**
   * Start outgoing ringing tone (gentle UK/US standard phone ring cadence).
   */
  public startOutgoingRingtone() {
    if (this.isRinging) return;
    this.isRinging = true;

    const playRingCadence = () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const freqs = [440, 480]; // Classic ringing frequency pair

        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.setValueAtTime(0.08, now + 1.2);
          gain.gain.linearRampToValueAtTime(0.001, now + 1.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.35);
        });
      } catch (err) {
        console.warn('Outgoing ring cadence notice:', err);
      }
    };

    playRingCadence();
    this.ringInterval = setInterval(playRingCadence, 3000);
  }

  /**
   * Play subtle double-beep call ended tone.
   */
  public playCallEndTone() {
    this.stop();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.25].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now + offset);

        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } catch (_) {}
  }

  /**
   * Stop any running ringtone immediately.
   */
  public stop() {
    this.isRinging = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

export const callRingtoneService = new CallRingtoneService();
