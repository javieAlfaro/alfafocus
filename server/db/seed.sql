-- =========================================================
-- AlfaFocus Seed Data (Invented Sample Data)
-- Safe to run after schema.sql.
-- =========================================================

-- Create default user
INSERT INTO users (id, username)
VALUES (1, 'default_user')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT GREATEST(MAX(id), 1) FROM users));

-- Create sample task lists
INSERT INTO task_lists (id, user_id, title, color)
VALUES 
  (1, 1, 'AlfaFocus Redesign', '#059669'),
  (2, 1, 'Marketing Q1', '#3B82F6'),
  (3, 1, 'Personal Routines', '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

SELECT setval('task_lists_id_seq', (SELECT GREATEST(MAX(id), 1) FROM task_lists));

-- Create sample tasks matching Wireframe Page 10
INSERT INTO tasks (id, user_id, list_id, title, category, priority, progress, completed)
VALUES 
  (1, 1, 1, 'Finalize AlfaFocus Design Wireframes', 'WORK', 'high', 75, FALSE),
  (2, 1, 2, 'Review Q1 Marketing Strategy', 'WORK', 'high', 20, FALSE),
  (3, 1, 3, 'Morning Workout', 'PERSONAL', 'low', 100, TRUE),
  (4, 1, 1, 'Configure PostgreSQL schema & endpoints', 'STUDY', 'medium', 40, FALSE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('tasks_id_seq', (SELECT GREATEST(MAX(id), 1) FROM tasks));

-- Create initial sample focus session
INSERT INTO focus_sessions (user_id, task_id, task_title, mode, duration_minutes)
VALUES 
  (1, 1, 'Finalize AlfaFocus Design Wireframes', 'pomodoro', 25)
ON CONFLICT DO NOTHING;
