# Informe de Fase 2

Fecha: 23 de noviembre de 2026, America/El_Salvador.

## Resultado local

Autenticación y administración implementadas sobre la infraestructura de Fase 1.
Better Auth 1.7.27 funciona dentro de workerd con Hono, Drizzle y PostgreSQL local.
El usuario autorizó esta fase; `AGENTS.md` y `PROJECT_PLAN.md` reflejan el alcance.

Acceso: http://localhost:5173/login. La primera cuenta es `admin@meat.local`; la
contraseña generada está en `gestion/credenciales.local.txt`, excluido de Git y del
contexto Docker. No se usa la contraseña PostgreSQL para entrar a la aplicación.

## Funcionalidades

- Login y logout con Better Auth. Registro público y rutas de autenticación no
  utilizadas cerrados mediante una lista explícita de endpoints permitidos.
- Sesiones en PostgreSQL, cookies firmadas HttpOnly y SameSite=Lax. Secure se
  activa al configurar un origen HTTPS. Duración configurada de ocho horas con
  renovación; sin caché de permisos en cookies ni tokens en localStorage.
- Administrador y usuario como roles técnicos iniciales. El administrador gestiona
  cuentas y consulta auditoría; el usuario accede a su cuenta y al diagnóstico.
- Creación de cuentas con nombre, correo normalizado, contraseña mínima de doce
  caracteres y rol validado. Hashes generados por la utilidad de Better Auth;
  creación de usuario, credencial y auditoría dentro de una misma transacción.
- Edición de nombres y roles, desactivación/reactivación y cierre de sesiones.
  No se eliminan usuarios ni historial desde la interfaz.
- Comprobación de permisos en el backend y repetición de la autorización del actor
  dentro de las transacciones administrativas. Un bloqueo asesor PostgreSQL
  serializa estas operaciones. Protección del propio administrador y del último
  administrador activo.
- Cambio de rol o desactivación revoca las sesiones del usuario. Una cuenta
  desactivada no obtiene nuevas sesiones. Un cambio de contraseña invalida las
  otras sesiones y la contraseña anterior.
- Búsqueda y paginación de usuarios; auditoría paginada con referencias, actor y
  fecha. Se registran logins, fallos de login procesados por Better Auth, logout,
  cambio de contraseña y operaciones administrativas. No se guardan contraseñas
  ni tokens en auditoría.
- Panel responsive con Resumen, Usuarios, Actividad y Mi cuenta. En móvil, las
  filas de usuarios se muestran como fichas con todas sus acciones visibles.
  Los formularios modales usan el diálogo nativo para manejar foco y teclado.

## Seguridad y entorno

Las operaciones mutables requieren un Origin autorizado. El backend aplica límite
de tamaño del cuerpo y cabeceras de seguridad. Zod valida las entradas; los DTO de
usuarios no exponen cuentas, hashes ni tokens. Las rutas protegidas devuelven 401
sin sesión y 403 cuando el rol carece de permiso.

El limitador de Better Auth está habilitado y persistido en PostgreSQL, con veinte
intentos de login por minuto. En este entorno local los clientes comparten un
contador por ruta: no se confía en cabeceras de IP enviadas por un cliente. La IP
confiable del proxy y los límites de Workers se validarán para el despliegue.

Cada petición abre su conexión PostgreSQL y su instancia Better Auth; no comparte
sockets globales entre invocaciones Workers. El secreto se carga mediante bindings
locales generados desde el entorno del contenedor, sin incorporarlo al bundle.

`node scripts/setup-local.mjs` crea secretos locales aleatorios si faltan y conserva
los valores existentes. `migrate` aplica las migraciones y ejecuta el bootstrap:
solo crea un administrador cuando la tabla de usuarios está vacía. Los reinicios y
las siguientes migraciones no restablecen contraseñas ni crean otra cuenta inicial.

## Archivos principales

| Área                    | Archivos                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuración y alcance | `AGENTS.md`, `PROJECT_PLAN.md`, `.env.example`, `compose.yaml`, manifests pnpm y lockfile                                                             |
| Preparación local       | `scripts/setup-local.mjs`, `apps/api/scripts/bootstrap.ts`, `apps/api/scripts/dev.mjs`                                                                |
| Persistencia            | `packages/db/src/schema/auth.ts`, exportaciones del esquema y `packages/db/src/index.ts`                                                              |
| Migraciones             | `packages/db/drizzle/0001_nervous_green_goblin.sql`, snapshot y journal Drizzle                                                                       |
| Autenticación           | `apps/api/src/auth/config.ts`, `permissions.ts`, `validation.ts`, `types.ts`, integración en `app.ts`                                                 |
| Administración          | `apps/api/src/modules/administration/service.ts` y `routes.ts`                                                                                        |
| Frontend                | `apps/web/src/main.tsx`, `lib/api.ts`, `lib/auth.ts`, `admin.css`, páginas Login, Users, Audit, Account y Diagnostics                                 |
| Proxy                   | `apps/web/vite.config.ts`: preserva `/api/*`; solo transforma las rutas de diagnóstico existentes                                                     |
| Pruebas                 | `apps/api/src/auth/permissions.test.ts`, `tests/e2e/authentication.spec.ts`, `helpers.ts`, adaptación de infraestructura y `scripts/verify-local.mjs` |
| Notas                   | `README.md`, `gestion/fase-2.md`, índice, levantamiento y pasos de gestión                                                                            |

La migración `0000_volatile_bug.sql` de Fase 1 se conservó. El historial contiene
dos migraciones. Se añadieron seis tablas: `auth_user`, `auth_account`,
`auth_session`, `auth_verification`, `auth_rate_limit` y `audit_log`.

## Comandos ejecutados

```sh
pnpm --filter @meat/api add better-auth zod @better-auth/drizzle-adapter
pnpm --filter @meat/api add -D tsx
pnpm --filter @meat/web add better-auth react-router-dom @tanstack/react-query react-hook-form @hookform/resolvers zod lucide-react
pnpm install
node scripts/setup-local.mjs
pnpm db:generate
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm peers check
docker compose config --quiet
docker compose up --build -d
docker compose ps -a
docker compose logs --tail 50 migrate api
pnpm test:e2e
pnpm verify:local
docker compose run --rm --no-deps web sh -c 'pnpm lint && pnpm typecheck && pnpm test && pnpm build'
git check-ignore .env gestion/credenciales.local.txt
```

También se consultaron por SQL los recuentos de migraciones, cuentas y roles sin
imprimir hashes, contraseñas o tokens. La nota privada se actualizó con el acceso
generado, sin copiar secretos cloud.

## Validación

- Ocho pruebas unitarias correctas: las cinco de infraestructura y tres de permisos
  y validación. Roles desconocidos y propiedades de entrada adicionales rechazados.
- Seis pruebas Playwright correctas contra los servicios Docker reales. Cubren
  rutas sin sesión, registro cerrado, origen no autorizado, protección del propio
  administrador, validación y duplicados, permisos de usuario, intentos de escalación,
  cambios de rol, cuenta desactivada, revocación, auditoría, login/logout, cookies
  HttpOnly, sesión al recargar, contraseña anterior invalidada y cierre de otras
  sesiones al cambiarla, además de diagnóstico y vista móvil.
- Capturas de login, administración de usuarios y vista móvil inspeccionadas.
- Migración aplicada y bootstrap repetido sin modificar contraseñas existentes.
- Verificador real correcto: SQL, idempotencia de migraciones, liveness 200/readiness
  503 durante caída, recuperación y persistencia de marcador e historial al recrear
  PostgreSQL, más proxy React → Workers → PostgreSQL.
- Lint, tipos, ocho pruebas unitarias y build correctos en Windows y dentro de la
  imagen Linux Docker. Sin incompatibilidades de dependencias
  pares según `pnpm peers check`.

Las pruebas crean cuentas con correos aleatorios `@example.test`, que se desactivan
al finalizar para conservar la auditoría. Se comprobaron un administrador activo y
cuatro cuentas temporales desactivadas tras las dos ejecuciones completas.
Los recuentos de usuarios de prueba aumentan si se vuelve a ejecutar esa suite.

## Problemas resueltos y límites

El adaptador oficial requería Drizzle >=0.45.2: se alineó la dependencia de la API
con 0.45.4 y se comprobó la ausencia de conflictos de peers. Un selector antiguo
de Playwright encontraba tanto logout como el botón de diagnóstico; ahora utiliza
el nombre específico de la acción. Un chequeo de formato inicial detectó dos
archivos y se corrigieron antes de la verificación final.

La tabla de usuarios se ajustó después de inspeccionar su captura móvil para
mostrar las acciones sin depender de desplazamiento horizontal. El bootstrap no
restableció al administrador al repetir la migración. Los avisos del limitador
acerca del contador local compartido son coherentes con la configuración elegida.

No se implementaron envío/verificación de correo, recuperación por email, MFA,
invitaciones, roles comerciales, inventario ni ventas. No hubo cambios en Neon o
Cloudflare, despliegues, commits, push ni publicación de repositorios. Las pruebas
locales no sustituyen una auditoría de seguridad o la validación remota de Fase 3,
incluidos HTTPS, cookies, TLS PostgreSQL y límites CPU del hashing en Workers.

## Estado de los servicios

| Servicio               | Estado observado                                                       |
| ---------------------- | ---------------------------------------------------------------------- |
| React `web`            | En ejecución, healthy, puerto 5173                                     |
| Hono/Better Auth `api` | En ejecución, healthy, puerto 8787                                     |
| PostgreSQL `db`        | En ejecución, healthy, puerto 5432, volumen conservado                 |
| Adminer                | En ejecución, puerto 8080                                              |
| `migrate`              | Terminado con código 0; inicialización posterior omitida correctamente |

## Referencias técnicas

- [Integración Better Auth y Hono](https://better-auth.com/docs/integrations/hono).
- [Adaptador oficial Drizzle](https://better-auth.com/docs/adapters/drizzle).
- [Autenticación por correo y contraseña](https://better-auth.com/docs/authentication/email-password).
- [Sesiones](https://better-auth.com/docs/concepts/session-management).
- [Hooks y esquema de base de datos](https://better-auth.com/docs/concepts/database).
- [Limitador de intentos](https://better-auth.com/docs/concepts/rate-limit).
