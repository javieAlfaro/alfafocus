export function localDateKey(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export const sessionDay = session => localDateKey(session.completed_at || session.created_at || null);
export const taskCompletionDay = task =>
  task.completed ? localDateKey(task.completed_at || task.due_date || task.created_at || null) : null;
