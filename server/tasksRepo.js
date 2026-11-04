import { randomUUID } from 'node:crypto'
import { nextOccurrence, resolveTaskStatus } from './utils/taskRules.js'

// Database operations for Users, Lists, Tasks, and Focus Sessions
// Strictly uses parameterized queries ($1, $2) to prevent SQL injection.

export async function findUserByUsername(pool, username) {
  const result = await pool.query(
    'SELECT id, username, password_hash, created_at FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  )
  return result.rows[0] ?? null
}

export async function findUserById(pool, id) {
  const result = await pool.query(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [id]
  )
  return result.rows[0] ?? null
}

export async function createUser(pool, { username, password_hash }) {
  const result = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
    [username, password_hash]
  )
  return result.rows[0]
}

export async function getAllLists(pool, userId = null) {
  if (userId) {
    const result = await pool.query(
      'SELECT * FROM task_lists WHERE user_id = $1 ORDER BY id ASC',
      [userId]
    )
    return result.rows
  }
  const result = await pool.query(
    'SELECT * FROM task_lists ORDER BY id ASC'
  )
  return result.rows
}

export async function createList(pool, { title, color }, userId = 1) {
  const result = await pool.query(
    'INSERT INTO task_lists (user_id, title, color) VALUES ($1, $2, $3) RETURNING *',
    [userId, title, color || '#059669']
  )
  return result.rows[0]
}

export async function getListById(pool, id, userId = null) {
  if (userId) {
    const result = await pool.query(
      'SELECT * FROM task_lists WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0] ?? null
  }
  const result = await pool.query(
    'SELECT * FROM task_lists WHERE id = $1',
    [id]
  )
  return result.rows[0] ?? null
}

export async function updateList(pool, id, { title, color }, userId = null) {
  const current = await getListById(pool, id, userId)
  if (!current) return null

  const updatedTitle = typeof title === 'string' && title.trim() ? title.trim() : current.title
  const updatedColor = typeof color === 'string' && color.trim() ? color.trim() : current.color

  if (userId) {
    const result = await pool.query(
      `UPDATE task_lists
       SET title = $1, color = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [updatedTitle, updatedColor, id, userId]
    )
    return result.rows[0] ?? null
  }

  const result = await pool.query(
    `UPDATE task_lists
     SET title = $1, color = $2
     WHERE id = $3
     RETURNING *`,
    [updatedTitle, updatedColor, id]
  )
  return result.rows[0] ?? null
}

export async function deleteList(pool, id, defaultListId = null, userId = null) {
  const remove = async client => {
    const current = await getListById(client, id, userId)
    if (!current) return false

    if (defaultListId && Number(defaultListId) !== Number(id)) {
      if (userId) {
        if (!await getListById(client, defaultListId, userId)) throw invalidReference('Destination project not found')
        await client.query('UPDATE tasks SET list_id = $1 WHERE list_id = $2 AND user_id = $3', [defaultListId, id, userId])
      } else {
        await client.query('UPDATE tasks SET list_id = $1 WHERE list_id = $2', [defaultListId, id])
      }
    }
    const result = userId
      ? await client.query('DELETE FROM task_lists WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId])
      : await client.query('DELETE FROM task_lists WHERE id = $1 RETURNING id', [id])
    return (result.rowCount ?? 0) > 0
  }
  return userId ? withWorkspaceTransaction(pool, userId, remove) : remove(pool)
}

export async function getAllTasks(pool, userId = null) {
  if (userId) {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.rows
  }
  const result = await pool.query(
    'SELECT * FROM tasks ORDER BY created_at DESC'
  )
  return result.rows
}

function invalidReference(message) {
  return Object.assign(new Error(message), { status: 400 })
}

async function withWorkspaceTransaction(pool, userId, mutate) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Serialize hierarchy and recurrence mutations for this workspace.
    await client.query('SELECT id FROM users WHERE id = $1 FOR NO KEY UPDATE', [userId])
    const result = await mutate(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getTaskById(pool, id, userId) {
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId])
  return result.rows[0] ?? null
}

export function createTask(pool, fields, userId) {
  return withWorkspaceTransaction(pool, userId, async client => {
    const { title, category, priority, due_date = null, parent_task_id = null, recurrence_rule = null } = fields
    let listId = fields.list_id ?? null

    if (parent_task_id !== null) {
      const parent = await getTaskById(client, parent_task_id, userId)
      if (!parent) throw invalidReference('Parent task not found')
      if (parent.recurrence_rule) throw invalidReference('Recurring tasks must be standalone')
      if (listId !== null && listId !== parent.list_id) throw invalidReference('Subtasks must use the parent project')
      listId = parent.list_id
    } else if (listId !== null) {
      if (!await getListById(client, listId, userId)) throw invalidReference('Project not found')
    } else {
      const lists = await getAllLists(client, userId)
      listId = (lists[0] ?? await createList(client, { title: 'My Tasks' }, userId)).id
    }
    if (recurrence_rule && (!due_date || parent_task_id !== null)) {
      throw invalidReference('Recurring tasks must be standalone and have a due date')
    }

    const status = resolveTaskStatus({ status: 'todo' }, fields)
    const completed = status === 'done'
    const result = await client.query(
      `INSERT INTO tasks (
         title, category, priority, due_date, list_id, parent_task_id, user_id,
         progress, status, completed, completed_at, recurrence_rule, series_id, occurrence_date
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $10 THEN now() END, $11, $12, $13)
       RETURNING *`,
      [title, category, priority, due_date, listId, parent_task_id, userId, fields.progress ?? 0,
        status, completed, recurrence_rule, recurrence_rule ? randomUUID() : null, recurrence_rule ? due_date : null]
    )
    return result.rows[0]
  })
}

export function updateTask(pool, id, fields, userId) {
  return withWorkspaceTransaction(pool, userId, async client => {
    const current = await getTaskById(client, id, userId)
    if (!current) return null

    const next = { ...current, ...fields }
    if (Object.hasOwn(fields, 'list_id') && fields.list_id !== current.list_id) {
      if (current.parent_task_id !== null) throw invalidReference('Move the parent task to change projects')
      if (next.list_id !== null && !await getListById(client, next.list_id, userId)) {
        throw invalidReference('Project not found')
      }
      await client.query(
        `WITH RECURSIVE subtree(id) AS (
           SELECT id FROM tasks WHERE id = $1 AND user_id = $2
           UNION
           SELECT child.id FROM tasks AS child JOIN subtree ON child.parent_task_id = subtree.id
           WHERE child.user_id = $2
         )
         UPDATE tasks SET list_id = $3 WHERE id IN (SELECT id FROM subtree) AND user_id = $2`,
        [id, userId, next.list_id]
      )
    }

    if (next.recurrence_rule) {
      const children = await client.query('SELECT 1 FROM tasks WHERE parent_task_id = $1 AND user_id = $2 LIMIT 1', [id, userId])
      if (!next.due_date || next.parent_task_id !== null || children.rowCount) {
        throw invalidReference('Recurring tasks must be standalone and have a due date')
      }
      next.series_id ??= randomUUID()
      next.occurrence_date ??= next.due_date
    }

    next.status = resolveTaskStatus(current, fields)
    next.completed = next.status === 'done'
    const result = await client.query(
      `UPDATE tasks
       SET title = $1, category = $2, priority = $3, completed = $4, progress = $5,
           due_date = $6, status = $7, recurrence_rule = $8, series_id = $9, occurrence_date = $10,
           completed_at = CASE WHEN $4 THEN COALESCE(completed_at, now()) ELSE NULL END
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [next.title, next.category, next.priority, next.completed, next.progress, next.due_date,
        next.status, next.recurrence_rule, next.series_id, next.occurrence_date, id, userId]
    )

    if (next.completed && !current.completed && next.recurrence_rule) {
      const nextDate = nextOccurrence(next.occurrence_date, next.recurrence_rule)
      if (nextDate) {
        await client.query(
          `INSERT INTO tasks (title, category, priority, due_date, list_id, user_id,
                              recurrence_rule, series_id, occurrence_date)
           SELECT $1, $2, $3, $4, $5, $6, $7, $8, $4
           WHERE NOT EXISTS (
             SELECT 1 FROM tasks WHERE user_id = $6 AND series_id = $8 AND occurrence_date > $9
           )
           ON CONFLICT (user_id, series_id, occurrence_date) DO NOTHING`,
          [next.title, next.category, next.priority, nextDate, next.list_id, userId,
            next.recurrence_rule, next.series_id, next.occurrence_date]
        )
      }
    }
    return result.rows[0]
  })
}

export function deleteTask(pool, id, userId) {
  return withWorkspaceTransaction(pool, userId, async client => {
    const result = await client.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId])
    return result.rowCount > 0
  })
}

export function recordFocusSession(pool, { task_id, task_title, mode, duration_minutes, client_session_id }, userId) {
  return withWorkspaceTransaction(pool, userId, async client => {
    if (client_session_id) {
      const existing = await client.query(
        'SELECT * FROM focus_sessions WHERE user_id = $1 AND client_session_id = $2',
        [userId, client_session_id]
      )
      if (existing.rows[0]) return existing.rows[0]
    }
    if (task_id !== null && !await getTaskById(client, task_id, userId)) {
      throw invalidReference('Session task not found')
    }
    const result = await client.query(
      `INSERT INTO focus_sessions (user_id, task_id, task_title, mode, duration_minutes, client_session_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, task_id, task_title, mode, duration_minutes, client_session_id]
    )
    return result.rows[0]
  })
}

export async function getAllFocusSessions(pool, userId) {
  const result = await pool.query(
    'SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY completed_at DESC',
    [userId]
  )
  return result.rows
}
