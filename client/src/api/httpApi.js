const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
const appUser = import.meta.env.VITE_APP_USER || 'alfa'
const appPassword = import.meta.env.VITE_APP_PASSWORD || 'alfa2026'

// Base64 encode for standard HTTP Basic Authentication
const basicAuthHeader = typeof btoa === 'function' ? `Basic ${btoa(`${appUser}:${appPassword}`)}` : ''

async function request(path, options = {}) {
  const token = localStorage.getItem('alfafocus_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : (basicAuthHeader ? { 'Authorization': basicAuthHeader } : {})),
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

export function login(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function register(credentials) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function getMe() {
  return request('/api/auth/me')
}

export function listLists() {
  return request('/api/lists')
}

export function createList(input) {
  return request('/api/lists', {
    method: 'POST',
    body: JSON.stringify(input),
  })
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

export function listFocusSessions() {
  return request('/api/focus/sessions')
}

export function recordFocusSession(session) {
  return request('/api/focus/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  })
}
