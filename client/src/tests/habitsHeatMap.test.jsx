import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import HabitsHeatMap from '../components/HabitsHeatMap.jsx';

describe('HabitsHeatMap Component', () => {
  it('renders safely when sessions and tasks are empty', () => {
    const html = renderToString(React.createElement(HabitsHeatMap, { sessions: [], tasks: [] }));
    expect(html).toBeDefined();
    expect(html).toContain('Mon');
    expect(html).toContain('Wed');
    expect(html).toContain('Fri');
    expect(html).toContain('Contribution settings');
    expect(html).toContain('Less');
    expect(html).toContain('More');
  });

  it('renders safely when props are completely omitted', () => {
    const html = renderToString(React.createElement(HabitsHeatMap, {}));
    expect(html).toBeDefined();
    expect(html).toContain('Habits &amp; Analytics');
  });

  it('renders correctly with real sessions and completed tasks', () => {
    const sampleSessions = [
      { id: 1, duration_minutes: 50, completed_at: '2026-10-11T10:00:00.000Z', task_title: 'Research' },
      { id: 2, duration_minutes: 25, completed_at: '2026-10-10T14:30:00.000Z', task_title: 'Design' },
    ];
    const sampleTasks = [
      { id: 1, title: 'Draft paper', completed: true, completed_at: '2026-10-11T12:00:00.000Z' },
      { id: 2, title: 'Fix bug', completed: false },
    ];

    const html = renderToString(React.createElement(HabitsHeatMap, {
      sessions: sampleSessions,
      tasks: sampleTasks,
    }));

    expect(html).toContain('1.3 hours focused');
    expect(html).toContain('focus sessions recorded');
    expect(html).toContain('completed tasks');
  });

  it('renders year selection buttons including current and past years', () => {
    const currentYear = new Date().getFullYear();
    const html = renderToString(React.createElement(HabitsHeatMap, { sessions: [], tasks: [] }));
    expect(html).toContain(String(currentYear));
    expect(html).toContain(String(currentYear - 1));
    expect(html).toContain(String(currentYear - 2));
  });
});
