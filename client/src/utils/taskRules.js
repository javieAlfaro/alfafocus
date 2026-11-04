export function nextOccurrence(dateKey, rule) {
  const date = new Date(dateKey + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + (rule === 'weekly' ? 7 : 1))
  if (rule === 'weekdays') {
    while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
      date.setUTCDate(date.getUTCDate() + 1)
    }
  }
  const iso = date.toISOString()
  return iso.length === 24 ? iso.slice(0, 10) : null
}

export function resolveTaskStatus(current, fields) {
  if (fields.status !== undefined) return fields.status
  if (fields.completed === true) return 'done'
  if (fields.completed === false && current.status === 'done') return 'todo'
  if (fields.progress !== undefined && current.status !== 'done') {
    return fields.progress > 0 && fields.progress < 100 ? 'in_progress' : 'todo'
  }
  return current.status
}
