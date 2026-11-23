# Notas de gestión del proyecto

Esta carpeta reúne los accesos, comandos y pasos para manejar Meat Management
en tu computadora. Abre las notas desde el explorador de archivos o desde el IDE.
En VS Code puedes usar **Ctrl + Shift + V** para ver una nota Markdown con formato.

## Por dónde empezar

1. Abre Docker Desktop y espera a que termine de iniciar.
2. Sigue [Levantar y detener los servicios](levantamiento.md).
3. Consulta [las credenciales locales](credenciales.local.txt) para entrar a Adminer.
4. Usa [Pasos de trabajo y mantenimiento](pasos-a-seguir.md) para trabajar a diario.
5. Si algo falla, revisa [Solución de errores](solucion-de-errores.md).
6. Sigue [Uso de la administración](fase-2.md) para iniciar sesión y gestionar usuarios.

## Accesos rápidos

| Herramienta         | Dirección                       | Para qué sirve                        |
| ------------------- | ------------------------------- | ------------------------------------- |
| Aplicación React    | http://localhost:5173           | Ver la pantalla del proyecto          |
| Adminer             | http://localhost:8080           | Ver las tablas y consultar PostgreSQL |
| API Hono            | http://localhost:8787/health    | Comprobar si la API responde          |
| API y base de datos | http://localhost:8787/health/db | Comprobar conexión SQL y migración    |

En Docker Desktop, entra en **Containers** y despliega el grupo
**meat-management**. Allí encontrarás `web-1`, `api-1`, `db-1`, `adminer-1` y
`migrate-1`. El servicio `migrate-1` termina con código 0 después de aplicar las
migraciones; ese estado es normal.

Las credenciales de esta carpeta se guardan en `credenciales.local.txt`, excluido
de Git y del contexto de construcción Docker. El archivo es una nota de consulta:
editarlo no cambia las contraseñas reales. Guarda aquí únicamente los accesos
locales; los secretos cloud deben mantenerse en su gestor correspondiente.

La documentación técnica completa está en [README del proyecto](../README.md),
[plan maestro](../PROJECT_PLAN.md) e [informe de Fase 1](../docs/PHASE_1_REPORT.md).
