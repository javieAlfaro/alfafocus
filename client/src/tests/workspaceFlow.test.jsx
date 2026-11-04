// @vitest-environment jsdom

import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localDateKey, sessionDay } from '../utils/calendarDates';

const liveApiUrl = process.env.WORKSPACE_TEST_API_URL;

const getButton = (text, root = document) => {
  const button = [...root.querySelectorAll('button')].find(node => node.textContent.trim() === text);
  expect(button, 'Button: ' + text).toBeTruthy();
  return button;
};

const click = async element => {
  await act(async () => element.click());
};

const wait = async (ms = 175) => {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, ms)); });
};

const change = async (element, value) => {
  const prototype = element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
};

describe('Workspace navigation with the ' + (liveApiUrl ? 'HTTP' : 'mock') + ' adapter', () => {
  let root, api, parent;

  beforeEach(async () => {
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(noon);
    vi.stubEnv('VITE_USE_MOCK_API', liveApiUrl ? 'false' : 'true');
    if (liveApiUrl) vi.stubEnv('VITE_API_BASE_URL', liveApiUrl);
    else vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Mock mode made a network request'); }));
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    localStorage.clear();
    api = await import('../api');
    if (liveApiUrl) {
      await api.register({ username: 'ui-' + crypto.randomUUID(), password: 'integration-test' });
      const [project] = await api.listLists();
      parent = await api.createTask({ title: 'Project report', list_id: project.id });
    } else {
      await api.login({ username: 'Demo' });
      localStorage.setItem('alfafocus:lists', JSON.stringify([{ id: 10, title: 'Course project' }]));
      localStorage.setItem('alfafocus:tasks', '[]');
      localStorage.setItem('alfafocus:focus_sessions', '[]');
      parent = await api.createTask({ title: 'Project report', list_id: 10 });
    }
    const { default: App } = await import('../App');
    HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute('open', ''); };
    root = createRoot(document.body.appendChild(document.createElement('div')));
    await act(async () => root.render(<StrictMode><App /></StrictMode>));
    await wait();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('schedules an existing subtask, logs across views, and opens the logged task', async () => {
    await click(getButton('Lists & Projects'));
    await click(document.querySelector('button[title="Add nested subtask"]'));
    await change(document.querySelector('input[placeholder="Add nested subtask title..."]'), 'Review outline');
    await click(getButton('Add'));
    await wait();
    const task = (await api.listTasks()).find(row => row.title === 'Review outline');
    expect(task).toMatchObject({ parent_task_id: parent.id, list_id: parent.list_id });

    await click(getButton('Calendar & Planner'));
    const schedule = [...document.querySelectorAll('select')].find(node => node.querySelector('option[value=""]')?.textContent === 'Choose a task');
    await change(schedule, task.id);
    await click(getButton('Schedule existing task'));
    await wait();

    await click(getButton('Today & Focus'));
    const section = document.querySelector('section[aria-label="Due today"]');
    await click(getButton('Review outline', section));
    await click(getButton('Focus', document.querySelector('dialog')));
    await click(getButton('Start Focus'));
    await click(getButton('Habits & Stats'));
    await click(getButton('Pause focus'));
    vi.setSystemTime(new Date(Date.now() + 4000));
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    expect(document.body.textContent).toContain('25:00');
    await click(getButton('Resume focus'));

    vi.setSystemTime(new Date(Date.now() + 25 * 60_000));
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    await wait();
    const sessions = await api.listFocusSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ task_id: task.id, task_title: task.title, duration_minutes: 25 });
    const heatTile = [...document.querySelectorAll('button[title]')].find(node => node.title.includes('25m focused'));
    await click(heatTile);
    expect(document.body.textContent).toContain('Focus Sessions Logged');
    const sessionLinks = [...document.querySelectorAll('button')].filter(node => node.textContent.trim() === task.title);
    await click(sessionLinks.at(-1));
    expect(document.querySelector('dialog h2').textContent).toBe(task.title);
    await click(getButton('Open in Project'));
    expect(getButton(task.title)).toBeTruthy();

    await click(getButton('Kanban Board'));
    const move = document.querySelector('select[aria-label="Move Project report to…"]');
    await change(move, 'in_progress');
    await wait();
    expect(document.querySelector('section[aria-label="In Progress"]').textContent).toContain('Project report');
    const moved = document.querySelector('select[aria-label="Move Project report to…"]');
    await change(moved, 'done');
    await wait();
    expect(document.querySelector('section[aria-label="Completed"]').textContent).toContain('Project report');
    expect((await api.listTasks()).find(row => row.id === parent.id)).toMatchObject({ status: 'done', completed: true });
    if (!liveApiUrl) expect(fetch).not.toHaveBeenCalled();
  });
});

it('keeps date-only deadlines and buckets timestamps by the local day', () => {
  const timestamp = new Date(2026, 10, 5, 0, 15).toISOString();
  expect(localDateKey('2026-11-04')).toBe('2026-11-04');
  expect(sessionDay({ completed_at: timestamp })).toBe('2026-11-05');
});
