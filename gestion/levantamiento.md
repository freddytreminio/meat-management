# Levantar y detener los servicios

## Preparar la terminal

Abre Docker Desktop y espera a que el motor esté listo. Después abre PowerShell
en la carpeta del proyecto. Si estás en otra ubicación, ejecuta:

```powershell
Set-Location 'C:\Users\fredt\OneDrive\Escritorio\ventas'
```

Todos los comandos siguientes se ejecutan desde esa carpeta. Necesitas conexión
a internet la primera vez para descargar imágenes y dependencias.

## Levantar todo

La primera vez prepara el secreto de sesión y el acceso del administrador:

```powershell
node scripts/setup-local.mjs
```

Conserva los valores ya configurados y guarda el acceso inicial en
`gestion/credenciales.local.txt`. El `.env` resultante es privado.

```powershell
docker compose up --build -d
docker compose ps -a
```

Esto levanta PostgreSQL, Adminer, Hono y React. El proceso `migrate` aplica las
migraciones, crea el primer administrador si no hay usuarios y después termina.
No necesitas ejecutar
manualmente cada servicio si utilizas este comando.

Abre http://localhost:5173/login para entrar a la aplicación y http://localhost:8080
para Adminer. Son accesos distintos: la cuenta de la aplicación no es `meat_local`.
Los servicios pueden tardar unos segundos en pasar de `starting` a `healthy`.
Adminer figura como `Up`; no tiene un chequeo de salud configurado.

## Levantar servicios por separado

Los nombres que debes usar en los comandos son los servicios de Compose, no los
nombres completos de los contenedores que muestra Docker Desktop.

| Necesidad                   | Comando                           |
| --------------------------- | --------------------------------- |
| Solo PostgreSQL             | `docker compose up -d db`         |
| Panel Adminer y PostgreSQL  | `docker compose up -d adminer`    |
| Aplicar migraciones         | `docker compose run --rm migrate` |
| API Hono y sus dependencias | `docker compose up -d api`        |
| React y sus dependencias    | `docker compose up -d web`        |

Si modificaste código o dependencias, usa `docker compose up --build -d` para
reconstruir las imágenes. Los comandos de la tabla usan las imágenes existentes.
El comando de Adminer también inicia PostgreSQL si aún no está levantado.

## Detener y volver a levantar

Para apagar todos los servicios conservando los datos:

```powershell
docker compose stop
```

Para volver a levantarlos con su configuración y dependencias:

```powershell
docker compose up -d
```

Para apagar únicamente el panel de base de datos:

```powershell
docker compose stop adminer
```

Para reiniciar un servicio, por ejemplo Adminer:

```powershell
docker compose restart adminer
```

También puedes iniciar o detener el grupo `meat-management` desde Docker Desktop.
Los comandos Compose desde esta carpeta son la opción preferida cuando cambias
configuración o necesitas volver a aplicar migraciones.

## Ver qué está pasando

```powershell
docker compose ps -a
docker compose logs --tail 50 db
docker compose logs --tail 50 migrate
docker compose logs --tail 50 api
docker compose logs --tail 50 web
docker compose logs --tail 50 adminer
```

Para seguir los registros de la API en tiempo real:

```powershell
docker compose logs -f api
```

Presiona **Ctrl + C** para dejar de ver los registros. Esto no detiene la API.

Los datos viven en el volumen `meat-management_postgres_data`. No uses opciones
que eliminen volúmenes, como `docker compose down -v`, para apagar el proyecto.
