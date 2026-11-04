import { localDateKey, sessionDay, taskCompletionDay } from './calendarDates';

export function calculateUserStreak(sessions = [], tasks = []) {
  const days = new Set([...sessions.map(sessionDay), ...tasks.map(taskCompletionDay)].filter(Boolean));
  const date = new Date();
  if (!days.has(localDateKey(date))) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(date))) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}
