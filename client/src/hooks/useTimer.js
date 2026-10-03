import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  playSynthesizedChime, 
  sendDesktopNotification, 
  getStoredAudioSettings 
} from '../utils/audioAlerts';

export const TIMER_MODES = {
  POMODORO: { id: 'pomodoro', label: 'Pomo', duration: 25 * 60 },
  DEEPWORK: { id: 'deepwork', label: 'Deep', duration: 50 * 60 },
  STOPWATCH: { id: 'stopwatch', label: 'Stopwatch', duration: 0 },
};

/**
 * Self-Authored Custom Hook: useTimer
 * Features:
 * - Drift-free countdown using Date.now() timestamp deltas (prevents lag in background tabs)
 * - 3 operational modes: Pomodoro (25m), Deep Work (50m), and Stopwatch (count-up)
 * - Built-in synthesized audio chimes (Web Audio API) with volume and sound selection
 * - Browser Web Notifications on session completion
 * - Clean state lifecycle (start, pause, reset, switchMode)
 */
export function useTimer(onComplete) {
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.POMODORO.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const expectedEndRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Play synthesized audio alert chime and desktop notification on completion
  const triggerCompletionAlerts = useCallback(() => {
    const settings = getStoredAudioSettings();
    playSynthesizedChime(settings.soundType, settings.volume);
    
    if (settings.notificationsEnabled) {
      const modeLabel = TIMER_MODES[mode.toUpperCase()]?.label || 'Focus';
      sendDesktopNotification(
        'AlfaFocus: Session Complete!',
        `Your ${modeLabel} block has finished. Time for a quick break or your next task!`
      );
    }
  }, [mode]);

  // Main tick evaluation
  const tick = useCallback(() => {
    if (mode === 'stopwatch') {
      setTimeLeft(prev => prev + 1);
    } else {
      const remaining = Math.max(0, Math.round((expectedEndRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setIsRunning(false);
        setIsCompleted(true);
        clearInterval(timerIntervalRef.current);
        triggerCompletionAlerts();
        if (onComplete) {
          const finishedDuration = TIMER_MODES[mode.toUpperCase()].duration;
          onComplete(finishedDuration);
        }
      }
    }
  }, [mode, onComplete, triggerCompletionAlerts]);

  useEffect(() => {
    if (isRunning) {
      if (mode !== 'stopwatch') {
        expectedEndRef.current = Date.now() + timeLeft * 1000;
      }
      timerIntervalRef.current = setInterval(tick, 250); // Polling every 250ms prevents drift
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRunning, mode, tick, timeLeft]);

  const start = () => {
    if (timeLeft > 0 || mode === 'stopwatch') {
      setIsCompleted(false);
      setIsRunning(true);
    }
  };

  const pause = () => setIsRunning(false);

  const reset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(mode === 'stopwatch' ? 0 : TIMER_MODES[mode.toUpperCase()].duration);
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setIsCompleted(false);
    setMode(newMode);
    setTimeLeft(TIMER_MODES[newMode.toUpperCase()].duration);
  };

  // Format seconds to MM:SS display
  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    mode,
    timeLeft,
    formattedTime: formatTime(),
    isRunning,
    isCompleted,
    start,
    pause,
    reset,
    switchMode,
  };
}
