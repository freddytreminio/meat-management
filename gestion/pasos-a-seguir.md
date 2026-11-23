# Pasos de trabajo y mantenimiento

## Al comenzar el día

1. Inicia Docker Desktop.
2. Abre PowerShell en la raíz del proyecto.
3. Ejecuta `docker compose up -d`.
4. Ejecuta `docker compose ps -a` para revisar el estado.
5. Abre http://localhost:5173, inicia sesión y pulsa **Comprobar conexión** en Resumen.

React debe mostrar Hono y PostgreSQL como **Operativo**. La primera vez, o si
necesitas reconstruir las imágenes, usa `docker compose up --build -d`.

## Ver los datos en Adminer

1. Abre [el formulario de PostgreSQL](http://localhost:8080/?pgsql=db&username=meat_local&db=meat_management).
2. Revisa los campos con [las credenciales locales](credenciales.local.txt) e inicia sesión.
3. Selecciona el esquema `public`.
4. Abre la tabla `infrastructure_probe`.
5. Pulsa **Seleccionar datos** para ver el marcador técnico `id = 1`.

La base es PostgreSQL; Adminer es únicamente el panel para verla. Cerrar Adminer
no borra los datos. La tabla técnica comprueba la infraestructura. Las tablas
`auth_*` corresponden a autenticación y `audit_log` conserva la actividad.
No hay tablas de productos, inventario ni ventas.

Puedes ejecutar esta consulta de lectura en la opción **Comando SQL**:

```sql
SELECT id, created_at FROM public.infrastructure_probe;
```

Para consultar el historial de migraciones:

```sql
SELECT * FROM drizzle.__drizzle_migrations;
```

Adminer sirve para consultar los datos. Los cambios de estructura del proyecto
deben realizarse con Drizzle y migraciones versionadas, evitando diferencias
entre el esquema del código y la base de datos.

## Mientras desarrollas

Para sincronizar cambios de las fuentes con los contenedores:

```powershell
docker compose up --watch
```

Déjalo abierto mientras trabajas. Al cambiar dependencias o configuración,
reconstruye con `docker compose up --build -d`.

Si usas las herramientas desde Windows, instala las dependencias con pnpm:

```powershell
pnpm install --frozen-lockfile
```

## Antes de dar un cambio por terminado

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Para probar el recorrido de navegador, con Docker levantado:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

Para verificar migraciones, recuperación y persistencia:

```powershell
pnpm verify:local
```

Este último comando detiene, vuelve a iniciar y recrea el contenedor PostgreSQL
del proyecto. Durante la prueba la base queda temporalmente indisponible. Conserva
el volumen y comprueba que los datos sigan allí; úsalo cuando puedas interrumpir
las pruebas locales.

## Al terminar el día

```powershell
docker compose stop
```

Los datos permanecen en el volumen para la siguiente sesión.

## Próximos pasos del proyecto

La Fase 1 local está verificada; el resultado está en el
[informe](../docs/PHASE_1_REPORT.md). Para continuar, utiliza el
[PROJECT_PLAN.md](../PROJECT_PLAN.md) como referencia:

1. Probar el panel de Fase 2 siguiendo [estas instrucciones](fase-2.md).
2. Revisar usuarios, roles y actividad antes de preparar la siguiente fase.
3. En Fase 3, configurar y validar Neon/Cloudflare con autorización para los cambios cloud.
4. Levantar requisitos del cliente antes de crear módulos de productos, inventario o ventas.

Estas notas no autorizan por sí solas iniciar otra fase ni publicar el repositorio.
