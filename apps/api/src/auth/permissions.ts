export const permissions = {
  admin: ['users:read', 'users:write', 'audit:read', 'profile:read'],
  user: ['profile:read'],
} as const;

export type Permission = (typeof permissions.admin)[number];

export function hasPermission(role: string, permission: Permission) {
  return (
    Object.hasOwn(permissions, role) &&
    (
      permissions[role as keyof typeof permissions] as readonly string[]
    ).includes(permission)
  );
}
