// Notification sound using Web Audio API — no external file needed
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playNotification() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two-tone chime: ding-ding
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(880, now, 0.12);       // A5 ding
    playTone(1100, now + 0.12, 0.15); // C#6 ding
  } catch {
    // Audio not available — silently ignore
  }
}