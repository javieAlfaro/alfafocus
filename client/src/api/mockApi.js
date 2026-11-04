// Simulated backend for AlfaFocus
import seed from './seed.json'
import { nextOccurrence, resolveTaskStatus } from '../utils/taskRules.js'

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
      if (Array.isArray(parsed)) return normalizeTasks(parsed)
    } catch {
      localStorage.removeItem(TASKS_KEY)
    }
  }
  const defaultTasks = seed.tasks || (Array.isArray(seed) ? seed : [])
  localStorage.setItem(TASKS_KEY, JSON.stringify(defaultTasks))
  return normalizeTasks(defaultTasks)
}

function normalizeTasks(rows) {
  const startedParents = new Set(rows.filter(row => row.completed).map(row => row.parent_task_id))
  return rows.map(row => ({
    list_id: null,
    parent_task_id: null,
    due_date: null,
    progress: 0,
    completed_at: null,
    recurrence_rule: null,
    series_id: null,
    occurrence_date: null,
    ...row,
    status: row.status ?? (row.completed ? 'done'
      : startedParents.has(row.id) || (row.progress > 0 && row.progress < 100) ? 'in_progress' : 'todo'),
  }))
}

const sameId = (left, right) => String(left) === String(right)
const badRequest = message => Object.assign(new Error(message), { status: 400 })
const notFound = message => Object.assign(new Error(message), { status: 404 })

function descendants(rows, id) {
  const children = new Map()
  for (const row of rows) {
    const key = String(row.parent_task_id)
    if (!children.has(key)) children.set(key, [])
    children.get(key).push(String(row.id))
  }
  const ids = new Set([String(id)])
  for (const key of ids) {
    for (const child of children.get(key) ?? []) ids.add(child)
  }
  return ids
}

function validateRecurrence(task, rows) {
  if (task.recurrence_rule == null) return
  if (!['daily', 'weekdays', 'weekly'].includes(task.recurrence_rule)) throw badRequest('Invalid recurrence rule')
  if (!task.due_date || task.parent_task_id !== null || rows.some(row => sameId(row.parent_task_id, task.id))) {
    throw badRequest('Recurring tasks must be standalone and have a due date')
  }
  task.series_id ??= crypto.randomUUID()
  task.occurrence_date ??= task.due_date
}

function taskFields(input, isNew = false) {
  const keys = ['title', 'category', 'priority', 'due_date', 'list_id', 'progress', 'completed', 'status', 'recurrence_rule']
  if (isNew) keys.push('parent_task_id')
  const fields = Object.fromEntries(keys.filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]]))
  if (isNew || 'title' in fields) {
    fields.title = typeof fields.title === 'string' ? fields.title.trim() : ''
    if (!fields.title || fields.title.length > 255) throw badRequest('Invalid task title')
  }
  if ('category' in fields) {
    fields.category = typeof fields.category === 'string' ? fields.category.trim().toUpperCase() : 'WORK'
    if (fields.category.length > 50) throw badRequest('Invalid task category')
  }
  if ('priority' in fields) {
    fields.priority = typeof fields.priority === 'string' ? fields.priority.trim().toLowerCase() : 'medium'
    if (!['low', 'medium', 'high'].includes(fields.priority)) throw badRequest('Invalid task priority')
  }
  if ('due_date' in fields && fields.due_date !== null) {
    const date = new Date(fields.due_date + 'T00:00:00Z')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.due_date) || fields.due_date.startsWith('0000') ||
        !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== fields.due_date) {
      throw badRequest('due_date must be YYYY-MM-DD or null')
    }
  }
  if ('progress' in fields) {
    if (!Number.isFinite(fields.progress)) throw badRequest('Progress must be a number')
    fields.progress = Math.round(Math.min(100, Math.max(0, fields.progress)))
  }
  if ('completed' in fields && typeof fields.completed !== 'boolean') throw badRequest('Invalid completion value')
  if ('status' in fields && !['todo', 'in_progress', 'done'].includes(fields.status)) throw badRequest('Invalid task status')
  return fields
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
  if (!lists.some(list => sameId(list.id, id))) throw notFound('List not found')
  const remaining = lists.filter(list => !sameId(list.id, id))
  const destination = remaining.find(list => sameId(list.id, defaultListId))
  if (defaultListId != null && !sameId(defaultListId, id) && !destination) throw badRequest('Destination project not found')
  const tasks = readTasks()
  writeTasks(tasks.map(task => sameId(task.list_id, id) ? { ...task, list_id: destination?.id ?? null } : task))
  localStorage.setItem(LISTS_KEY, JSON.stringify(remaining))
  return { success: true }
}

export async function listTasks() {
  await delay()
  return readTasks().slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

export async function createTask(input) {
  await delay()
  const rows = readTasks()
  const fields = taskFields(input, true)
  const parent = rows.find(row => sameId(row.id, fields.parent_task_id))
  if (fields.parent_task_id != null && !parent) throw badRequest('Parent task not found')
  if (parent?.recurrence_rule) throw badRequest('Recurring tasks must be standalone')
  const lists = readLists()
  let listId = fields.list_id ?? null

  if (parent) {
    if (listId != null && !sameId(listId, parent.list_id)) throw badRequest('Subtasks must use the parent project')
    listId = parent.list_id
  } else if (listId !== null) {
    const list = lists.find(row => sameId(row.id, listId))
    if (!list) throw badRequest('Project not found')
    listId = list.id
  } else {
    listId = lists[0]?.id ?? null
  }
  const status = resolveTaskStatus({ status: 'todo' }, fields)
  const createdAt = new Date().toISOString()
  const created = {
    title: '', category: 'WORK', priority: 'medium', due_date: null, progress: 0,
    recurrence_rule: null, series_id: null, occurrence_date: null,
    ...fields,
    id: 'task-' + crypto.randomUUID(),
    list_id: listId,
    parent_task_id: parent?.id ?? null,
    status,
    completed: status === 'done',
    completed_at: status === 'done' ? createdAt : null,
    created_at: createdAt,
  }
  validateRecurrence(created, rows)
  if (!parent && listId === null) {
    const list = { id: Date.now(), title: 'My Tasks', color: '#059669' }
    localStorage.setItem(LISTS_KEY, JSON.stringify([list]))
    created.list_id = list.id
  }
  writeTasks([created, ...rows])
  return created
}

export async function updateTask(id, input) {
  await delay()
  const rows = readTasks()
  const current = rows.find(row => sameId(row.id, id))
  if (!current) throw notFound('Task not found')
  const fields = taskFields(input)
  const updated = { ...current, ...fields }
  const moving = 'list_id' in fields && !sameId(fields.list_id, current.list_id)
  if (moving) {
    if (current.parent_task_id !== null) throw badRequest('Move the parent task to change projects')
    if (fields.list_id !== null) {
      const list = readLists().find(row => sameId(row.id, fields.list_id))
      if (!list) throw badRequest('Project not found')
      updated.list_id = list.id
    }
  } else {
    updated.list_id = current.list_id
  }
  validateRecurrence(updated, rows)
  updated.status = resolveTaskStatus(current, fields)
  updated.completed = updated.status === 'done'
  const now = new Date().toISOString()
  updated.completed_at = updated.completed ? current.completed_at ?? now : null
  const subtree = moving ? descendants(rows, id) : new Set()
  const nextRows = rows.map(row => {
    if (row === current) return updated
    return subtree.has(String(row.id)) ? { ...row, list_id: updated.list_id } : row
  })

  if (updated.completed && !current.completed && updated.recurrence_rule) {
    const date = nextOccurrence(updated.occurrence_date, updated.recurrence_rule)
    if (date && !rows.some(row => row.series_id === updated.series_id && row.occurrence_date > updated.occurrence_date)) {
      nextRows.unshift({
        ...updated, id: 'task-' + crypto.randomUUID(), due_date: date, occurrence_date: date,
        completed: false, completed_at: null, progress: 0, status: 'todo', created_at: now,
      })
    }
  }
  writeTasks(nextRows)
  return updated
}

function readSessions() {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSIONS_KEY))
    if (Array.isArray(stored)) return stored
  } catch {
    // Invalid storage can be restored from the demo fixtures.
  }
  return seed.sessions || []
}

export async function deleteTask(id) {
  await delay()
  const rows = readTasks()
  if (!rows.some(row => sameId(row.id, id))) throw notFound('Task not found')
  const removed = descendants(rows, id)
  writeTasks(rows.filter(row => !removed.has(String(row.id))))
  const sessions = readSessions().map(session =>
    removed.has(String(session.task_id)) ? { ...session, task_id: null } : session)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  return null
}

export async function listFocusSessions() {
  await delay()
  return readSessions()
}

export async function recordFocusSession(session) {
  await delay()
  const existing = readSessions()
  const clientId = session.client_session_id ?? null
  const taskId = Object.hasOwn(session, 'task_id') ? session.task_id : session.taskId
  const title = Object.hasOwn(session, 'task_title') ? session.task_title : session.taskTitle
  const duration = Number(session.duration_minutes)
  const mode = typeof session.mode === 'string' ? session.mode.trim().toLowerCase() : 'pomodoro'
  if (!Number.isInteger(duration) || duration <= 0 || duration > 2147483647) throw badRequest('Invalid session duration')
  if (!['pomodoro', 'deepwork', 'stopwatch', 'untimed'].includes(mode)) throw badRequest('Invalid focus mode')
  if (title != null && (typeof title !== 'string' || title.length > 255)) throw badRequest('Invalid session task title')
  if (clientId !== null && (typeof clientId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(clientId))) {
    throw badRequest('Invalid client_session_id')
  }
  const previous = clientId && existing.find(row => row.client_session_id === clientId)
  if (previous) return previous
  const task = readTasks().find(row => sameId(row.id, taskId))
  if (taskId != null && !task) throw badRequest('Session task not found')
  const newSession = {
    id: 'session-' + crypto.randomUUID(),
    client_session_id: clientId,
    task_id: task?.id ?? null,
    task_title: title?.trim() || 'Focus Session',
    duration_minutes: duration,
    mode,
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
