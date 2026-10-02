// Database operations for Lists, Tasks, and Focus Sessions
// Strictly uses parameterized queries ($1, $2) to prevent SQL injection.

export async function getAllLists(pool) {
  const result = await pool.query(
    'SELECT * FROM task_lists ORDER BY id ASC'
  )
  return result.rows
}

export async function createList(pool, { title, color }) {
  const result = await pool.query(
    'INSERT INTO task_lists (user_id, title, color) VALUES (1, $1, $2) RETURNING *',
    [title, color || '#059669']
  )
  return result.rows[0]
}

export async function getAllTasks(pool) {
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

export async function createTask(pool, { title, category, priority, due_date, list_id, parent_task_id }) {
  const result = await pool.query(
    `INSERT INTO tasks (title, category, priority, due_date, list_id, parent_task_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, 1)
     RETURNING *`,
    [title, category || 'WORK', priority || 'medium', due_date || null, list_id || 1, parent_task_id || null]
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

export async function recordFocusSession(pool, { task_id, task_title, mode, duration_minutes }) {
  const result = await pool.query(
    `INSERT INTO focus_sessions (user_id, task_id, task_title, mode, duration_minutes)
     VALUES (1, $1, $2, $3, $4)
     RETURNING *`,
    [task_id || null, task_title || 'General Focus', mode || 'pomodoro', duration_minutes || 25]
  )
  return result.rows[0]
}

export async function getAllFocusSessions(pool) {
  const result = await pool.query(
    'SELECT * FROM focus_sessions ORDER BY completed_at DESC'
  )
  return result.rows
}
