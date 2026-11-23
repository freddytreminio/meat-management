import {
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from 'node:fs';
import { randomBytes } from 'node:crypto';

const envPath = new URL('../.env', import.meta.url);
if (!existsSync(envPath))
  writeFileSync(
    envPath,
    readFileSync(new URL('../.env.example', import.meta.url), 'utf8'),
    { mode: 0o600 },
  );
let lines = readFileSync(envPath, 'utf8').trimEnd().split(/\r?\n/);
let changed = false;
for (const [key, value] of Object.entries({
  BETTER_AUTH_SECRET: randomBytes(48).toString('hex'),
  AUTH_ORIGIN: 'http://localhost:5173',
  BOOTSTRAP_ADMIN_EMAIL: 'admin@meat.local',
  BOOTSTRAP_ADMIN_PASSWORD: randomBytes(18).toString('base64url'),
})) {
  const entries = lines.filter((line) => line.startsWith(`${key}=`));
  const existing = entries.findLast((line) =>
    line.slice(key.length + 1).trim(),
  );
  if (entries.length !== 1 || !existing) {
    lines = lines.filter((line) => !line.startsWith(`${key}=`));
    lines.push(existing ?? `${key}=${value}`);
    changed = true;
  }
}
if (changed)
  writeFileSync(envPath, `${lines.join('\n')}\n`, {
    mode: 0o600,
  });
const values = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at), line.slice(at + 1)];
    }),
);
const credentialsPath = new URL(
  '../gestion/credenciales.local.txt',
  import.meta.url,
);
const previous = existsSync(credentialsPath)
  ? readFileSync(credentialsPath, 'utf8')
  : '';
if (!previous.includes('ADMINISTRADOR DE LA APLICACIÓN'))
  appendFileSync(
    credentialsPath,
    `\n\nADMINISTRADOR DE LA APLICACIÓN — FASE 2\nAcceso: http://localhost:5173/login\nCorreo: ${values.BOOTSTRAP_ADMIN_EMAIL}\nContraseña inicial: ${values.BOOTSTRAP_ADMIN_PASSWORD}\nSe crea solo si no existen usuarios. No es el usuario PostgreSQL ni Adminer.\nPuedes cambiar la contraseña desde Mi cuenta. Esta nota no se actualiza al cambiarla.\n`,
  );
console.log(
  'Configuración local preparada. Credenciales en gestion/credenciales.local.txt; secretos en .env.',
);
