import type { Database } from '@meat/db';
import type { Auth, AuthConfig, AuthSession } from './auth/config';

export type ApiEnv = {
  Bindings: { DATABASE_URL: string } & AuthConfig;
  Variables: { db: Database; auth: Auth; identity: AuthSession | null };
};
