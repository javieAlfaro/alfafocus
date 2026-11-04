import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('Workspace HTTP contract against PostgreSQL', () => {
  let pool, listener, baseUrl, schema, alice, bob;

  const request = async (method, path, token, body) => {
    const response = await fetch(baseUrl + '/api' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: response.status === 204 ? null : await response.json() };
  };

  const register = async () => {
    const result = await request('POST', '/auth/register', null, {
      username: 'test-' + randomUUID(), password: 'integration-test',
    });
    expect(result.status).toBe(201);
    return result.data.token;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    ({ pool } = await import('../db/pool.js'));
    const { app } = await import('../server.js');
    schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
    await pool.query(schema);
    await pool.query(schema);
    await new Promise((resolve, reject) => {
      listener = app.listen(0, '127.0.0.1', resolve).on('error', reject);
    });
    baseUrl = 'http://127.0.0.1:' + listener.address().port;
    [alice, bob] = await Promise.all([register(), register()]);
  }, 15000);

  afterAll(async () => {
    if (listener) await new Promise(resolve => listener.close(resolve));
    await pool?.end();
  });

  it('backfills lanes for tasks created with the previous schema and preserves them on reapply', async () => {
    const db = await pool.connect();
    const namespace = 'legacy_' + randomUUID().replaceAll('-', '');
    try {
      await db.query('CREATE SCHEMA ' + namespace);
      await db.query('SET search_path TO ' + namespace);
      const [oldSchema] = schema.split('-- Workspace workflow upgrades');
      await db.query(oldSchema);
      await db.query("INSERT INTO users (id, username) VALUES (1, 'legacy')");
      await db.query(`INSERT INTO tasks (id, user_id, title, progress, completed, parent_task_id)
        VALUES (1, 1, 'Backlog', 0, false, NULL), (2, 1, 'Progress', 40, false, NULL),
        (3, 1, 'Completed', 100, true, NULL), (4, 1, 'Started by child', 0, false, NULL),
        (5, 1, 'Completed child', 0, true, 4)`);
      await db.query(schema);
      await db.query(schema);
      const tasks = await db.query('SELECT status FROM tasks ORDER BY id');
      expect(tasks.rows.map(task => task.status)).toEqual(['todo', 'in_progress', 'done', 'in_progress', 'done']);
    } finally {
      await db.query('RESET search_path');
      await db.query('DROP SCHEMA IF EXISTS ' + namespace + ' CASCADE');
      db.release();
    }
  });

  it('schedules, moves and deletes a subtree within its workspace', async () => {
    const project = (await request('POST', '/lists', alice, { title: 'Project' })).data;
    const otherProject = (await request('POST', '/lists', alice, { title: 'Destination' })).data;
    const foreignProject = (await request('POST', '/lists', bob, { title: 'Foreign' })).data;
    const parent = (await request('POST', '/tasks', alice, { title: 'Root', list_id: project.id })).data;
    const child = (await request('POST', '/tasks', alice, { title: 'Child', parent_task_id: parent.id })).data;
    const grandchild = (await request('POST', '/tasks', alice, { title: 'Grandchild', parent_task_id: child.id })).data;
    expect(child).toMatchObject({ parent_task_id: parent.id, list_id: project.id });
    expect((await request('PATCH', '/tasks/' + child.id, bob, { completed: true })).status).toBe(404);
    expect((await request('DELETE', '/tasks/' + child.id, bob)).status).toBe(404);
    expect((await request('POST', '/tasks', bob, { title: 'Foreign child', parent_task_id: child.id })).status).toBe(400);
    expect((await request('PATCH', '/tasks/' + parent.id, alice, { list_id: foreignProject.id })).status).toBe(400);
    expect((await request('DELETE', '/lists/' + project.id + '?defaultListId=' + foreignProject.id, alice)).status).toBe(400);
    const scheduled = await request('PATCH', '/tasks/' + child.id, alice, { due_date: '2026-11-09' });
    expect(scheduled.data.due_date).toBe('2026-11-09');
    expect((await request('PATCH', '/tasks/' + child.id, alice, { due_date: null })).data.due_date).toBeNull();
    expect((await request('PATCH', '/tasks/' + parent.id, alice, { list_id: otherProject.id })).status).toBe(200);
    const all = (await request('GET', '/tasks', alice)).data;
    expect(all.filter(task => [parent.id, child.id, grandchild.id].includes(task.id)).map(task => task.list_id))
      .toEqual([otherProject.id, otherProject.id, otherProject.id]);

    const session = { task_id: child.id, task_title: child.title, duration_minutes: 25, client_session_id: randomUUID() };
    expect((await request('POST', '/focus/sessions', bob, session)).status).toBe(400);
    const logs = await Promise.all([request('POST', '/focus/sessions', alice, session), request('POST', '/focus/sessions', alice, session)]);
    expect(logs[0].data).toMatchObject({ task_id: child.id, task_title: child.title });
    expect(logs[1].data.id).toBe(logs[0].data.id);
    expect((await request('DELETE', '/tasks/' + parent.id, alice)).status).toBe(204);
    expect((await request('GET', '/tasks', alice)).data.some(task => [parent.id, child.id, grandchild.id].includes(task.id))).toBe(false);
    const history = (await request('GET', '/focus/sessions', alice)).data.find(row => row.id === logs[0].data.id);
    expect(history).toMatchObject({ task_id: null, task_title: child.title });
  });

  it('moves lanes and spawns one weekday successor through concurrent completions and a reopen', async () => {
    const recurring = (await request('POST', '/tasks', alice, {
      title: 'Recurring review', due_date: '2026-11-06', recurrence_rule: 'weekdays',
    })).data;
    const path = '/tasks/' + recurring.id;
    expect((await request('PATCH', path, alice, { status: 'in_progress' })).data)
      .toMatchObject({ status: 'in_progress', completed: false, completed_at: null });
    const first = await Promise.all([
      request('PATCH', path, alice, { completed: true }),
      request('PATCH', path, alice, { status: 'done' }),
    ]);
    expect(first[0].data.completed_at).toBeTruthy();
    expect(first[1].data.completed_at).toBe(first[0].data.completed_at);
    expect((await request('PATCH', path, alice, { completed: false })).data)
      .toMatchObject({ status: 'todo', completed: false, completed_at: null });
    await request('PATCH', path, alice, { completed: true });
    const tasks = (await request('GET', '/tasks', alice)).data;
    const successors = tasks.filter(task => task.series_id === recurring.series_id && task.id !== recurring.id);
    expect(successors).toHaveLength(1);
    expect(successors[0]).toMatchObject({ due_date: '2026-11-09', status: 'todo', completed: false });
  });
});
