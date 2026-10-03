import express from 'express'
import cors from 'cors'
import { pool } from './db/pool.js'
import * as tasksRepo from './tasksRepo.js'
import { validateTaskInput, validateFocusSessionInput } from './utils/validators.js'

const app = express()

// 1. CORS Configuration (Checklist #26: named origins, not wildcard)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

// 2. Health check endpoints
// Process liveness
app.get('/healthz', (request, response) => {
  response.json({ ok: true, app: 'AlfaFocus API' })
})

// Database readiness
app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

// 3. HTTP Basic Authentication & App Gate Middleware (Course Section 2, Option B)
// Enforces standard HTTP Basic Auth so browsers prompt for username/password,
// while also supporting the x-app-password header for client requests.
const APP_USER = process.env.APP_USER || 'alfa'
const APP_PASSWORD = process.env.APP_PASSWORD || 'alfa2026'

app.use('/api', (request, response, next) => {
  // Allow OPTIONS preflight requests for CORS
  if (request.method === 'OPTIONS') return next()

  const authHeader = request.headers['authorization'] || ''
  const legacyPassword = request.headers['x-app-password']

  // 1. Check HTTP Basic Authentication: "Basic <base64(user:pass)>"
  if (authHeader.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
      const colonIndex = credentials.indexOf(':')
      if (colonIndex !== -1) {
        const user = credentials.slice(0, colonIndex)
        const pass = credentials.slice(colonIndex + 1)
        if (user === APP_USER && pass === APP_PASSWORD) {
          return next()
        }
      }
    } catch {
      // Malformed header, proceed to 401
    }
  }

  // 2. Check x-app-password header for seamless React client compatibility
  if (legacyPassword === APP_PASSWORD) {
    return next()
  }

  // 3. Unauthorized: send WWW-Authenticate header to trigger native browser login modal
  response.setHeader('WWW-Authenticate', 'Basic realm="AlfaFocus Secure API"')
  return response.status(401).json({ error: 'Unauthorized: valid access credentials required.' })
})

// 4. List Endpoints
app.get('/api/lists', async (request, response, next) => {
  try {
    const lists = await tasksRepo.getAllLists(pool)
    response.json(lists)
  } catch (error) {
    next(error)
  }
})

app.post('/api/lists', async (request, response, next) => {
  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  if (!title) return response.status(400).json({ error: 'List title is required' })

  try {
    const created = await tasksRepo.createList(pool, { title, color: request.body?.color })
    response.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

// 5. Task Endpoints
app.get('/api/tasks', async (request, response, next) => {
  try {
    const tasks = await tasksRepo.getAllTasks(pool)
    response.json(tasks)
  } catch (error) {
    next(error)
  }
})

app.post('/api/tasks', async (request, response, next) => {
  const { isValid, errors, data } = validateTaskInput(request.body ?? {})
  if (!isValid) return response.status(400).json({ error: errors.join('; ') })

  try {
    const created = await tasksRepo.createTask(pool, data)
    response.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/tasks/:id', async (request, response, next) => {
  try {
    const updated = await tasksRepo.updateTask(pool, request.params.id, request.body ?? {})
    if (!updated) return response.status(404).json({ error: 'Task not found' })
    response.json(updated)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/tasks/:id', async (request, response, next) => {
  try {
    const removed = await tasksRepo.deleteTask(pool, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Task not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// 5. Focus Session Endpoints
app.get('/api/focus/sessions', async (request, response, next) => {
  try {
    const sessions = await tasksRepo.getAllFocusSessions(pool)
    response.json(sessions)
  } catch (error) {
    next(error)
  }
})

app.post('/api/focus/sessions', async (request, response, next) => {
  const { isValid, errors, data } = validateFocusSessionInput(request.body ?? {})
  if (!isValid) return response.status(400).json({ error: errors.join('; ') })

  try {
    const logged = await tasksRepo.recordFocusSession(pool, data)
    response.status(201).json(logged)
  } catch (error) {
    next(error)
  }
})

// 404 Fallback
app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

// 6. Centralized Error Handler (Checklist #25: Do not leak stack traces or connection details)
app.use((error, request, response, next) => {
  console.error('[SERVER ERROR]:', error.message)
  response.status(500).json({ error: 'Something went wrong on the server' })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`AlfaFocus API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})
