import { betterAuth } from 'better-auth/minimal';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { auditLog, user, type Database } from '@meat/db';
import * as schema from '@meat/db';
import { eq } from 'drizzle-orm';
import { authOrigins, type OriginConfig } from './origins';

export type AuthConfig = { BETTER_AUTH_SECRET?: string } & OriginConfig;

export function createAuth(db: Database, config: AuthConfig) {
  if (!config.BETTER_AUTH_SECRET || config.BETTER_AUTH_SECRET.length < 32)
    throw new Error('Authentication secret is missing');
  const { origin, trusted } = authOrigins(config);
  return betterAuth({
    appName: 'Meat Management',
    baseURL: origin,
    basePath: '/api/auth',
    secret: config.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
    trustedOrigins: trusted,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          defaultValue: 'user',
          input: false,
        },
        disabled: {
          type: 'boolean',
          required: true,
          defaultValue: false,
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 30,
      cookieCache: { enabled: false },
    },
    advanced: {
      useSecureCookies: origin.startsWith('https://'),
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', path: '/' },
      ipAddress: { ipAddressHeaders: [] },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 120,
      customRules: { '/sign-in/email': { window: 60, max: 20 } },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (data) => {
            const [found] = await db
              .select({ disabled: user.disabled })
              .from(user)
              .where(eq(user.id, data.userId));
            if (!found || found.disabled)
              throw new APIError('FORBIDDEN', {
                message: 'Cuenta desactivada. Contacta al administrador.',
              });
            return { data };
          },
          after: async (data) => {
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              actorId: data.userId,
              targetId: data.userId,
              action: 'auth.login',
            });
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
