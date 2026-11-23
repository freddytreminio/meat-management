import { account, auditLog, session, user, type Database } from '@meat/db';
import { and, eq, sql } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod';
import type { createUserSchema, updateUserSchema } from '../../auth/validation';

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
async function assertAdministrator(tx: Transaction, actorId: string) {
  const [actor] = await tx
    .select({ role: user.role, disabled: user.disabled })
    .from(user)
    .where(eq(user.id, actorId));
  if (!actor || actor.disabled || actor.role !== 'admin')
    throw new HTTPException(403, {
      message: 'Tu cuenta ya no tiene permisos de administración.',
    });
}

export async function createManagedUser(
  db: Database,
  data: z.infer<typeof createUserSchema>,
  actorId: string | null,
  bootstrap = false,
) {
  const password = await hashPassword(data.password);
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(740219)`);
    if (bootstrap) {
      const [existing] = await tx.select({ id: user.id }).from(user).limit(1);
      if (existing) return null;
    } else {
      if (!actorId) throw new HTTPException(403);
      await assertAdministrator(tx, actorId);
    }
    const [duplicate] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email));
    if (duplicate)
      throw new HTTPException(409, {
        message: 'Ya existe un usuario con ese correo.',
      });
    const id = crypto.randomUUID();
    const [created] = await tx
      .insert(user)
      .values({ id, name: data.name, email: data.email, role: data.role })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        disabled: user.disabled,
        createdAt: user.createdAt,
      });
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      userId: id,
      accountId: id,
      providerId: 'credential',
      password,
    });
    await tx.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId,
      targetId: id,
      action: bootstrap ? 'user.bootstrap' : 'user.created',
    });
    return created;
  });
}

export async function updateManagedUser(
  db: Database,
  id: string,
  data: z.infer<typeof updateUserSchema>,
  actorId: string,
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(740219)`);
    await assertAdministrator(tx, actorId);
    const [target] = await tx.select().from(user).where(eq(user.id, id));
    if (!target)
      throw new HTTPException(404, { message: 'Usuario no encontrado.' });
    if (id === actorId && (data.disabled || data.role !== 'admin'))
      throw new HTTPException(409, {
        message: 'No puedes quitarte el acceso de administrador.',
      });
    if (
      target.role === 'admin' &&
      !target.disabled &&
      (data.role !== 'admin' || data.disabled)
    ) {
      const activeAdmins = await tx
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.role, 'admin'), eq(user.disabled, false)));
      if (activeAdmins.length <= 1)
        throw new HTTPException(409, {
          message: 'Debe quedar al menos un administrador activo.',
        });
    }
    await tx
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(user.id, id));
    if (data.disabled || data.role !== target.role)
      await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId,
      targetId: id,
      action:
        data.disabled !== target.disabled
          ? data.disabled
            ? 'user.disabled'
            : 'user.enabled'
          : data.role !== target.role
            ? 'user.role_changed'
            : 'user.updated',
    });
    return { success: true };
  });
}

export async function revokeUserSessions(
  db: Database,
  id: string,
  actorId: string,
) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(740219)`);
    await assertAdministrator(tx, actorId);
    const [target] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, id));
    if (!target)
      throw new HTTPException(404, { message: 'Usuario no encontrado.' });
    await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId,
      targetId: id,
      action: 'session.revoked_all',
    });
  });
}
