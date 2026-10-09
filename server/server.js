import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pool } from './db/pool.js'
import * as tasksRepo from './tasksRepo.js'
import { validateTaskInput, validateFocusSessionInput } from './utils/validators.js'
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  verifyToken 
} from './utils/auth.js'

const app = express()

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// 2. CORS Configuration (Checklist #26: named origins, not wildcard)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

// 3. Rate Limiting Middleware (Brute-force & DoS Defense)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
})

app.use('/api', apiLimiter)

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

// 3. User Authentication Endpoints (JWT + bcryptjs)
app.post('/api/auth/register', authLimiter, async (request, response, next) => {
  const username = typeof request.body?.username === 'string' ? request.body.username.trim() : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''

  if (!username || username.length < 3) {
    return response.status(400).json({ error: 'Username must be at least 3 characters long.' })
  }
  if (!password || password.length < 6) {
    return response.status(400).json({ error: 'Password must be at least 6 characters long.' })
  }

  try {
    const existing = await tasksRepo.findUserByUsername(pool, username)
    if (existing) {
      return response.status(409).json({ error: 'Username already taken.' })
    }

    const password_hash = await hashPassword(password)
    const newUser = await tasksRepo.createUser(pool, { username, password_hash })
    await tasksRepo.createList(pool, { title: 'My Tasks', color: '#059669' }, newUser.id)
    const token = generateToken(newUser)

    response.status(201).json({
      user: { id: newUser.id, username: newUser.username },
      token,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', authLimiter, async (request, response, next) => {
  const username = typeof request.body?.username === 'string' ? request.body.username.trim() : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''

  if (!username || !password) {
    return response.status(400).json({ error: 'Username and password are required.' })
  }

  try {
    const user = await tasksRepo.findUserByUsername(pool, username)
    if (!user || !user.password_hash) {
      return response.status(401).json({ error: 'Invalid username or password.' })
    }

    const matches = await comparePassword(password, user.password_hash)
    if (!matches) {
      return response.status(401).json({ error: 'Invalid username or password.' })
    }

    const token = generateToken(user)
    response.json({
      user: { id: user.id, username: user.username },
      token,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/me', (request, response) => {
  const authHeader = request.headers['authorization'] || ''
  if (authHeader.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.slice(7).trim())
    if (decoded) {
      return response.json({ user: decoded })
    }
  }
  response.status(401).json({ error: 'Not authenticated' })
})

// 4. HTTP Basic Authentication & App Gate Middleware (Course Section 2, Option B + JWT Support)
const APP_USER = process.env.APP_USER || 'alfa'
const APP_PASSWORD = process.env.APP_PASSWORD || 'alfa2026'

app.use('/api', (request, response, next) => {
  // Allow OPTIONS preflight requests for CORS
  if (request.method === 'OPTIONS') return next()

  // Allow registration and login without credentials
  if (
    request.path === '/auth/register' || 
    request.path === '/auth/login' ||
    request.path.startsWith('/auth') ||
    request.originalUrl?.includes('/api/auth')
  ) {
    return next()
  }

  const authHeader = request.headers['authorization'] || ''
  const legacyPassword = request.headers['x-app-password']

  // 1. Check Bearer JWT Token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    const decoded = verifyToken(token)
    if (decoded) {
      request.user = decoded
      return next()
    }
  }

  // 2. Check HTTP Basic Authentication: "Basic <base64(user:pass)>"
  if (authHeader.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
      const colonIndex = credentials.indexOf(':')
      if (colonIndex !== -1) {
        const user = credentials.slice(0, colonIndex)
        const pass = credentials.slice(colonIndex + 1)
        if (user === APP_USER && pass === APP_PASSWORD) {
          request.user = { id: 1, username: 'default_user' }
          return next()
        }
      }
    } catch {
      // Malformed header, proceed to 401
    }
  }

  // 3. Check x-app-password header for seamless React client compatibility
  if (legacyPassword === APP_PASSWORD) {
    request.user = { id: 1, username: 'default_user' }
    return next()
  }

  // 4. Unauthorized: send WWW-Authenticate header to trigger native browser login modal
  response.setHeader('WWW-Authenticate', 'Basic realm="AlfaFocus Secure API"')
  return response.status(401).json({ error: 'Unauthorized: valid access credentials required.' })
})

// 5. List Endpoints
app.get('/api/lists', async (request, response, next) => {
  try {
    const lists = await tasksRepo.getAllLists(pool, request.user?.id)
    response.json(lists)
  } catch (error) {
    next(error)
  }
})

app.post('/api/lists', async (request, response, next) => {
  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  if (!title) return response.status(400).json({ error: 'List title is required' })

  try {
    const created = await tasksRepo.createList(pool, { title, color: request.body?.color }, request.user?.id)
    response.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

// 6. Task Endpoints
app.get('/api/tasks', async (request, response, next) => {
  try {
    const tasks = await tasksRepo.getAllTasks(pool, request.user?.id)
    response.json(tasks)
  } catch (error) {
    next(error)
  }
})

app.post('/api/tasks', async (request, response, next) => {
  const { isValid, errors, data } = validateTaskInput(request.body ?? {})
  if (!isValid) return response.status(400).json({ error: errors.join('; ') })

  try {
    const created = await tasksRepo.createTask(pool, data, request.user?.id)
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

// 7. Focus Session Endpoints
app.get('/api/focus/sessions', async (request, response, next) => {
  try {
    const sessions = await tasksRepo.getAllFocusSessions(pool, request.user?.id)
    response.json(sessions)
  } catch (error) {
    next(error)
  }
})

app.post('/api/focus/sessions', async (request, response, next) => {
  const { isValid, errors, data } = validateFocusSessionInput(request.body ?? {})
  if (!isValid) return response.status(400).json({ error: errors.join('; ') })

  try {
    const logged = await tasksRepo.recordFocusSession(pool, data, request.user?.id)
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
