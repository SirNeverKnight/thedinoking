class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = parseFloat(localStorage.getItem('dino_volume') || '80') / 100.0;
    this.bgmTimer = null;
    this.isPlayingBGM = false;
    this.bgmStep = 0;

    // Catchy 8-bit Chiptune Melody Notes (Frequencies in Hz)
    // C4, E4, G4, A4, C5, B4, G4, E4 bassline pattern
    this.melody = [
      261.63, 329.63, 392.00, 440.00, 523.25, 493.88, 392.00, 329.63,
      293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23,
    ];
    this.bass = [
      130.81, 130.81, 164.81, 164.81, 196.00, 196.00, 220.00, 196.00,
      146.83, 146.83, 174.61, 174.61, 220.00, 220.00, 261.63, 220.00,
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(percent) {
    this.volume = percent / 100.0;
    localStorage.setItem('dino_volume', percent.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  playJump() {
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square'; // Authentic 8-bit sound
    const now = this.ctx.currentTime;

    // Frequency sweep from 150 Hz to 600 Hz over 0.15s
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playCollision() {
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;

    // Crash drop from 180 Hz to 40 Hz over 0.3s
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0.5 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playCountdown(isGo = false) {
    this.init();
    if (!this.ctx || this.volume <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    const freq = isGo ? 880 : 440;
    const duration = isGo ? 0.3 : 0.15;

    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  startBGM() {
    this.init();
    if (this.isPlayingBGM || this.volume <= 0) return;
    this.isPlayingBGM = true;
    this.bgmStep = 0;

    const stepInterval = 180; // 180ms per note (catchy upbeat tempo)

    this.bgmTimer = setInterval(() => {
      if (!this.isPlayingBGM || !this.ctx || this.volume <= 0) return;

      const now = this.ctx.currentTime;

      // Melody Oscillator
      const melOsc = this.ctx.createOscillator();
      const melGain = this.ctx.createGain();
      melOsc.type = 'square';
      melOsc.frequency.setValueAtTime(this.melody[this.bgmStep % this.melody.length], now);
      melGain.gain.setValueAtTime(0.08 * this.volume, now);
      melGain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
      melOsc.connect(melGain);
      melGain.connect(this.masterGain);
      melOsc.start(now);
      melOsc.stop(now + 0.15);

      // Bass Oscillator
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(this.bass[this.bgmStep % this.bass.length], now);
      bassGain.gain.setValueAtTime(0.12 * this.volume, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.16);

      this.bgmStep++;
    }, stepInterval);
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const soundService = new SoundManager();
