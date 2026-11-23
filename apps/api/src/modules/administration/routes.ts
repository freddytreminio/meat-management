import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { auditLog, user } from '@meat/db';
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import type { ApiEnv } from '../../types';
import { hasPermission } from '../../auth/permissions';
import { createUserSchema, updateUserSchema } from '../../auth/validation';
import {
  createManagedUser,
  revokeUserSessions,
  updateManagedUser,
} from './service';

export const administration = new Hono<ApiEnv>();
administration.use('*', async (c, next) => {
  const current = c.get('identity');
  const permission = c.req.path.endsWith('/audit')
    ? 'audit:read'
    : c.req.method === 'GET'
      ? 'users:read'
      : 'users:write';
  if (!current || !hasPermission(current.user.role, permission))
    throw new HTTPException(403, {
      message: 'No tienes permiso para esta operación.',
    });
  await next();
});

const pagination = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  search: z.string().trim().max(100).default(''),
});

administration.get('/users', async (c) => {
  const parsed = pagination.safeParse(c.req.query());
  if (!parsed.success)
    throw new HTTPException(400, { message: 'Parámetros inválidos.' });
  const { page, search } = parsed.data;
  const filter = search
    ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    : undefined;
  const db = c.get('db');
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      disabled: user.disabled,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(filter)
    .orderBy(asc(user.createdAt), asc(user.id))
    .limit(10)
    .offset((page - 1) * 10);
  const [total] = await db.select({ value: count() }).from(user).where(filter);
  return c.json({ users: rows, total: total?.value ?? 0, page, pageSize: 10 });
});

administration.post('/users', async (c) => {
  const parsed = createUserSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!parsed.success)
    throw new HTTPException(400, {
      message:
        'Revisa nombre, correo, rol y contraseña (mínimo 12 caracteres).',
    });
  return c.json(
    await createManagedUser(
      c.get('db'),
      parsed.data,
      c.get('identity')!.user.id,
    ),
    201,
  );
});

administration.patch('/users/:id', async (c) => {
  const parsed = updateUserSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!parsed.success)
    throw new HTTPException(400, { message: 'Datos de usuario inválidos.' });
  return c.json(
    await updateManagedUser(
      c.get('db'),
      c.req.param('id'),
      parsed.data,
      c.get('identity')!.user.id,
    ),
  );
});

administration.post('/users/:id/revoke-sessions', async (c) => {
  await revokeUserSessions(
    c.get('db'),
    c.req.param('id'),
    c.get('identity')!.user.id,
  );
  return c.json({ success: true });
});

administration.get('/audit', async (c) => {
  const parsed = pagination.safeParse(c.req.query());
  if (!parsed.success)
    throw new HTTPException(400, { message: 'Página inválida.' });
  const db = c.get('db');
  const [total] = await db.select({ value: count() }).from(auditLog);
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      actorId: auditLog.actorId,
      actorName: user.name,
      targetId: auditLog.targetId,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.actorId, user.id))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(20)
    .offset((parsed.data.page - 1) * 20);
  return c.json({
    events: rows,
    total: total?.value ?? 0,
    page: parsed.data.page,
    pageSize: 20,
  });
});
