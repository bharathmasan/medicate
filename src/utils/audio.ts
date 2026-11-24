let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playSoftChime(frequency = 432, durationSeconds = 1.4): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const gain = ctx.createGain();
    const harmonicGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(frequency * 1.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    harmonicGain.gain.setValueAtTime(0.0001, now);
    harmonicGain.gain.exponentialRampToValueAtTime(0.018, now + 0.08);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds * 0.8);

    osc.connect(gain);
    harmonic.connect(harmonicGain);
    gain.connect(ctx.destination);
    harmonicGain.connect(ctx.destination);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + durationSeconds + 0.05);
    harmonic.stop(now + durationSeconds + 0.05);
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}
