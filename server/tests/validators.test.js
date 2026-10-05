import { describe, it, expect } from 'vitest';
import { validateTaskInput, validateFocusSessionInput } from '../utils/validators.js';

describe('Server Validators', () => {
  describe('validateTaskInput', () => {
    it('accepts valid task with title and priority', () => {
      const res = validateTaskInput({ title: 'Complete badge documentation', priority: 'high' });
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.data.title).toBe('Complete badge documentation');
      expect(res.data.priority).toBe('high');
      expect(res.data.category).toBe('WORK');
    });

    it('trims leading and trailing whitespace from titles', () => {
      const res = validateTaskInput({ title: '   Write unit tests   ' });
      expect(res.isValid).toBe(true);
      expect(res.data.title).toBe('Write unit tests');
    });

    it('rejects empty or whitespace-only task title', () => {
      const res = validateTaskInput({ title: '    ' });
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain('Task title is required');
    });

    it('rejects invalid priority values', () => {
      const res = validateTaskInput({ title: 'Fix bug', priority: 'urgent' });
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toMatch(/Priority must be one of/);
    });

    it('clamps progress percentages between 0 and 100', () => {
      const over = validateTaskInput({ title: 'Task 1', progress: 150 });
      expect(over.data.progress).toBe(100);

      const under = validateTaskInput({ title: 'Task 2', progress: -20 });
      expect(under.data.progress).toBe(0);
    });
  });

  describe('validateFocusSessionInput', () => {
    it('accepts valid session data', () => {
      const res = validateFocusSessionInput({ duration_minutes: 25, mode: 'pomodoro' });
      expect(res.isValid).toBe(true);
      expect(res.data.duration_minutes).toBe(25);
      expect(res.data.mode).toBe('pomodoro');
    });

    it('rejects zero or negative duration', () => {
      const res = validateFocusSessionInput({ duration_minutes: 0 });
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toMatch(/duration_minutes must be a positive number/);
    });

    it('rejects unrecognized focus modes', () => {
      const res = validateFocusSessionInput({ duration_minutes: 25, mode: 'nap' });
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toMatch(/mode must be one of/);
    });
  });
});
