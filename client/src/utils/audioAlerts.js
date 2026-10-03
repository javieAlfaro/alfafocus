/**
 * Audio Chime Synthesizer & Web Notification Engine
 * 
 * Generates synthetic alert tones using the browser's native Web Audio API.
 * Eliminates external MP3 CDN dependencies, avoiding CORS or 404 network issues.
 */

const AUDIO_STORAGE_KEY = 'alfafocus_audio_settings';

export const DEFAULT_AUDIO_SETTINGS = {
  soundType: 'bell', // 'bell' | 'gong' | 'digital' | 'mute'
  volume: 0.7,       // 0.0 - 1.0
  notificationsEnabled: false,
};

export function getStoredAudioSettings() {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (raw) return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_AUDIO_SETTINGS;
}

export function saveStoredAudioSettings(settings) {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore localStorage errors
  }
}

let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Play a synthesized chime alert
 * @param {'bell' | 'gong' | 'digital' | 'mute'} type 
 * @param {number} volume (0.0 to 1.0)
 */
export function playSynthesizedChime(type = 'bell', volume = 0.7) {
  if (type === 'mute' || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volume)), now);
  masterGain.connect(ctx.destination);

  if (type === 'bell') {
    // Harmonic bell chord: D5 (587.33Hz) + A5 (880Hz)
    const tones = [587.33, 880];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(idx === 0 ? 0.6 : 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  } else if (type === 'gong') {
    // Resonant deep gong: 220Hz fundamental + 440Hz warm overtone
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 2.0);
    subOsc.stop(now + 2.0);
  } else if (type === 'digital') {
    // Double high-tech beep: 880Hz then 1046.5Hz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.12);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.16);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.5, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.35);
  }
}

/**
 * Request notification permission from the user
 */
export async function requestDesktopNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission; // 'granted' | 'denied' | 'default'
  } catch {
    return 'denied';
  }
}

/**
 * Trigger desktop notification if permitted
 */
export function sendDesktopNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'favicon.ico',
      });
    } catch {
      // Fallback if browser blocks constructor
    }
  }
}
