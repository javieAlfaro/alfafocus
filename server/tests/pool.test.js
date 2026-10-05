import { describe, it, expect } from 'vitest';
import { normalizeDatabaseUrl } from '../db/pool.js';

describe('Database Connection Pool URL Normalizer', () => {
  it('safely percent-encodes hash (#) in passwords to avoid URI fragment cutoff', () => {
    const rawUrl = 'postgres://postgres:my#secret#pass@db.supabase.co:5432/postgres';
    const normalized = normalizeDatabaseUrl(rawUrl);
    expect(normalized).toContain('my%23secret%23pass');
    expect(normalized).not.toContain(':my#secret#pass@');
  });

  it('preserves clean database URLs without modification', () => {
    const rawUrl = 'postgres://user:cleanpassword@localhost:5432/alfafocus';
    const normalized = normalizeDatabaseUrl(rawUrl);
    expect(normalized).toBe(rawUrl);
  });

  it('strips enclosing double quotes added by environment injectors', () => {
    const quoted = '"postgres://user:pass@localhost:5432/alfafocus"';
    const normalized = normalizeDatabaseUrl(quoted);
    expect(normalized.startsWith('"')).toBe(false);
    expect(normalized.endsWith('"')).toBe(false);
  });
});
