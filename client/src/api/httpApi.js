const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
const appPassword = import.meta.env.VITE_APP_PASSWORD || 'alfa2026'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-app-password': appPassword,
    ...(options.headers || {}),
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const body = await response.json()
      message = body.error || message
    } catch {
      // Non-JSON error response
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export function listTasks() {
  return request('/api/tasks')
}

export function createTask(input) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateTask(id, input) {
  return request(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteTask(id) {
  return request(`/api/tasks/${id}`, {
    method: 'DELETE',
  })
}

export function recordFocusSession(session) {
  return request('/api/focus/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  })
}
