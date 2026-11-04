import { useEffect, useState } from 'react';
import {
  getStoredAudioSettings, saveStoredAudioSettings, getCurrentAmbientType,
  startAmbientSound, stopAmbientSound, setAmbientVolume,
} from '../utils/audioAlerts';

export function useAmbientAudio() {
  const [preset, setPreset] = useState(() => {
    const stored = getStoredAudioSettings().ambientSound;
    return ['rain', 'whitenoise', 'binaural'].includes(stored) ? stored : 'binaural';
  });
  const [volume, setVolume] = useState(() => getStoredAudioSettings().ambientVolume ?? 0.3);
  const [active, setActive] = useState('none');

  useEffect(() => stopAmbientSound, []);

  const stop = () => {
    stopAmbientSound();
    setActive('none');
  };

  const play = (type = preset) => {
    if (type === 'none') {
      stop();
      return;
    }
    setPreset(type);
    saveStoredAudioSettings({ ...getStoredAudioSettings(), ambientSound: type });
    startAmbientSound(type, volume);
    setActive(getCurrentAmbientType());
  };

  const changeVolume = value => {
    setVolume(value);
    saveStoredAudioSettings({ ...getStoredAudioSettings(), ambientVolume: value });
    setAmbientVolume(value);
  };

  return { active, preset, volume, play, stop, changeVolume };
}
