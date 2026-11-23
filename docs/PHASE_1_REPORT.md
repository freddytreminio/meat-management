# Informe de entrega · Fase 1

Fecha: 23 de noviembre de 2026 (America/El_Salvador).

## Resultado

Infraestructura local implementada y verificada. React, Hono y PostgreSQL
funcionan juntos en Docker. La API se ejecuta sobre workerd mediante Wrangler
local; la conexión usa `pg` y Drizzle con SQL real. Las migraciones se aplican
antes de iniciar la API y PostgreSQL conserva los datos en un volumen.

Raíz utilizada: `C:\Users\fredt\OneDrive\Escritorio\ventas`.
La carpeta estaba vacía; el nombre lógico del monorepo y del proyecto Compose es
`meat-management`. Se copió íntegramente el documento adjunto a `PROJECT_PLAN.md`.
No existían instrucciones AGENTS heredadas en los directorios antecesores revisados.

## Entorno comprobado

| Componente              | Versión observada    |
| ----------------------- | -------------------- |
| Host                    | Windows / PowerShell |
| Node del host           | 24.22.3              |
| Node de la imagen Linux | 22.23.5              |
| pnpm                    | 11.25.0              |
| Docker Engine           | 29.2.1               |
| Docker Compose          | 5.1.0                |
| PostgreSQL              | 17.12                |
| React                   | 19.3.1               |
| Vite                    | 8.3.8                |
| Hono                    | 4.13.21              |
| Wrangler                | 4.166.0              |
| Drizzle ORM / Kit       | 0.45.4 / 0.31.11     |
| pg                      | 8.23.1               |
| TypeScript              | 5.9.3                |
| Vitest                  | 4.1.12               |
| Playwright              | 1.65.1               |

El lockfile fija las versiones resueltas. No se necesita `npm` en el host;
se utilizó pnpm para instalar y ejecutar herramientas.

## Archivos entregados

```text
.dockerignore
.env.example
.gitignore
.prettierignore
.prettierrc.json
AGENTS.md
PROJECT_PLAN.md
README.md
compose.yaml
eslint.config.js
package.json
playwright.config.ts
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
vitest.config.ts
apps/
  api/
    package.json
    tsconfig.json
    wrangler.jsonc
    scripts/dev.mjs
    src/app.ts
    src/app.test.ts
    src/index.ts
  web/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    src/main.tsx
    src/styles.css
packages/
  db/
    package.json
    tsconfig.json
    drizzle.config.ts
    src/index.ts
    src/migrate.ts
    src/schema/index.ts
    drizzle/0000_volatile_bug.sql
    drizzle/meta/0000_snapshot.json
    drizzle/meta/_journal.json
infra/docker/Dockerfile.dev
scripts/verify-local.mjs
tests/e2e/infrastructure.spec.ts
docs/architecture/local.md
docs/PHASE_1_REPORT.md
```

También se generaron artefactos ignorados: dependencias, bundles `dist`, estado
local de herramientas, capturas `test-results/desktop.png` y
`test-results/mobile.png`. `.dev.vars` se genera dentro del contenedor API con la
conexión local. Git está inicializado en `main`, sin commits ni remotos.

## Comandos utilizados

Inspección: `Get-Location`, `Get-ChildItem -Force`, lectura del adjunto y búsqueda
de `AGENTS.md` con `rg`, `Get-Command`, `node --version`, `pnpm --version`,
`docker version`, `docker compose version`, `docker desktop status`,
`wsl --list --verbose` y lectura de registros locales de Docker.
Se iniciaron Docker Desktop y su motor local, sin alterar otros proyectos.

Implementación y calidad:

```sh
pnpm view hono version
pnpm view wrangler version
pnpm view vite version
pnpm install
pnpm db:generate
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm install --frozen-lockfile --offline
git init -b main
git status --porcelain --untracked-files=all
git remote -v
git check-ignore apps/api/.dev.vars apps/api/dist/index.js apps/web/dist/index.html node_modules/.pnpm .env
```

Docker y comprobaciones reales:

```sh
docker compose config --quiet
docker compose up --build -d
docker compose ps -a
docker compose logs --tail 100 db migrate api web
docker compose run --rm migrate
docker compose run --rm --no-deps web sh -c 'pnpm lint && pnpm typecheck && pnpm test && pnpm build'
docker compose exec -T db psql -U meat_local -d meat_management -c 'SELECT version(); SELECT * FROM infrastructure_probe; SELECT count(*) FROM drizzle.__drizzle_migrations;'
pnpm verify:local
pnpm exec playwright install chromium
pnpm test:e2e
```

`verify:local` ejecutó además `docker compose stop db`, `start db` y
`up -d --no-deps --force-recreate db`. No se eliminaron volúmenes.
El build de API ejecutó exclusivamente `wrangler deploy --dry-run --outdir dist`.
Se consultaron los endpoints por HTTP tanto directamente como mediante el proxy
Vite y el navegador. La regeneración final de Drizzle indicó que no había cambios
de esquema pendientes.

## Pruebas y evidencia

| Verificación                                        | Resultado                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| Instalación aislada Linux desde lockfile            | Correcta, sin usar node_modules de Windows                       |
| Reinstalación del host con lockfile y caché offline | Correcta                                                         |
| Compose válido y arranque coordinado                | Correcto                                                         |
| `pnpm lint`                                         | Correcto en Windows y Linux                                      |
| `pnpm typecheck`                                    | Correcto en los tres paquetes, Windows y Linux                   |
| `pnpm test`                                         | 5 pruebas pasadas, Windows y Linux                               |
| `pnpm build`                                        | React y bundle Workers compilados, Windows y Linux               |
| `pnpm db:generate` final                            | Sin cambios de esquema pendientes                                |
| Migración inicial                                   | Aplicada; una entrada en historial Drizzle                       |
| Repetición del migrador                             | Correcta, sin duplicar historial ni marcador                     |
| `GET /health`                                       | 200 con API operativa                                            |
| `GET /health/db`                                    | 200 tras consultar la tabla técnica mediante Drizzle             |
| PostgreSQL detenido                                 | Liveness 200 y readiness 503 sin credenciales en respuesta       |
| Recuperación de PostgreSQL                          | Readiness vuelve a 200                                           |
| Recreación del contenedor PostgreSQL                | Marcador e historial conservados en el volumen                   |
| Proxy `localhost:5173/api/health/db`                | 200, conexión frontend → API → SQL                               |
| Playwright Chromium                                 | 2 pruebas pasadas: recorrido real y vista móvil                  |
| Errores JavaScript de la página                     | Ninguno en la prueba de recorrido                                |
| Capturas de escritorio y móvil                      | Revisadas visualmente, sin recortes ni desbordamiento horizontal |
| Exclusión de secretos y artefactos                  | Comprobada con git check-ignore                                  |

Las pruebas unitarias cubren liveness independiente, paso de configuración al
adaptador, respuesta preparada, fallo de conexión sin filtrar detalles, falta de
configuración y rutas inexistentes. Las pruebas reales están separadas de los mocks.

El marcador técnico mantuvo exactamente el mismo valor antes y después de detener,
arrancar y recrear PostgreSQL:

```text
id = 1
created_at = 2026-11-23 17:15:35.817408+00
migraciones aplicadas = 1
```

## Problemas encontrados

1. **Motor Docker inicialmente detenido/inaccesible.** Se inició Docker Desktop
   instalado y se esperó al motor Linux. No se reinstaló WSL ni se modificaron
   ajustes globales de Docker.
2. **DNS del registro npm restringido en el sandbox.** La instalación y las
   verificaciones que requerían acceso al host/red se ejecutaron con la elevación
   autorizada por el entorno. El lockfile se comprobó después también offline.
3. **Ruta interna del ejecutable Wrangler no exportada.** El primer arranque de
   API falló. Se sustituyó por la invocación pública de `wrangler` en el script
   de pnpm; la reconstrucción posterior validó la corrección.
4. **Certificados CA ausentes en Debian slim.** workerd fallaba antes de iniciar
   su servidor local. El Dockerfile instala `ca-certificates`; después arrancó y
   consultó PostgreSQL correctamente.
5. **Socket HTTP keep-alive caducado en el verificador.** Los comandos Docker
   síncronos podían dejar obsoleta la conexión reutilizada por fetch. El verificador
   utiliza conexiones HTTP nuevas entre operaciones. La repetición completa pasó;
   el bloque finally devolvió PostgreSQL a su estado operativo también tras el
   primer fallo de esa prueba.
6. **Avisos de dependencias de desarrollo.** El registro notificó deprecación de
   ESLint 9 y de subdependencias de Drizzle Kit/Wrangler. Las versiones quedaron
   fijadas en el lockfile y los checks pasaron. No se realizó una auditoría de
   seguridad completa ni se afirma que estos checks la sustituyan.

Durante la simulación de caída/recreación de PostgreSQL aparecieron errores de
socket/DNS en los registros de workerd; corresponden a la indisponibilidad
provocada y se comprobó la recuperación posterior.

## Estado final de los servicios

| Servicio Compose | Estado comprobado                 | Acceso                                    |
| ---------------- | --------------------------------- | ----------------------------------------- |
| `web`            | En ejecución, healthy             | http://localhost:5173                     |
| `api`            | En ejecución, healthy             | http://localhost:8787/health y /health/db |
| `db`             | En ejecución, healthy             | 127.0.0.1:5432                            |
| `migrate`        | Finalizado con código 0, esperado | Ejecución única previa a la API           |

Los servicios quedan ejecutándose. Los puertos publicados están limitados al
equipo local y el volumen `meat-management_postgres_data` conserva los datos.

## Límites y trabajo posterior

La Fase 1 local queda verificada. Se comprobó compatibilidad de Hono, `pg` y
Drizzle dentro del runtime Workers local, además del bundle dry-run. La conexión
remota a Neon, TLS real del proveedor, despliegue Cloudflare y sus límites de
producción no se probaron porque pertenecen a fases posteriores y no se autorizaron
cambios cloud. Las fuentes oficiales consultadas están enlazadas en
`docs/architecture/local.md`.

No se implementaron autenticación, inventario, productos ni ventas. No se crearon
recursos cloud, repositorios GitHub, workflows de despliegue, commits, push ni
publicaciones. Router, formularios, contratos compartidos y otras librerías del
plan se incorporarán cuando tengan consumidores concretos.
