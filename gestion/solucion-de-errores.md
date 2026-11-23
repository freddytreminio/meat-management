# Solución de errores frecuentes

## Docker no responde

Abre Docker Desktop y espera a que el motor termine de iniciar. Luego ejecuta:

```powershell
docker info
docker compose up -d
```

Si Docker Desktop está en modo de contenedores Windows, el proyecto necesita
el motor de contenedores Linux.

## Adminer no aparece en Docker Desktop

En **Containers**, limpia el filtro de búsqueda y despliega el grupo
`meat-management`. El panel es el servicio `adminer`, normalmente mostrado como
`adminer-1` o `meat-management-adminer-1`.

Para comprobarlo e iniciarlo:

```powershell
docker compose ps -a adminer
docker compose up -d adminer
```

Adminer ya forma parte de `compose.yaml`. No hace falta crear un contenedor
independiente con `docker run`.

## No abre localhost en el navegador

Usa la dirección del servicio que necesitas:

- React: http://localhost:5173
- Adminer: http://localhost:8080
- API: http://localhost:8787/health

El puerto 5432 es una conexión PostgreSQL, no una página web. No se abre como
una dirección de navegador. Si el servicio no responde, revisa:

```powershell
docker compose ps -a
docker compose logs --tail 50 adminer
```

Sustituye `adminer` por `web`, `api` o `db` según el servicio que falle.

## Adminer muestra Connection refused

En el formulario selecciona **PostgreSQL** y usa **db** como servidor. Dentro de
Adminer, `localhost` apuntaría al propio contenedor del panel, no a PostgreSQL.
El puerto de PostgreSQL es **5432**. Los demás campos están en
[credenciales locales](credenciales.local.txt).

Comprueba que PostgreSQL esté iniciado:

```powershell
docker compose up -d db adminer
docker compose ps db adminer
```

Espera a que `db` muestre `healthy` y vuelve a iniciar sesión en Adminer.

## Adminer muestra password authentication failed

La base está respondiendo, pero no acepta la combinación de usuario y contraseña.
Reescribe los valores de [credenciales locales](credenciales.local.txt) sin
espacios ni tabulaciones. Adminer no tiene una contraseña propia: utiliza la de
PostgreSQL. Si ya cambiaste las credenciales reales, usa esos valores nuevos.

No borres el volumen para intentar recuperar el acceso. Cambiar un valor de
`.env` o de una nota no actualiza la contraseña de un PostgreSQL ya inicializado;
el cambio debe hacerse de forma controlada conservando los datos.

## El nombre de la base contiene espacios o %09

`%09` representa una tabulación que pudo copiarse al formulario. Borra el contenido
del campo y escribe `meat_management` sin espacios ni tabulaciones.
Puedes volver a [este enlace limpio](http://localhost:8080/?pgsql=db&username=meat_local&db=meat_management).

## migrate aparece detenido

Es normal si terminó con código **0**. Aplica las migraciones y termina.
Si el código de salida es distinto de cero:

```powershell
docker compose logs --tail 50 migrate
docker compose run --rm migrate
```

## React muestra PostgreSQL sin conexión

Comprueba http://localhost:8787/health/db. Un error 503 significa que la base,
su configuración o su migración todavía no están listas.

```powershell
docker compose ps -a
docker compose logs --tail 50 db migrate api
docker compose up --build -d
```

No borres la fila `id = 1` de `infrastructure_probe`: es el marcador que utiliza
la comprobación de preparación del entorno.

## Un puerto ya está ocupado

Puertos del proyecto: **5173**, **8787**, **5432** y **8080**. Para consultar qué
proceso los está usando en Windows:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173,8787,5432,8080 -ErrorAction SilentlyContinue
```

Revisa el proceso o contenedor en conflicto antes de detenerlo. Si decides cambiar
un puerto publicado en `compose.yaml`, actualiza también los enlaces y las pruebas
que utilizan ese puerto.
