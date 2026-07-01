class RingtoneManager {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;

  startRingtone() {
    this.stop();
    const AudioCtx = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    const playTone = () => {
      if (!this.ctx || this.ctx.state === "closed") return;
      
      // Dual tone: 480Hz and 440Hz combined (pleasant standard telephone ring)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.frequency.value = 480;
      osc2.frequency.value = 440;
      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.9);
      gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.0);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(this.ctx.currentTime + 2.0);
      osc2.stop(this.ctx.currentTime + 2.0);
    };

    // Attempt to resume context in case of browser autoplay policies
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    try {
      playTone();
      this.intervalId = setInterval(playTone, 4000);
    } catch (e) {
      console.warn("Could not play ringtone", e);
    }
  }

  startRingback() {
    this.stop();
    const AudioCtx = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    const playTone = () => {
      if (!this.ctx || this.ctx.state === "closed") return;

      // Ringback tone: 440Hz + 480Hz, 1.5 second ring, 2.5 seconds silence
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      
      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.4);
      gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(this.ctx.currentTime + 1.5);
      osc2.stop(this.ctx.currentTime + 1.5);
    };

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    try {
      playTone();
      this.intervalId = setInterval(playTone, 4000);
    } catch (e) {
      console.warn("Could not play ringback", e);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      if (this.ctx.state !== "closed") {
        void this.ctx.close();
      }
      this.ctx = null;
    }
  }
}

export const ringtoneManager = new RingtoneManager();
