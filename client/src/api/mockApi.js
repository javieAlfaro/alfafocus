// Simulated backend for AlfaFocus
import seed from './seed.json'

const TASKS_KEY = 'alfafocus:tasks'
const SESSIONS_KEY = 'alfafocus:focus_sessions'

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

function readTasks() {
  const stored = localStorage.getItem(TASKS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem(TASKS_KEY)
    }
  }
  localStorage.setItem(TASKS_KEY, JSON.stringify(seed))
  return seed
}

function writeTasks(rows) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(rows))
  return rows
}

export async function listTasks() {
  await delay()
  return readTasks().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
  writeTasks(readTasks().filter((row) => String(row.id) !== String(id)))
}

export async function recordFocusSession(session) {
  await delay()
  const existing = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  const newSession = {
    id: 'session-' + crypto.randomUUID().slice(0, 8),
    ...session,
    completed_at: new Date().toISOString(),
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([newSession, ...existing]))
  return newSession
}
