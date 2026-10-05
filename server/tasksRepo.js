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

export async function getTaskById(pool, id) {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE id = $1',
    [id]
  )
  return result.rows[0] ?? null
}

export async function createTask(pool, { title, category, priority, due_date, list_id, parent_task_id }, userId = 1) {
  const result = await pool.query(
    `INSERT INTO tasks (title, category, priority, due_date, list_id, parent_task_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, category || 'WORK', priority || 'medium', due_date || null, list_id || 1, parent_task_id || null, userId || 1]
  )
  return result.rows[0]
}

export async function updateTask(pool, id, fields) {
  const current = await getTaskById(pool, id)
  if (!current) return null

  const title = fields.title !== undefined ? fields.title : current.title
  const category = fields.category !== undefined ? fields.category : current.category
  const priority = fields.priority !== undefined ? fields.priority : current.priority
  const completed = fields.completed !== undefined ? fields.completed : current.completed
  const progress = fields.progress !== undefined ? fields.progress : current.progress
  const list_id = fields.list_id !== undefined ? fields.list_id : current.list_id

  const result = await pool.query(
    `UPDATE tasks
     SET title = $1, category = $2, priority = $3, completed = $4, progress = $5, list_id = $6
     WHERE id = $7
     RETURNING *`,
    [title, category, priority, completed, progress, list_id, id]
  )
  return result.rows[0]
}

export async function deleteTask(pool, id) {
  // Cascades to delete subtasks automatically due to FOREIGN KEY ... ON DELETE CASCADE
  const result = await pool.query(
    'DELETE FROM tasks WHERE id = $1 RETURNING id',
    [id]
  )
  return (result.rowCount ?? 0) > 0
}

export async function recordFocusSession(pool, { task_id, task_title, mode, duration_minutes }, userId = 1) {
  const result = await pool.query(
    `INSERT INTO focus_sessions (user_id, task_id, task_title, mode, duration_minutes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId || 1, task_id || null, task_title || 'General Focus', mode || 'pomodoro', duration_minutes || 25]
  )
  return result.rows[0]
}

export async function getAllFocusSessions(pool, userId = null) {
  if (userId) {
    const result = await pool.query(
      'SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY completed_at DESC',
      [userId]
    )
    return result.rows
  }
  const result = await pool.query(
    'SELECT * FROM focus_sessions ORDER BY completed_at DESC'
  )
  return result.rows
}
