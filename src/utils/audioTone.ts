/**
 * Sound synthesis helper for VoIP call simulation (phone ring, WhatsApp ring, end call beep)
 */
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

export class VoipSoundEffects {
  private static ringInterval: number | null = null;

  /**
   * Start ringing sound (WhatsApp / VoIP standard dual-tone ring cadence)
   */
  static startRinging(type: 'whatsapp' | 'telegram' | 'phone' = 'whatsapp'): void {
    this.stopRinging();

    const playBeep = () => {
      try {
        const ctx = getAudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // VoIP ring tones (approx 440Hz + 480Hz or 400Hz + 450Hz)
        const freq1 = type === 'whatsapp' ? 425 : 440;
        const freq2 = type === 'whatsapp' ? 480 : 480;

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq2, ctx.currentTime);

        // Envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.9);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.0);
        osc2.stop(ctx.currentTime + 1.0);
      } catch (err) {
        console.warn('Audio tone error:', err);
      }
    };

    playBeep();
    this.ringInterval = window.setInterval(playBeep, 2500);
  }

  static stopRinging(): void {
    if (this.ringInterval !== null) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Play call answered chime
   */
  static playCallAnswered(): void {
    this.stopRinging();
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // ignore
    }
  }

  /**
   * Play call ended tone (3 beeps)
   */
  static playCallEnded(): void {
    this.stopRinging();
    try {
      const ctx = getAudioContext();
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, start);

        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.12);
      }
    } catch {
      // ignore
    }
  }
}
