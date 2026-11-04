import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  DEFAULT_AUDIO_SETTINGS, 
  getStoredAudioSettings, 
  saveStoredAudioSettings, startAmbientSound, stopAmbientSound, setAmbientVolume, getCurrentAmbientType
} from '../utils/audioAlerts.js';

describe('Audio Settings & Ambient Engine Defaults', () => {
  beforeEach(() => {
    // In-memory mock for localStorage in test environment
    const storage = {};
    global.localStorage = {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, val) => { storage[key] = String(val); },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };
  });

  it('exposes correct initial default values for alerts and ambient flow', () => {
    expect(DEFAULT_AUDIO_SETTINGS.soundType).toBe('bell');
    expect(DEFAULT_AUDIO_SETTINGS.volume).toBe(0.7);
    expect(DEFAULT_AUDIO_SETTINGS.ambientSound).toBe('none');
    expect(DEFAULT_AUDIO_SETTINGS.ambientVolume).toBe(0.3);
  });

  it('persists and retrieves updated audio settings from localStorage', () => {
    const updated = {
      soundType: 'gong',
      volume: 0.9,
      notificationsEnabled: true,
      ambientSound: 'binaural',
      ambientVolume: 0.4,
    };

    saveStoredAudioSettings(updated);
    const retrieved = getStoredAudioSettings();

    expect(retrieved.soundType).toBe('gong');
    expect(retrieved.volume).toBe(0.9);
    expect(retrieved.ambientSound).toBe('binaural');
    expect(retrieved.ambientVolume).toBe(0.4);
  });

  it('silences ambient playback at zero and tears down the old sound when switching', () => {
    const sources = [];
    const gains = [];
    class AudioContext {
      currentTime = 10;
      state = 'running';
      sampleRate = 4;
      createGain() {
        const node = { gain: { setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
        gains.push(node);
        return node;
      }
      createBuffer() { return { getChannelData: () => new Float32Array(12) }; }
      createBufferSource() {
        const node = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() };
        sources.push(node);
        return node;
      }
      createBiquadFilter() {
        return { frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
      }
    }

    vi.stubGlobal('window', { AudioContext });
    try {
      startAmbientSound('rain', 0.4);
      setAmbientVolume(0);
      expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
      startAmbientSound('whitenoise', 0);
      expect(sources[0].stop).toHaveBeenCalledOnce();
      expect(gains[0].disconnect).toHaveBeenCalledOnce();
      expect(gains[1].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
      expect(getCurrentAmbientType()).toBe('whitenoise');
    } finally {
      stopAmbientSound();
      vi.unstubAllGlobals();
    }
    expect(sources[1].disconnect).toHaveBeenCalledOnce();
  });
});
