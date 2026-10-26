class SoundSystem {
  private ctx: AudioContext | null = null;
  private sirenOscillator: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive = false;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play short warning blip during countdown
  public playCountdownBeep(secondsLeft: number) {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch goes up as countdown runs out
      osc.frequency.setValueAtTime(600 + (4 - secondsLeft) * 150, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);

      if ('vibrate' in navigator) {
        navigator.vibrate(80);
      }
    } catch {
      // AudioContext might be blocked until user interacts
    }
  }

  // Play positive safe disarm chime
  public playDisarmChime() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });

      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 80]);
      }
    } catch {
      // Audio error ignored
    }
  }

  // Play authentic loud deterrent emergency siren
  public startDeterrentSiren() {
    if (this.isSirenActive) return;

    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Carrier oscillator (alarm tone)
      const carrier = ctx.createOscillator();
      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(750, now);

      // Low frequency oscillator (wobble modulator)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1.8, now); // ~1.8 Hz cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(280, now); // swing between 470Hz and 1030Hz

      lfo.connect(lfoGain);
      lfoGain.connect(carrier.frequency);

      // Master volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);

      carrier.connect(masterGain);
      masterGain.connect(ctx.destination);

      carrier.start(now);
      lfo.start(now);

      this.sirenOscillator = carrier;
      this.sirenLfo = lfo;
      this.sirenGain = masterGain;
      this.isSirenActive = true;

      if ('vibrate' in navigator) {
        navigator.vibrate([400, 200, 400, 200, 400]);
      }
    } catch {
      // Audio error ignored
    }
  }

  public stopDeterrentSiren() {
    if (!this.isSirenActive) return;

    try {
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      }
      setTimeout(() => {
        try {
          this.sirenOscillator?.stop();
          this.sirenLfo?.stop();
          this.sirenOscillator?.disconnect();
          this.sirenLfo?.disconnect();
          this.sirenGain?.disconnect();
        } catch {
          // ignore
        }
        this.sirenOscillator = null;
        this.sirenLfo = null;
        this.sirenGain = null;
        this.isSirenActive = false;
      }, 120);
    } catch {
      this.isSirenActive = false;
    }
  }

  public triggerHapticAlert() {
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }
  }
}

export const soundSystem = new SoundSystem();
