const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://alfafocus-api.onrender.com'
async function request(path, options = {}) {
  const token = localStorage.getItem('alfafocus_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    throw Object.assign(new Error(message), { status: response.status })
  }

  if (response.status === 204) return null
  return response.json()
}

async function authenticate(path, credentials) {
  const data = await request(path, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  localStorage.setItem('alfafocus_token', data.token)
  localStorage.setItem('alfafocus_user', JSON.stringify(data.user))
  return data
}

export const login = credentials => authenticate('/api/auth/login', credentials)
export const register = credentials => authenticate('/api/auth/register', credentials)

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

export function updateList(id, input) {
  return request(`/api/lists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteList(id, defaultListId = null) {
  const query = defaultListId ? `?defaultListId=${defaultListId}` : ''
  return request(`/api/lists/${id}${query}`, {
    method: 'DELETE',
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
