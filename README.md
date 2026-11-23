# Meat Management

Infraestructura, autenticación y administración local de las Fases 1 y 2.
Monorepo TypeScript estricto con React/Vite,
Hono ejecutado en el runtime local de Cloudflare Workers y PostgreSQL/Drizzle.
El alcance aprobado está en [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Arranque desde cero

Requisitos: Docker Desktop con contenedores Linux y Docker Compose v2 o posterior.
Para preparar los accesos locales: Node.js >=22.12. Las herramientas del host
utilizan pnpm 11.25.0.
La primera construcción necesita acceso a Docker Hub y al registro npm.

Desde esta carpeta (`ventas` es la raíz local del proyecto `meat-management`):

```sh
node scripts/setup-local.mjs
docker compose up --build -d
docker compose ps -a
```

El primer comando crea `.env` con un secreto de autenticación y una contraseña
aleatoria; no imprime secretos ni reemplaza valores ya configurados. El acceso
inicial está en `gestion/credenciales.local.txt` (archivo privado ignorado).
Abre http://localhost:5173/login e ingresa como `admin@meat.local` con esa contraseña.

PostgreSQL espera hasta estar listo, el servicio temporal `migrate` aplica las
migraciones, crea el primer administrador únicamente si no hay usuarios y
termina con código 0, la API comprueba la tabla técnica y después arranca React.
`migrate` terminado correctamente es el estado esperado, no un servicio fallido.

| Servicio       | Dirección                       | Función                                            |
| -------------- | ------------------------------- | -------------------------------------------------- |
| React          | http://localhost:5173           | Pantalla de diagnóstico                            |
| Hono           | http://localhost:8787/health    | Liveness sin conexión SQL                          |
| Hono + Drizzle | http://localhost:8787/health/db | Readiness con consulta SQL y marcador de migración |
| PostgreSQL     | localhost:5432                  | Base local con volumen persistente                 |

Los puertos están publicados únicamente en `127.0.0.1`. El navegador consulta
`/api/health` y `/api/health/db` en Vite; su proxy conecta con `api:8787` en Docker.
No hay URLs internas de Docker en el JavaScript del navegador.

## Configuración

### Panel de base de datos

Adminer forma parte del grupo `meat-management` en Docker Desktop, como servicio
`adminer`. Abre http://localhost:8080 y selecciona PostgreSQL, servidor `db`, usuario
`meat_local`, contraseña `meat_local_dev_only` y base `meat_management` (o tus
valores personalizados). Este panel permite consultar la base PostgreSQL local.

Para levantar únicamente el panel con PostgreSQL ya iniciado:

```sh
docker compose up -d adminer
```

### Variables de entorno

`node scripts/setup-local.mjs` prepara `.env` a partir de `.env.example`.
Para personalizar los valores, edita `.env` antes del primer arranque.
No introducir credenciales de Neon en ese archivo durante esta fase.

| Variable            | Uso                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `POSTGRES_USER`     | Usuario PostgreSQL local; predeterminado `meat_local`                                    |
| `POSTGRES_PASSWORD` | Clave local de desarrollo, independiente de producción                                   |
| `POSTGRES_DB`       | Base local; predeterminada `meat_management`                                             |
| `DATABASE_URL`      | Conexión para herramientas del host; Compose construye su propia URL usando el host `db` |
| `API_PROXY_TARGET`  | Destino del proxy Vite; Compose usa `http://api:8787`                                    |

Si se cambian usuario/clave/base después de inicializar el volumen, PostgreSQL no
actualiza las credenciales existentes automáticamente. Las credenciales utilizadas
en URLs deben codificar los caracteres reservados. Usar valores alfanuméricos para
las credenciales de este entorno de desarrollo simplifica la configuración.
`.env` y `.dev.vars` están ignorados por Git y excluidos del contexto Docker.

## Desarrollo

### Administración de accesos

El administrador puede crear usuarios, editar nombres y roles, desactivar/reactivar
cuentas, cerrar sus sesiones y consultar la actividad. El rol `user` permite acceder
al diagnóstico y a su cuenta. Cada operación se autoriza en el backend.
No existe registro público. Desde **Mi cuenta** se cambia la contraseña y se cierran
las otras sesiones. No se implementó recuperación por correo ni envío de emails.

La configuración usa `BETTER_AUTH_SECRET` para firmar las cookies,
`AUTH_ORIGIN` para el origen del frontend (`http://localhost:5173`) y
`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` para la primera cuenta.
Cambiar esos últimos valores no cambia la contraseña de una cuenta existente.

Las cookies son HttpOnly y SameSite=Lax, con Secure al configurar HTTPS. Las
sesiones duran hasta ocho horas, con comprobación en PostgreSQL y sin caché de
permisos en cookies. Las operaciones mutables requieren un Origin autorizado.
En local el límite de login es compartido por ruta: 20 solicitudes por minuto.
La configuración de IP confiable y HTTPS se validará al desplegar en Fase 3.

Consulta [el informe de Fase 2](docs/PHASE_2_REPORT.md) y
[las instrucciones de uso](gestion/fase-2.md).

### Sincronización de fuentes

```sh
docker compose up --watch
```

Compose Watch sincroniza fuentes React, Hono y del adaptador DB; Vite/Wrangler
recargan los cambios. Después de cambiar dependencias, configuración o migraciones,
reconstruir con `docker compose up --build -d`. El Dockerfile común instala las
dependencias del lockfile dentro de Linux; no copia `node_modules` de Windows.

Para trabajar con herramientas del host:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm build` genera `apps/web/dist` y el bundle Workers en `apps/api/dist` mediante
`wrangler deploy --dry-run`: no publica recursos ni requiere cuenta de Cloudflare.
El paquete DB comprueba tipos; los consumidores compilan sus fuentes TypeScript.

También se pueden ejecutar los checks en la imagen de desarrollo:

```sh
docker compose run --rm --no-deps web pnpm lint
docker compose run --rm --no-deps web pnpm typecheck
docker compose run --rm --no-deps web pnpm test
docker compose run --rm --no-deps web pnpm build
```

Pruebas reales de navegador, con Compose levantado:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
pnpm verify:local
```

Playwright verifica la conexión React → proxy Vite → Hono/Workers → PostgreSQL,
login/logout, cookies, permisos, cambios de rol, revocación, contraseñas, auditoría,
actualización manual y pantalla móvil. Lee el acceso inicial de `.env`; si cambiaste
la contraseña del administrador, exporta `TEST_ADMIN_PASSWORD` para las pruebas.
Las cuentas de prueba quedan desactivadas, con su historial de auditoría.
`verify:local` comprueba SQL, repetibilidad de migraciones, respuesta ante una caída
y persistencia. Detiene, arranca y recrea únicamente el contenedor PostgreSQL de
este proyecto; al terminar lo deja funcionando con el mismo volumen.

## Base de datos y migraciones

`infrastructure_probe` conserva el marcador técnico `id=1` de Fase 1. La migración
de Fase 2 añade `auth_user`, `auth_account`, `auth_session`, `auth_verification`,
`auth_rate_limit` y `audit_log`. Las contraseñas se guardan como hashes mediante
Better Auth. No hay productos, inventario ni ventas. Drizzle conserva su historial
en el esquema `drizzle`; la migración inicial no se modificó.

```sh
pnpm db:generate
docker compose run --rm migrate
docker compose exec db psql -U meat_local -d meat_management -c "SELECT * FROM infrastructure_probe;"
docker compose exec db psql -U meat_local -d meat_management -c "SELECT * FROM drizzle.__drizzle_migrations;"
```

Generar una migración después de modificar el esquema y revisar el SQL antes de
aplicarlo. No editar migraciones ya aplicadas. El migrador utiliza una conexión
propia y se cierra al terminar. Volver a ejecutarlo no repite migraciones aplicadas.
Para ejecutar `pnpm db:migrate` en el host, exportar `DATABASE_URL` en la sesión;
el comando no carga `.env` automáticamente.

## Mantenimiento y diagnóstico

```sh
docker compose logs --tail 100 db migrate api web
docker compose restart db
docker compose ps -a
docker compose stop
docker compose start
```

`postgres_data` conserva el estado al reiniciar o recrear contenedores.
Para comprobarlo, comparar `created_at` del marcador y el historial Drizzle antes
y después de reiniciar/recrear. No usar `docker compose down -v` para mantenimiento:
eliminaría el volumen de datos. Si un puerto está ocupado, detener el servicio
en conflicto o ajustar el puerto publicado y la configuración de las pruebas.

`/health` responde 200 mientras Hono funciona. `/health/db` devuelve 503 si falla
PostgreSQL, falta configuración o no existe el marcador; nunca incluye credenciales
ni errores SQL internos. Tras recuperar PostgreSQL, nuevas peticiones abren una
conexión nueva. Estos endpoints de diagnóstico son públicos solo en el entorno local.

## Alcance y decisiones

La preparación de producción está en [Publicar el piloto](gestion/despliegue-piloto.md).
`pnpm check:deploy` valida el bundle de producción y Pages Functions sin publicar.
La configuración raíz `wrangler.jsonc` corresponde a Pages; la del paquete API
contiene un entorno `production` separado. El proxy `/api/*` mantiene las cookies
en el dominio de Pages mediante un Service binding. Los previews no acceden al
Worker de producción. Los pasos cloud se ejecutan manualmente por el usuario.

Ver [arquitectura local](docs/architecture/local.md) e
[informe de verificación](docs/PHASE_1_REPORT.md).
La Fase 2 incorpora Better Auth, React Router, TanStack Query, React Hook Form,
Zod y Lucide. Se conserva el CSS propio existente. No se implementaron módulos
comerciales. El usuario publicó el repositorio en GitHub y React en Cloudflare
Pages y confirmó migraciones y administrador en Neon. El despliegue de la API y
la verificación completa del piloto siguen pendientes. CI/CD de API y recuperación
de datos también quedan pendientes de Fase 3.
