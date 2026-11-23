import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const date = (name: string) => timestamp(name, { withTimezone: true });

export const user = pgTable('auth_user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role').default('user').notNull(),
  disabled: boolean('disabled').default(false).notNull(),
  createdAt: date('created_at').defaultNow().notNull(),
  updatedAt: date('updated_at').defaultNow().notNull(),
});

export const session = pgTable(
  'auth_session',
  {
    id: text('id').primaryKey(),
    expiresAt: date('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: date('created_at').defaultNow().notNull(),
    updatedAt: date('updated_at').defaultNow().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('auth_session_user_idx').on(table.userId)],
);

export const account = pgTable(
  'auth_account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: date('access_token_expires_at'),
    refreshTokenExpiresAt: date('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: date('created_at').defaultNow().notNull(),
    updatedAt: date('updated_at').defaultNow().notNull(),
  },
  (table) => [index('auth_account_user_idx').on(table.userId)],
);

export const verification = pgTable(
  'auth_verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: date('expires_at').notNull(),
    createdAt: date('created_at').defaultNow().notNull(),
    updatedAt: date('updated_at').defaultNow().notNull(),
  },
  (table) => [index('auth_verification_identifier_idx').on(table.identifier)],
);

export const rateLimit = pgTable('auth_rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id'),
    targetId: text('target_id'),
    action: text('action').notNull(),
    createdAt: date('created_at').defaultNow().notNull(),
  },
  (table) => [index('audit_log_created_idx').on(table.createdAt)],
);
