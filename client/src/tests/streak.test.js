import { describe, it, expect } from 'vitest';
import { calculateUserStreak } from '../utils/streak';

describe('calculateUserStreak', () => {
  it('returns 0 for brand-new accounts with empty sessions and tasks', () => {
    expect(calculateUserStreak([], [])).toBe(0);
  });

  it('returns 1 if user completed a session today', () => {
    const today = new Date().toISOString();
    const sessions = [{ id: 1, completed_at: today, duration_minutes: 25 }];
    expect(calculateUserStreak(sessions, [])).toBe(1);
  });

  it('returns consecutive active days streak', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const sessions = [
      { id: 1, completed_at: today.toISOString(), duration_minutes: 25 },
      { id: 2, completed_at: yesterday.toISOString(), duration_minutes: 25 },
      { id: 3, completed_at: twoDaysAgo.toISOString(), duration_minutes: 25 },
    ];

    expect(calculateUserStreak(sessions, [])).toBe(3);
  });

  it('returns 0 if last activity was more than 1 day ago', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sessions = [
      { id: 1, completed_at: threeDaysAgo.toISOString(), duration_minutes: 25 },
    ];

    expect(calculateUserStreak(sessions, [])).toBe(0);
  });
});
