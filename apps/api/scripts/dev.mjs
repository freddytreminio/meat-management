import { writeFileSync } from 'node:fs';

if (process.env.DATABASE_URL) {
  writeFileSync(
    new URL('../.dev.vars', import.meta.url),
    ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'AUTH_ORIGIN']
      .filter((key) => process.env[key])
      .map((key) => `${key}=${JSON.stringify(process.env[key])}`)
      .join('\n') + '\n',
    { mode: 0o600 },
  );
}
