import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';
import { createUserSchema, updateUserSchema } from './validation';

describe('authorization policy', () => {
  it('gives the administrator technical administration permissions', () => {
    expect(hasPermission('admin', 'users:write')).toBe(true);
    expect(hasPermission('admin', 'audit:read')).toBe(true);
  });
  it('denies administrative permissions to regular and unknown roles', () => {
    for (const role of ['user', 'admin,user', 'superadmin', 'toString', '']) {
      expect(hasPermission(role, 'users:write')).toBe(false);
      expect(hasPermission(role, 'audit:read')).toBe(false);
    }
    expect(hasPermission('user', 'profile:read')).toBe(true);
  });
  it('rejects weak passwords, arbitrary roles and additional fields', () => {
    const valid = {
      name: 'Test User',
      email: 'user@example.test',
      password: 'sufficient-password-123',
      role: 'user',
    };
    expect(createUserSchema.safeParse(valid).success).toBe(true);
    expect(
      createUserSchema.safeParse({ ...valid, password: 'short' }).success,
    ).toBe(false);
    expect(
      createUserSchema.safeParse({ ...valid, role: 'owner' }).success,
    ).toBe(false);
    expect(
      createUserSchema.safeParse({ ...valid, emailVerified: true }).success,
    ).toBe(false);
    expect(
      updateUserSchema.safeParse({
        name: 'Test',
        role: 'user',
        disabled: false,
        password: 'secret',
      }).success,
    ).toBe(false);
  });
});
