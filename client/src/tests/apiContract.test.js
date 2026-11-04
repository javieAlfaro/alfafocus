// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as mockApi from '../api/mockApi';
import * as httpApi from '../api/httpApi';

beforeEach(() => localStorage.clear());

describe('Dual-mode task and focus contracts', () => {
  it('keeps hierarchy, dates, status, and session history consistent in mock storage', async () => {
    const parent = await mockApi.createTask({ title: 'Plan' });
    const child = await mockApi.createTask({ title: 'Work', parent_task_id: parent.id });
    const grandchild = await mockApi.createTask({ title: 'Verify', parent_task_id: child.id });
    expect(child.list_id).toBe(parent.list_id);
    const scheduled = await mockApi.updateTask(child.id, { due_date: '2026-11-09' });
    expect(scheduled).toMatchObject({ due_date: '2026-11-09', parent_task_id: parent.id });
    await expect(mockApi.updateTask(child.id, { due_date: '2026-02-31' })).rejects.toMatchObject({ status: 400 });

    const payload = { task_id: child.id, task_title: child.title, duration_minutes: 25, client_session_id: 'demo-run' };
    const [first, second] = await Promise.all([mockApi.recordFocusSession(payload), mockApi.recordFocusSession(payload)]);
    expect(first.id).toBe(second.id);
    expect(first.task_id).toBe(child.id);

    await mockApi.deleteTask(parent.id);
    const tasks = await mockApi.listTasks();
    expect(tasks.some(task => [parent.id, child.id, grandchild.id].includes(task.id))).toBe(false);
    expect((await mockApi.listFocusSessions()).find(session => session.id === first.id))
      .toMatchObject({ task_id: null, task_title: child.title });
  });

  it('persists lane changes and creates a single successor after reopening', async () => {
    const task = await mockApi.createTask({ title: 'Review', due_date: '2026-11-06', recurrence_rule: 'weekdays' });
    expect(await mockApi.updateTask(task.id, { status: 'in_progress' })).toMatchObject({ completed: false, status: 'in_progress' });
    const done = await mockApi.updateTask(task.id, { status: 'done' });
    expect(done.completed_at).toBeTruthy();
    expect((await mockApi.updateTask(task.id, { completed: true })).completed_at).toBe(done.completed_at);
    await mockApi.updateTask(task.id, { completed: false });
    await mockApi.updateTask(task.id, { completed: true });
    const successors = (await mockApi.listTasks()).filter(row => row.id !== task.id && row.series_id === task.series_id);
    expect(successors).toHaveLength(1);
    expect(successors[0]).toMatchObject({ due_date: '2026-11-09', completed: false, status: 'todo' });
  });

  it('sends the same inputs through the HTTP adapter with only bearer credentials', async () => {
    localStorage.setItem('alfafocus_token', 'example-jwt');
    const fakeFetch = vi.fn(async (_url, options) => Response.json(JSON.parse(options.body)));
    vi.stubGlobal('fetch', fakeFetch);
    try {
      const fields = { due_date: null, status: 'in_progress' };
      expect(await httpApi.updateTask(42, fields)).toEqual(fields);
      const payload = { task_id: 42, task_title: 'Verify', duration_minutes: 25, client_session_id: 'same-run' };
      expect(await httpApi.recordFocusSession(payload)).toEqual(payload);
      expect(fakeFetch.mock.calls[0][1].headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer example-jwt',
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
