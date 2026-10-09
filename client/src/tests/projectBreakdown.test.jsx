import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import ProjectBreakdown from '../components/ProjectBreakdown.jsx';

describe('ProjectBreakdown Component', () => {
  it('renders safely when lists is empty', () => {
    const html = renderToString(React.createElement(ProjectBreakdown, { tasks: [], lists: [] }));
    expect(html).toBeDefined();
  });

  it('renders safely when props are omitted', () => {
    const html = renderToString(React.createElement(ProjectBreakdown, {}));
    expect(html).toBeDefined();
  });

  it('renders safely with lists and tasks', () => {
    const html = renderToString(React.createElement(ProjectBreakdown, {
      tasks: [{ id: 1, title: 'Test Task', list_id: 1, completed: false }],
      lists: [{ id: 1, title: 'General', color: '#10B981' }],
    }));
    expect(html).toContain('General');
    expect(html).toContain('Test Task');
  });

  it('renders safely in board view mode', () => {
    const html = renderToString(React.createElement(ProjectBreakdown, {
      tasks: [
        { id: 1, title: 'Todo Task', list_id: 1, completed: false },
        { id: 2, title: 'Done Task', list_id: 1, completed: true },
      ],
      lists: [{ id: 1, title: 'General', color: '#10B981' }],
    }));
    expect(html).toBeDefined();
  });
});
