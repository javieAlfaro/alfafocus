import { useState, useEffect, useRef, useCallback } from 'react';

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
 * - Built-in audio chime alert via Web Audio / HTML5 Audio API
 * - Clean state lifecycle (start, pause, reset, switchMode)
 */
export function useTimer(onComplete) {
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.POMODORO.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const expectedEndRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Play audio alert chime on countdown completion
  const playAlertSound = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {
        // Fallback for strict browser autoplay permissions
      });
    } catch {
      // Audio fallback handling
    }
  }, []);

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
        playAlertSound();
        if (onComplete) {
          const finishedDuration = TIMER_MODES[mode.toUpperCase()].duration;
          onComplete(finishedDuration);
        }
      }
    }
  }, [mode, onComplete, playAlertSound]);

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
