// Simulated backend for AlfaFocus
import seed from './seed.json'

const TASKS_KEY = 'alfafocus:tasks'
const SESSIONS_KEY = 'alfafocus:focus_sessions'
const LISTS_KEY = 'alfafocus:lists'

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

function readLists() {
  const stored = localStorage.getItem(LISTS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem(LISTS_KEY)
    }
  }
  const defaultLists = seed.lists || [
    { id: 1, title: 'AlfaFocus Redesign', color: '#059669' },
    { id: 2, title: 'Marketing Q1', color: '#3B82F6' },
    { id: 3, title: 'Personal Routines', color: '#8B5CF6' }
  ]
  localStorage.setItem(LISTS_KEY, JSON.stringify(defaultLists))
  return defaultLists
}

function readTasks() {
  const stored = localStorage.getItem(TASKS_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    } catch {
      localStorage.removeItem(TASKS_KEY)
    }
  }
  const defaultTasks = seed.tasks || (Array.isArray(seed) ? seed : [])
  localStorage.setItem(TASKS_KEY, JSON.stringify(defaultTasks))
  return defaultTasks
}

function writeTasks(rows) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(rows))
  return rows
}

export async function listLists() {
  await delay()
  return readLists()
}

export async function createList(input) {
  await delay()
  const lists = readLists()
  const newList = {
    id: Date.now(),
    title: input.title,
    color: input.color || '#059669',
  }
  const updated = [...lists, newList]
  localStorage.setItem(LISTS_KEY, JSON.stringify(updated))
  return newList
}

export async function updateList(id, input) {
  await delay()
  const lists = readLists()
  const target = lists.find(l => l.id === Number(id) || l.id === id)
  if (!target) throw new Error('List not found')
  if (input.title) target.title = input.title
  if (input.color) target.color = input.color
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  return target
}

export async function deleteList(id, defaultListId = null) {
  await delay()
  const lists = readLists()
  const filtered = lists.filter(l => l.id !== Number(id) && l.id !== id)
  localStorage.setItem(LISTS_KEY, JSON.stringify(filtered))

  if (defaultListId) {
    const tasks = readTasks()
    const reassigned = tasks.map(t => (t.list_id === Number(id) || t.list_id === id) ? { ...t, list_id: defaultListId } : t)
    writeTasks(reassigned)
  }
  return { success: true }
}

export async function listTasks() {
  await delay()
  return readTasks().slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

export async function createTask(input) {
  await delay()
  const created = {
    ...input,
    id: 'task-' + crypto.randomUUID().slice(0, 8),
    completed: false,
    progress: 0,
    created_at: new Date().toISOString(),
  }
  writeTasks([created, ...readTasks()])
  return created
}

export async function updateTask(id, input) {
  await delay()
  const rows = readTasks()
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) throw new Error('Task not found')
  rows[index] = { ...rows[index], ...input }
  writeTasks(rows)
  return rows[index]
}

export async function deleteTask(id) {
  await delay()
  // Cascade delete: delete the task and any of its child subtasks
  const remaining = readTasks().filter((row) => String(row.id) !== String(id) && String(row.parent_task_id) !== String(id))
  writeTasks(remaining)
}

export async function listFocusSessions() {
  await delay()
  const stored = localStorage.getItem(SESSIONS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem(SESSIONS_KEY)
    }
  }
  const defaultSessions = seed.sessions || []
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(defaultSessions))
  return defaultSessions
}

export async function recordFocusSession(session) {
  await delay()
  const existing = await listFocusSessions()
  const newSession = {
    id: 'session-' + crypto.randomUUID().slice(0, 8),
    ...session,
    completed_at: new Date().toISOString(),
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([newSession, ...existing]))
  return newSession
}

export async function login({ username, password }) {
  await delay(120)
  const user = { id: 1, username: username || 'alfa_user' }
  localStorage.setItem('alfafocus_token', 'mock_jwt_session_token')
  localStorage.setItem('alfafocus_user', JSON.stringify(user))
  return { user, token: 'mock_jwt_session_token' }
}

export async function register({ username, password }) {
  await delay(120)
  const user = { id: Date.now(), username: username || 'new_user' }
  localStorage.setItem('alfafocus_token', 'mock_jwt_session_token')
  localStorage.setItem('alfafocus_user', JSON.stringify(user))
  return { user, token: 'mock_jwt_session_token' }
}

export async function getMe() {
  await delay(60)
  try {
    const raw = localStorage.getItem('alfafocus_user')
    if (raw) return { user: JSON.parse(raw) }
  } catch {}
  return { user: { id: 1, username: 'default_user' } }
}
