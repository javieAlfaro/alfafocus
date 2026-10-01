// Server-side validation functions to guarantee correctness and security
// Sanitizes input before queries touch the database.

export function validateTaskInput(body) {
  const errors = []
  
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim().toUpperCase() : 'WORK'
  const priority = typeof body.priority === 'string' ? body.priority.trim().toLowerCase() : 'medium'

  if (!title) {
    errors.push('Task title is required')
  } else if (title.length > 255) {
    errors.push('Task title must be 255 characters or fewer')
  }

  const allowedPriorities = ['low', 'medium', 'high']
  if (!allowedPriorities.includes(priority)) {
    errors.push('Priority must be one of: low, medium, high')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      title,
      category,
      priority,
      due_date: body.due_date || null,
      progress: typeof body.progress === 'number' ? Math.min(100, Math.max(0, body.progress)) : 0,
      completed: Boolean(body.completed),
    },
  }
}

export function validateFocusSessionInput(body) {
  const errors = []
  const duration = Number(body.duration_minutes)
  const mode = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : 'pomodoro'

  if (!duration || isNaN(duration) || duration <= 0) {
    errors.push('duration_minutes must be a positive number')
  }

  const allowedModes = ['pomodoro', 'deepwork', 'stopwatch', 'untimed']
  if (!allowedModes.includes(mode)) {
    errors.push('mode must be one of: pomodoro, deepwork, stopwatch, untimed')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      task_id: body.taskId ? Number(body.taskId) : null,
      task_title: body.taskTitle || 'Focus Session',
      duration_minutes: duration,
      mode,
    }
  }
}
