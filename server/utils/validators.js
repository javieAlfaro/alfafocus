const priorities = ['low', 'medium', 'high']
const statuses = ['todo', 'in_progress', 'done']
const rules = ['daily', 'weekdays', 'weekly']

export function parseId(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null
  const id = Number(value)
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validateTaskInput(body, { partial = false } = {}) {
  const errors = []
  const data = {}
  const has = key => Object.hasOwn(body, key)

  if (!partial || has('title')) {
    data.title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!data.title) errors.push('Task title is required')
    if (data.title.length > 255) errors.push('Task title must be 255 characters or fewer')
  }
  if (!partial || has('category')) {
    data.category = typeof body.category === 'string' ? body.category.trim().toUpperCase() : 'WORK'
    if (data.category.length > 50) errors.push('Category must be 50 characters or fewer')
  }
  if (!partial || has('priority')) {
    data.priority = typeof body.priority === 'string' ? body.priority.trim().toLowerCase() : 'medium'
    if (!priorities.includes(data.priority)) errors.push('Priority must be one of: low, medium, high')
  }
  if (has('due_date')) {
    data.due_date = body.due_date
    if (data.due_date !== null && !validDate(data.due_date)) errors.push('due_date must be YYYY-MM-DD or null')
  }
  for (const key of partial ? ['list_id'] : ['list_id', 'parent_task_id']) {
    if (has(key)) {
      data[key] = parseId(body[key])
      if (body[key] !== null && data[key] === null) errors.push(key + ' must be a valid ID or null')
    }
  }
  if (has('progress')) {
    if (!Number.isFinite(body.progress)) errors.push('Progress must be a number')
    else data.progress = Math.round(Math.min(100, Math.max(0, body.progress)))
  }
  if (has('completed')) {
    if (typeof body.completed !== 'boolean') errors.push('completed must be a boolean')
    else data.completed = body.completed
  }
  if (has('status')) {
    if (!statuses.includes(body.status)) errors.push('Invalid task status')
    else data.status = body.status
  }
  if (has('recurrence_rule')) {
    if (body.recurrence_rule !== null && !rules.includes(body.recurrence_rule)) errors.push('Invalid recurrence rule')
    else data.recurrence_rule = body.recurrence_rule
  }
  return { isValid: errors.length === 0, errors, data }
}

export function validateFocusSessionInput(body) {
  const errors = []
  const duration = Number(body.duration_minutes)
  const mode = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : 'pomodoro'
  const taskId = Object.hasOwn(body, 'task_id') ? body.task_id : body.taskId
  const title = Object.hasOwn(body, 'task_title') ? body.task_title : body.taskTitle
  const clientId = body.client_session_id ?? null

  if (!Number.isInteger(duration) || duration <= 0 || duration > 2147483647) {
    errors.push('duration_minutes must be a positive number of whole minutes')
  }
  if (!['pomodoro', 'deepwork', 'stopwatch', 'untimed'].includes(mode)) errors.push('mode must be one of: pomodoro, deepwork, stopwatch, untimed')
  if (taskId != null && !parseId(taskId)) errors.push('Invalid session task ID')
  if (title != null && (typeof title !== 'string' || title.length > 255)) errors.push('Invalid session task title')
  if (clientId !== null && (typeof clientId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(clientId))) {
    errors.push('Invalid client_session_id')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      task_id: parseId(taskId),
      task_title: typeof title === 'string' && title.trim() ? title.trim() : 'Focus Session',
      duration_minutes: duration,
      mode,
      client_session_id: clientId,
    },
  }
}
