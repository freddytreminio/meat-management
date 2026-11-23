import { Hono } from 'hono';
import { auditLog, connectDatabase, probeDatabase } from '@meat/db';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { createAuth } from './auth/config';
import { authOrigins } from './auth/origins';
import { administration } from './modules/administration/routes';
import { permissions } from './auth/permissions';
import type { ApiEnv } from './types';
type Probe = typeof probeDatabase;

export function createApp(probe: Probe = probeDatabase) {
  const app = new Hono<ApiEnv>();
  app.use('*', secureHeaders());
  app.use('/api/*', bodyLimit({ maxSize: 16384 }));
  app.use('/api/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      const origin = c.req.header('origin');
      const allowed = authOrigins(c.env).trusted;
      if (!origin || !allowed.includes(origin))
        return c.json({ error: 'Origen de la solicitud no permitido.' }, 403);
    }
    // La conexión y la instancia de autenticación pertenecen a esta invocación.
    const connection = await connectDatabase(c.env.DATABASE_URL);
    try {
      c.set('db', connection.db);
      c.set('auth', createAuth(connection.db, c.env));
      await next();
    } finally {
      await connection.close();
    }
  });

  const authPaths = new Set([
    'sign-in/email',
    'sign-out',
    'get-session',
    'change-password',
    'list-sessions',
    'revoke-session',
    'revoke-other-sessions',
  ]);
  app.all('/api/auth/*', async (c) => {
    const path = c.req.path.slice('/api/auth/'.length);
    if (!authPaths.has(path))
      return c.json({ error: 'Ruta de autenticación no disponible.' }, 404);
    const auth = c.get('auth');
    const previous =
      path === 'sign-out' || path === 'change-password'
        ? await auth.api.getSession({ headers: c.req.raw.headers })
        : null;
    const response = await auth.handler(c.req.raw);
    const action =
      path === 'sign-in/email' && !response.ok
        ? 'auth.login_failed'
        : previous && response.ok && path === 'sign-out'
          ? 'auth.logout'
          : previous && response.ok && path === 'change-password'
            ? 'auth.password_changed'
            : null;
    if (action)
      await c
        .get('db')
        .insert(auditLog)
        .values({
          id: crypto.randomUUID(),
          actorId: previous?.user.id ?? null,
          targetId: previous?.user.id ?? null,
          action,
        });
    return response;
  });

  app.use('/api/*', async (c, next) => {
    const identity = await c
      .get('auth')
      .api.getSession({ headers: c.req.raw.headers });
    if (!identity || identity.user.disabled)
      return c.json({ error: 'Inicia sesión para continuar.' }, 401);
    c.set('identity', identity);
    await next();
  });
  app.get('/api/me', (c) => {
    const current = c.get('identity')!;
    return c.json({
      user: {
        id: current.user.id,
        name: current.user.name,
        email: current.user.email,
        role: current.user.role,
      },
      session: { id: current.session.id, expiresAt: current.session.expiresAt },
      permissions: Object.hasOwn(permissions, current.user.role)
        ? permissions[current.user.role as keyof typeof permissions]
        : [],
    });
  });
  app.route('/api/admin', administration);
  app.get('/health', (c) =>
    c.json({ status: 'ok', service: 'meat-management-api' }),
  );
  app.get('/health/db', async (c) => {
    try {
      if (!c.env.DATABASE_URL) throw new Error('DATABASE_URL missing');
      return c.json(await probe(c.env.DATABASE_URL));
    } catch {
      // No exponer credenciales, consultas ni detalles internos al navegador.
      return c.json({ status: 'error', database: 'unavailable' }, 503);
    }
  });
  app.notFound((c) => c.json({ error: 'not_found' }, 404));
  app.onError((error, c) => {
    if (error instanceof HTTPException)
      return c.json({ error: error.message }, error.status);
    console.error('API request failed', {
      path: c.req.path,
      errorType: error.name,
    });
    return c.json(
      { error: 'No se pudo completar la solicitud. Intenta de nuevo.' },
      500,
    );
  });
  return app;
}
