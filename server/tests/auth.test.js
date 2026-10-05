import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../utils/auth.js';

describe('Server Authentication Utilities', () => {
  it('hashes passwords and verifies matching plain text with bcrypt', async () => {
    const plain = 'secretPassword123';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await comparePassword(plain, hash);
    expect(isMatch).toBe(true);

    const isWrong = await comparePassword('wrongPass', hash);
    expect(isWrong).toBe(false);
  });

  it('generates a valid signed JWT and verifies payload correctly', () => {
    const user = { id: 42, username: 'javier_test' };
    const token = generateToken(user);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe('javier_test');
  });

  it('returns null when verifying a malformed or forged token', () => {
    const invalidToken = 'not.a.valid.jwt.token';
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });
});
