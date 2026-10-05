-- =========================================================
-- AlfaFocus PostgreSQL Database Schema
-- Safe to run against an empty database, and safe to run twice.
-- =========================================================

-- 1. Users (for multi-user support or single-user isolation)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure password_hash exists if table was created earlier
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. Task Lists / Folders
CREATE TABLE IF NOT EXISTS task_lists (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#059669',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tasks & Nested Subtasks (Adjacency List Model)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    list_id INT REFERENCES task_lists(id) ON DELETE SET NULL,
    parent_task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'WORK',
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    due_date DATE,
    progress INT DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Focus Sessions (Feeds the Pomodoro history and Heat Map)
CREATE TABLE IF NOT EXISTS focus_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    task_title VARCHAR(255),
    mode VARCHAR(20) NOT NULL,
    duration_minutes INT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and quick lookups
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS tasks_parent_idx ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS tasks_list_idx ON tasks(list_id);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS focus_sessions_completed_at_idx ON focus_sessions(completed_at DESC);
