# Publicar el piloto en Cloudflare y Neon

## Estado y orden

El usuario publicó React en https://meat-management.pages.dev y confirmó desde su
terminal que las migraciones y la creación del administrador terminaron en Neon.
La contraseña de esa cuenta es la elegida durante ese proceso; no es la clave
del administrador de Docker. La conexión Neon se conserva de forma privada.

Los archivos de esta preparación están probados localmente. El agente no ejecutó
commits, push, despliegues, escritura de secretos ni consultas contra Neon.
La verificación remota de API, cookies y login queda pendiente de publicar.

Orden: publicar Worker → configurar sus secretos → subir estos cambios a main →
esperar el redeploy de Pages → comprobar el piloto completo.

## Terminal del proyecto

```powershell
cd "C:\Users\fredt\OneDrive\Escritorio\ventas"
```

Wrangler ya fue autorizado por el usuario. Si trabajas en otra terminal, puedes
comprobar la cuenta con `pnpm.cmd --filter @meat/api exec wrangler whoami`.

## Publicar la API

```powershell
pnpm.cmd --filter @meat/api exec wrangler deploy --env production
```

Publica `meat-management-api-production`. Su URL workers.dev y los enlaces preview
están deshabilitados: Pages accede al Worker mediante un Service binding privado.
Por eso no necesitas que aparezca una dirección pública propia de la API.
La configuración fija `AUTH_ORIGIN=https://meat-management.pages.dev` y exige HTTPS.

Si Cloudflare solicita elegir un plan o habilitar facturación, revisa esa decisión
antes de aceptarla. No se presupone que todos los límites del piloto estén validados.

## Guardar la conexión Neon en el Worker

```powershell
pnpm.cmd --filter @meat/api exec wrangler secret put DATABASE_URL --env production
```

Cuando Wrangler solicite el valor, pega la conexión Neon vigente, no dentro del
comando. Este secreto pertenece a la API; no lo agregues a las variables de React
ni al repositorio. La conexión directa ya comprobada con las migraciones puede
utilizarse para la primera validación. El pooling se revisará con la concurrencia
del piloto; no modifiques a mano el hostname que entrega Neon.

Si prefieres reutilizar la variable segura que ya capturaste en esa misma sesión:

```powershell
[System.Net.NetworkCredential]::new("", $conexionNeon).Password | pnpm.cmd --filter @meat/api exec wrangler secret put DATABASE_URL --env production
```

Utiliza solo una de las dos opciones. Cada comando crea una nueva versión con el
secreto configurado y lo aplica al Worker. No imprime el contenido del secreto.

## Generar y guardar el secreto de sesiones

Ejecuta esta línea completa una sola vez para la configuración inicial:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('hex'))" | pnpm.cmd --filter @meat/api exec wrangler secret put BETTER_AUTH_SECRET --env production
```

Genera una clave nueva y la envía directamente a Wrangler, sin mostrarla en la
terminal ni reutilizar la clave local. No hace falta repetirla en cada actualización:
rotarla invalida las sesiones firmadas con la clave anterior.

Para comprobar únicamente los nombres de secretos configurados:

```powershell
pnpm.cmd --filter @meat/api exec wrangler secret list --env production
```

Deben aparecer `DATABASE_URL` y `BETTER_AUTH_SECRET`. La lista no demuestra todavía
que el valor de la conexión sea correcto: eso se valida con la consulta SQL remota.

## Subir la conexión Pages API a GitHub

El frontend necesita los archivos nuevos de esta preparación. Verifica que estás
en `main` y revisa el diff; el agente dejó los cambios sin commit:

```powershell
git branch --show-current
git status
git diff
git add .
git status
git commit -m "Preparar API y conexion Pages para el piloto"
git push origin main
```

No deben incluirse `.env`, `.dev.vars` ni `gestion/credenciales.local.txt`. Las ramas
`desarrollo-priv` y `desarrollo-public` siguen vacías y no se utilizan para publicar.

Cloudflare Pages volverá a compilar desde main. Conserva su configuración:

| Campo              | Valor                           |
| ------------------ | ------------------------------- |
| Rama de producción | main                            |
| Raíz               | Raíz del repositorio            |
| Build command      | `pnpm --filter @meat/web build` |
| Output             | `apps/web/dist`                 |
| NODE_VERSION       | `22.23.5`                       |
| PNPM_VERSION       | `11.25.0`                       |

`wrangler.jsonc`, en la raíz, declara el Service binding `API` al Worker de
producción. El Worker debe existir en la misma cuenta de Cloudflare antes de este
redeploy. Los previews no tienen ese binding para evitar usar Neon de producción.

## Comprobar la aplicación publicada

Espera que Pages termine con Success. Después abre:

1. https://meat-management.pages.dev/api/health — estado de Hono.
2. https://meat-management.pages.dev/api/health/db — consulta real a Neon y marcador de migración.
3. https://meat-management.pages.dev/login — inicia sesión con `admin@meat.local`
   y la contraseña creada en Neon. No se copian las cuentas de Docker.

Comprueba Resumen, Usuarios, Actividad, cierre de sesión y entrada desde un celular.
Las cookies deberían ser HttpOnly, Secure y SameSite=Lax bajo el mismo dominio.

Si `/api/health` devuelve HTML, todavía estás viendo el despliegue de Pages que no
incluye Functions. Si devuelve 503 por API no configurada, revisa el binding y si
abriste un preview en lugar del dominio de producción. Si `/api/health/db` devuelve
503, revisa la conexión y migraciones Neon. Un 401 al consultar `/api/me` sin sesión
es el resultado esperado.

Para consultar los registros del Worker desde tu terminal:

```powershell
pnpm.cmd --filter @meat/api exec wrangler tail --env production
```

## Actualizar después el piloto

Los cambios de React y Pages Functions se publican al subir a main. Los cambios de
Hono requieren además volver a ejecutar `wrangler deploy --env production` desde
el paquete API. Los cambios de esquema requieren nuevas migraciones controladas
contra Neon antes de publicar código que dependa de ellas.

No reemplaces la conexión local de Docker por Neon. Mantén credenciales, datos y
sesiones independientes. Esta preparación no incluye automatización CI/CD de la
API, respaldos/restauración ni verificación de límites de CPU del hashing en la
plataforma remota; son verificaciones pendientes de Fase 3.

## Comprobaciones locales realizadas

`pnpm lint`, `pnpm typecheck`, dieciséis pruebas unitarias, `pnpm build` y
`pnpm check:deploy` pasaron. Este último genera un bundle Worker con configuración
production mediante `--dry-run` y compila Pages Functions sin publicar.
Las pruebas verifican proxy de métodos/cookies/origen, rutas de diagnóstico,
respuestas ante fallo del servicio, ausencia de binding y orígenes HTTPS estrictos.

Referencias: [Service bindings](https://developers.cloudflare.com/pages/functions/bindings/)
y [configuración Pages](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).
