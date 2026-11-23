# Arquitectura local · Fase 1

## Plan técnico ejecutado

1. Establecer el monorepo pnpm y TypeScript estricto.
2. Separar React, Hono y persistencia Drizzle sin entidades de negocio.
3. Encadenar PostgreSQL saludable → migración exitosa → API lista → React.
4. Validar SQL, migraciones, persistencia, fallos y recorrido real de navegador.
5. Documentar instalación y límites de la verificación.

```text
Navegador → localhost:5173 (React/Vite)
              /api/* → api:8787 (Hono sobre workerd)
                          → db:5432 (pg + Drizzle → PostgreSQL)
              migrate ────┘
                          postgres_data (volumen persistente)
```

## Decisiones

- Un Dockerfile de desarrollo común evita duplicación en el monorepo. Tres
  servicios permanentes y un proceso de migración de una sola ejecución.
- Wrangler `dev --local` ejecuta Hono en workerd, el mismo motor de Workers,
  sin usar servicios remotos. La fecha de compatibilidad es 2026-11-23.
- `pg` con Drizzle `node-postgres` permite consultar PostgreSQL local mediante TCP.
  Las APIs Node compatibles están habilitadas por defecto para esta fecha de
  Workers. Se crea y cierra una conexión por petición, sin sockets globales entre
  invocaciones. No se añade Hyperdrive ni se requiere una cuenta cloud.
- El chequeo consulta el marcador migrado: una base accesible pero sin migración
  también se considera no preparada. La liveness sigue independiente de PostgreSQL.
- React y la API comparten origen a través del proxy Vite durante desarrollo.
  La configuración de origen de producción se decidirá al desplegar en Fase 3.
- No se crean paquetes compartidos ni directorios vacíos sin consumidores.
  No se incorporan dependencias funcionales que no se usan en esta fase.
- Las imágenes contienen herramientas de desarrollo y no son imágenes de
  producción. El build React produce recursos estáticos y el API produce un bundle
  Workers; Docker no es requisito de producción.

## Compatibilidad y límites

La documentación oficial describe [Hono sobre Workers](https://hono.dev/docs/getting-started/cloudflare-workers),
[conexiones PostgreSQL desde Workers](https://developers.cloudflare.com/workers/tutorials/postgres/)
y el [soporte Node habilitado por fecha](https://developers.cloudflare.com/changelog/post/2026-08-04-nodejs-compat-default/).
Drizzle proporciona el [adaptador node-postgres](https://orm.drizzle.team/docs/get-started-postgresql).

La comprobación local y el bundle no equivalen a una conexión remota validada con
Neon: TLS, credenciales, límites y configuración del proveedor requieren validación
posterior autorizada. No se consultó ni modificó el proyecto Neon existente.
