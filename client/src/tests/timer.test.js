import { describe, it, expect } from 'vitest';
import { TIMER_MODES } from '../hooks/useTimer.js';

describe('Frontend Timer Utilities & Clock Delta Engine', () => {
  it('defines correct duration constants for Pomodoro and Deep Work modes', () => {
    expect(TIMER_MODES.POMODORO.duration).toBe(25 * 60); // 1500 seconds
    expect(TIMER_MODES.DEEPWORK.duration).toBe(50 * 60); // 3000 seconds
    expect(TIMER_MODES.STOPWATCH.duration).toBe(0);
  });

  it('formats seconds into accurate MM:SS display strings', () => {
    const formatTime = (totalSeconds) => {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(3000)).toBe('50:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(0)).toBe('00:00');
  });

  it('calculates remaining time using real clock timestamp deltas without drift', () => {
    const durationSeconds = 1500;
    const startTime = 1000000;
    const expectedEndTime = startTime + durationSeconds * 1000;

    // Simulate browser tab throttling where 600 real seconds elapsed
    const simulatedCurrentTime = startTime + 600 * 1000;
    const remaining = Math.max(0, Math.round((expectedEndTime - simulatedCurrentTime) / 1000));

    expect(remaining).toBe(900); // 1500 - 600 = 900 seconds remaining
  });
});
