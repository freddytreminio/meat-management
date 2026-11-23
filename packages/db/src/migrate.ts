import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
try {
  await client.connect();
  await migrate(drizzle(client), {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  console.log('Migraciones aplicadas correctamente.');
} finally {
  await client.end();
}
