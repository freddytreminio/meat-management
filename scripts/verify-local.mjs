import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

function compose(...args) {
  return execFileSync('docker', ['compose', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  }).trim();
}

function sql(query) {
  return compose(
    'exec',
    '-T',
    'db',
    'sh',
    '-c',
    'exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "$1"',
    'sh',
    query,
  );
}

async function status(path, expected) {
  const response = await fetch(`http://localhost:8787${path}`, {
    signal: AbortSignal.timeout(10_000),
    // Los comandos Docker síncronos pueden superar el keep-alive de Wrangler.
    headers: { Connection: 'close' },
  });
  assert.equal(response.status, expected, path);
  return response.json();
}

async function waitForDatabase() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      await status('/health/db', 200);
      return;
    } catch {
      await setTimeout(1000);
    }
  }
  throw new Error('PostgreSQL did not recover within 60 seconds');
}

await status('/health', 200);
assert.deepEqual(await status('/health/db', 200), {
  status: 'ok',
  database: 'connected',
  migration: 'applied',
});
const createdAt = sql(
  'SELECT created_at::text FROM infrastructure_probe WHERE id=1',
);
assert.ok(createdAt);
const migrations = sql('SELECT count(*) FROM drizzle.__drizzle_migrations');
assert.ok(
  Number(migrations) >= 2,
  'Las migraciones de autenticación deben estar aplicadas',
);
compose('run', '--rm', 'migrate');
assert.equal(
  sql('SELECT count(*) FROM drizzle.__drizzle_migrations'),
  migrations,
);
console.log('PASS: SQL real y migración repetible sin duplicar historial.');

try {
  compose('stop', 'db');
  await status('/health', 200);
  assert.deepEqual(await status('/health/db', 503), {
    status: 'error',
    database: 'unavailable',
  });
  console.log(
    'PASS: liveness independiente y readiness 503 con PostgreSQL detenido.',
  );
} finally {
  compose('start', 'db');
}
await waitForDatabase();
assert.equal(
  sql('SELECT created_at::text FROM infrastructure_probe WHERE id=1'),
  createdAt,
);
console.log(
  'PASS: recuperación y persistencia después de detener y arrancar PostgreSQL.',
);

compose('up', '-d', '--no-deps', '--force-recreate', 'db');
await waitForDatabase();
assert.equal(
  sql('SELECT created_at::text FROM infrastructure_probe WHERE id=1'),
  createdAt,
);
assert.equal(
  sql('SELECT count(*) FROM drizzle.__drizzle_migrations'),
  migrations,
);
console.log(
  'PASS: datos e historial persisten al recrear el contenedor usando el volumen.',
);

const proxy = await fetch('http://localhost:5173/api/health/db');
assert.equal(proxy.status, 200);
assert.deepEqual(await proxy.json(), {
  status: 'ok',
  database: 'connected',
  migration: 'applied',
});
console.log('PASS: proxy frontend → Workers → Drizzle → PostgreSQL.');
