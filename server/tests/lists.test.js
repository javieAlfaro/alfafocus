import { describe, it, expect, vi } from 'vitest';
import { createList, getListById, updateList, deleteList } from '../tasksRepo.js';

describe('Task Lists Repository', () => {
  it('creates a list with defaults', async () => {
    const mockPool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ id: 10, user_id: 1, title: 'Sprint Backlog', color: '#059669' }],
      }),
    };

    const result = await createList(mockPool, { title: 'Sprint Backlog' }, 1);
    expect(result.id).toBe(10);
    expect(result.title).toBe('Sprint Backlog');
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO task_lists'),
      [1, 'Sprint Backlog', '#059669']
    );
  });

  it('updates list title and color', async () => {
    const mockPool = {
      query: vi
        .fn()
        // First query: getListById
        .mockResolvedValueOnce({
          rows: [{ id: 10, user_id: 1, title: 'Old Title', color: '#059669' }],
        })
        // Second query: updateList
        .mockResolvedValueOnce({
          rows: [{ id: 10, user_id: 1, title: 'New Title', color: '#6366F1' }],
        }),
    };

    const result = await updateList(mockPool, 10, { title: 'New Title', color: '#6366F1' }, 1);
    expect(result.title).toBe('New Title');
    expect(result.color).toBe('#6366F1');
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE task_lists'),
      ['New Title', '#6366F1', 10, 1]
    );
  });

  it('safely deletes list and reassigns tasks to default list', async () => {
    const mockPool = {
      query: vi
        .fn()
        // First query: getListById
        .mockResolvedValueOnce({
          rows: [{ id: 5, user_id: 1, title: 'Archived Project', color: '#EF4444' }],
        })
        // Second query: update tasks to default list
        .mockResolvedValueOnce({ rowCount: 3 })
        // Third query: delete task_lists
        .mockResolvedValueOnce({ rowCount: 1 }),
    };

    const success = await deleteList(mockPool, 5, 1, 1);
    expect(success).toBe(true);

    // Verify task reassignment query was executed
    expect(mockPool.query).toHaveBeenCalledWith(
      'UPDATE tasks SET list_id = $1 WHERE list_id = $2 AND user_id = $3',
      [1, 5, 1]
    );
    // Verify list delete query was executed
    expect(mockPool.query).toHaveBeenCalledWith(
      'DELETE FROM task_lists WHERE id = $1 AND user_id = $2 RETURNING id',
      [5, 1]
    );
  });

  it('returns false when trying to delete non-existent list', async () => {
    const mockPool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const success = await deleteList(mockPool, 999, 1, 1);
    expect(success).toBe(false);
  });
});
