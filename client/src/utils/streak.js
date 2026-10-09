/**
 * Calculate user consistency streak from real focus sessions and completed tasks.
 * Returns the consecutive active days count leading up to today (or yesterday).
 * 
 * @param {Array} sessions - Array of user focus sessions
 * @param {Array} tasks - Array of user tasks
 * @returns {number} Active streak in days
 */
export function calculateUserStreak(sessions = [], tasks = []) {
  const activeDates = new Set();

  sessions.forEach(s => {
    const raw = s.completed_at || s.created_at;
    if (raw) {
      activeDates.add(raw.slice(0, 10));
    }
  });

  tasks.forEach(t => {
    if (t.completed) {
      const raw = t.completed_at || t.due_date || t.created_at;
      if (raw) {
        activeDates.add(raw.slice(0, 10));
      }
    }
  });

  if (activeDates.size === 0) return 0;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // If user has not been active today or yesterday, the streak is 0
  let checkDate = new Date(now);
  if (!activeDates.has(todayStr)) {
    if (!activeDates.has(yesterdayStr)) {
      return 0;
    }
    checkDate = yesterday;
  }

  let streak = 0;
  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (activeDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
