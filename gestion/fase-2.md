# Uso de la autenticación y administración

## Entrar a la aplicación

1. Levanta Docker con `docker compose up -d` desde la raíz.
2. Abre http://localhost:5173/login.
3. Escribe el correo del administrador local, inicialmente `admin@meat.local`.
4. Copia la contraseña de la sección **ADMINISTRADOR DE LA APLICACIÓN** en
   [credenciales.local.txt](credenciales.local.txt).

La contraseña se generó automáticamente; no es `meat_local_dev_only`, que sirve
para PostgreSQL y Adminer. Si cambiaste la contraseña de la aplicación, utiliza la
nueva. La nota conserva la contraseña inicial y no cambia automáticamente.

## Pantallas disponibles

| Pantalla  | Para qué sirve                              | Acceso                        |
| --------- | ------------------------------------------- | ----------------------------- |
| Resumen   | Comprobar la conexión de los servicios      | Todos los usuarios con sesión |
| Usuarios  | Crear cuentas y administrar accesos         | Administrador                 |
| Actividad | Consultar el historial de cambios y accesos | Administrador                 |
| Mi cuenta | Ver el rol y cambiar la contraseña          | Todos los usuarios con sesión |

## Crear una cuenta

1. Entra en **Usuarios** y pulsa **Crear usuario**.
2. Escribe nombre, correo y una contraseña inicial de al menos 12 caracteres.
3. Selecciona **Usuario** o **Administrador**.
4. Pulsa **Guardar usuario**.
5. Comparte el acceso con la persona correspondiente. Podrá cambiar su contraseña
   desde **Mi cuenta**. El sistema no envía correos en esta fase.

El rol Usuario puede consultar el resumen y su cuenta. El rol Administrador puede
gestionar otras cuentas y consultar auditoría. Todavía no hay permisos comerciales.
No hay registro público: las cuentas se crean desde el panel.

## Editar o desactivar una cuenta

Pulsa **Editar** en su fila, cambia el nombre o rol y guarda. Para impedir que
ingrese, marca **Desactivar acceso**. Para reactivarla, desmarca esa opción.
Cambiar de rol o desactivar cierra las sesiones de esa cuenta inmediatamente.
La cuenta y su historial se conservan; no se borran usuarios desde el panel.

No puedes desactivarte ni quitarte tu propio rol de administrador. El backend
también protege la existencia de al menos un administrador activo.

## Cerrar sesiones

**Cerrar sesiones**, en Usuarios, termina todos los accesos de esa persona.
Si lo haces en tu propia fila, tendrás que volver a iniciar sesión.
El botón con el icono de salida, arriba a la derecha, cierra solo tu sesión actual.
Las sesiones vencen por inactividad según la duración configurada, de ocho horas,
y se verifican contra PostgreSQL.

## Cambiar la contraseña

En **Mi cuenta**, escribe tu contraseña actual, la nueva y su confirmación.
Pulsa **Actualizar contraseña**. Las otras sesiones se cierran y la contraseña
anterior deja de funcionar. La cuenta inicial no se restablece al reiniciar Docker.

## Entender Actividad

Muestra inicios y cierres de sesión, intentos de login fallidos, creación y edición
de cuentas, cambios de rol, activación/desactivación y revocaciones administrativas.
Guarda referencias de usuario y fechas; no guarda las contraseñas ni los tokens de
sesión. Los intentos fallidos no se atribuyen a una cuenta confirmada.

Las cuentas con nombres **Prueba de permisos** o **Prueba de contraseña** proceden
de las pruebas automatizadas. Se dejan desactivadas al terminar para conservar
el historial que permite revisar la validación.

## Si no puedes entrar

- Confirma que usas la cuenta de la aplicación y no la de PostgreSQL.
- Copia los valores sin espacios ni tabulaciones.
- Si tu cuenta está desactivada, otro administrador debe reactivarla.
- Después de demasiados intentos, espera un minuto antes de probar de nuevo.
- Si cambiaste tu contraseña, la nota con el acceso inicial ya no será válida.

No hay recuperación automática por correo. No borres el volumen de PostgreSQL
para recuperar un acceso. Si todos los administradores pierden su contraseña,
solicita una recuperación local controlada conservando los datos.

## Preparación en otra computadora

```powershell
node scripts/setup-local.mjs
docker compose up --build -d
```

El primer comando genera secretos nuevos en esa computadora. No copies las claves
de Neon a estos archivos: la conexión cloud se preparará en Fase 3.
