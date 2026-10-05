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
  ambientSound: 'none', // 'none' | 'whitenoise' | 'rain' | 'binaural'
  ambientVolume: 0.3,   // 0.0 - 1.0
  autoPlayAmbientWithTimer: false,
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

/**
 * Continuous Ambient Focus Sound Synthesizer (Native Web Audio API)
 * Supports White Noise, Brown/Rain Noise, and 10Hz Binaural Alpha Waves.
 */
let activeAmbientNodes = null;
let currentAmbientType = 'none';

export function stopAmbientSound() {
  if (activeAmbientNodes) {
    try {
      if (activeAmbientNodes.stop) activeAmbientNodes.stop();
      if (activeAmbientNodes.nodes) {
        activeAmbientNodes.nodes.forEach(n => {
          if (n.stop) try { n.stop(); } catch(e){}
          if (n.disconnect) try { n.disconnect(); } catch(e){}
        });
      }
    } catch (e) {
      // Ignore audio teardown errors
    }
    activeAmbientNodes = null;
  }
  currentAmbientType = 'none';
}

export function startAmbientSound(type = 'whitenoise', volume = 0.3) {
  stopAmbientSound();
  if (type === 'none' || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volume)), now);
  masterGain.connect(ctx.destination);

  const cleanupNodes = [masterGain];

  if (type === 'whitenoise') {
    // 2-second white noise loop buffer
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoiseSource = ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    // Gentle lowpass to soften harsh frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);

    whiteNoiseSource.connect(filter);
    filter.connect(masterGain);
    whiteNoiseSource.start(now);

    cleanupNodes.push(whiteNoiseSource, filter);
    activeAmbientNodes = {
      gainNode: masterGain,
      nodes: cleanupNodes,
      stop: () => {
        try { whiteNoiseSource.stop(); } catch(e){}
      }
    };
    currentAmbientType = 'whitenoise';
  } else if (type === 'rain') {
    // Brownian/Rain filtered noise
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);

    rainSource.connect(filter);
    filter.connect(masterGain);
    rainSource.start(now);

    cleanupNodes.push(rainSource, filter);
    activeAmbientNodes = {
      gainNode: masterGain,
      nodes: cleanupNodes,
      stop: () => {
        try { rainSource.stop(); } catch(e){}
      }
    };
    currentAmbientType = 'rain';
  } else if (type === 'binaural') {
    // Binaural beats: 200Hz Left ear + 210Hz Right ear = 10Hz Alpha Focus Waves
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.setValueAtTime(200, now);
    oscRight.frequency.setValueAtTime(210, now);

    if (ctx.createStereoPanner) {
      const panLeft = ctx.createStereoPanner();
      panLeft.pan.setValueAtTime(-1, now);
      const panRight = ctx.createStereoPanner();
      panRight.pan.setValueAtTime(1, now);

      oscLeft.connect(panLeft);
      panLeft.connect(masterGain);
      oscRight.connect(panRight);
      panRight.connect(masterGain);
      cleanupNodes.push(panLeft, panRight);
    } else {
      oscLeft.connect(masterGain);
      oscRight.connect(masterGain);
    }

    oscLeft.start(now);
    oscRight.start(now);
    cleanupNodes.push(oscLeft, oscRight);

    activeAmbientNodes = {
      gainNode: masterGain,
      nodes: cleanupNodes,
      stop: () => {
        try { oscLeft.stop(); oscRight.stop(); } catch(e){}
      }
    };
    currentAmbientType = 'binaural';
  }
}

export function setAmbientVolume(volume) {
  if (activeAmbientNodes && activeAmbientNodes.gainNode) {
    const ctx = getAudioContext();
    if (ctx) {
      activeAmbientNodes.gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volume)), ctx.currentTime);
    }
  }
}

export function getCurrentAmbientType() {
  return currentAmbientType;
}

