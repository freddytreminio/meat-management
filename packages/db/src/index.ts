import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { infrastructureProbe } from './schema/index';
import * as schema from './schema/index';

export * from './schema/index';

export async function connectDatabase(connectionString: string) {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });
  await client.connect();
  return { db: drizzle(client, { schema }), close: () => client.end() };
}

export type Database = Awaited<ReturnType<typeof connectDatabase>>['db'];

export async function probeDatabase(connectionString: string) {
  // Una conexión por petición evita compartir sockets entre invocaciones Workers.
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
    statement_timeout: 3000,
  });
  try {
    await client.connect();
    const db = drizzle(client);
    const rows = await db
      .select({ id: infrastructureProbe.id })
      .from(infrastructureProbe)
      .where(sql`${infrastructureProbe.id} = 1`);
    if (rows[0]?.id !== 1) throw new Error('Infrastructure migration missing');
    return {
      status: 'ok' as const,
      database: 'connected' as const,
      migration: 'applied' as const,
    };
  } finally {
    await client.end();
  }
}
