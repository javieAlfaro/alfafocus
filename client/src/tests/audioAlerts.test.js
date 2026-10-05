import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DEFAULT_AUDIO_SETTINGS, 
  getStoredAudioSettings, 
  saveStoredAudioSettings 
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
});
