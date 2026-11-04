import { useState, useEffect, useRef, useCallback } from 'react';
import { playSynthesizedChime, sendDesktopNotification, getStoredAudioSettings, prepareAudio } from '../utils/audioAlerts';

export const TIMER_MODES = {
  POMODORO: { id: 'pomodoro', label: 'Pomo', duration: 25 * 60 },
  DEEPWORK: { id: 'deepwork', label: 'Deep', duration: 50 * 60 },
  STOPWATCH: { id: 'stopwatch', label: 'Stopwatch', duration: 0 },
};

const elapsedMs = run => run.elapsedMs + (run.startedAt === null ? 0 : Date.now() - run.startedAt);

export function useTimer(onComplete) {
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.POMODORO.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [runTask, setRunTask] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const runRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const complete = useCallback((run, seconds, countdown) => {
    runRef.current = null;
    setHasRun(false);
    setIsRunning(false);
    setIsCompleted(true);
    onCompleteRef.current?.(seconds, { mode: run.mode, task: run.task });
    if (countdown) {
      const settings = getStoredAudioSettings();
      playSynthesizedChime(settings.soundType, settings.volume);
      if (settings.notificationsEnabled) {
        sendDesktopNotification('AlfaFocus: Session Complete!', 'Time for a quick break or your next task.');
      }
    }
  }, []);

  const tick = useCallback(() => {
    const run = runRef.current;
    if (!run || run.startedAt === null) return;
    const elapsed = elapsedMs(run);
    if (run.mode === 'stopwatch') {
      setTimeLeft(Math.floor(elapsed / 1000));
      return;
    }
    const remaining = Math.max(0, Math.ceil((run.duration * 1000 - elapsed) / 1000));
    setTimeLeft(remaining);
    if (remaining === 0) complete(run, run.duration, true);
  }, [complete]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isRunning, tick]);

  const start = (task = null) => {
    if (runRef.current?.startedAt != null) return;
    prepareAudio();
    const duration = TIMER_MODES[mode.toUpperCase()].duration;
    const run = runRef.current ?? { mode, duration, task, elapsedMs: 0 };
    run.startedAt = Date.now();
    runRef.current = run;
    setRunTask(run.task);
    setHasRun(true);
    setIsCompleted(false);
    setIsRunning(true);
    tick();
  };

  const pause = () => {
    tick();
    const run = runRef.current;
    if (!run || run.startedAt === null) return;
    run.elapsedMs = elapsedMs(run);
    run.startedAt = null;
    setIsRunning(false);
  };

  const clearRun = newMode => {
    runRef.current = null;
    setRunTask(null);
    setHasRun(false);
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(TIMER_MODES[newMode.toUpperCase()].duration);
  };

  const finish = () => {
    const run = runRef.current;
    if (run?.mode !== 'stopwatch') return;
    const seconds = Math.max(1, Math.floor(elapsedMs(run) / 1000));
    setTimeLeft(seconds);
    complete(run, seconds, false);
  };

  const formattedTime = [
    Math.floor(timeLeft / 60),
    timeLeft % 60,
  ].map(value => String(value).padStart(2, '0')).join(':');

  return {
    mode, timeLeft, formattedTime, isRunning, isCompleted, hasRun, runTask,
    start, pause, finish,
    reset: () => clearRun(mode),
    switchMode: newMode => { clearRun(newMode); setMode(newMode); },
  };
}
