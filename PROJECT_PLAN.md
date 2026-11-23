# PROJECT_PLAN.md
# Meat Management — Plan maestro de arquitectura y desarrollo

**Versión:** 1.1  
**Fecha:** 23 de noviembre de 2026  
**Estado:** Fases 1 y 2 verificadas en desarrollo local  
**Nombre del proyecto:** `meat-management`

---

## 1. Descripción del proyecto

Meat Management será un sistema web de gestión de inventario y ventas de productos cárnicos.

Su objetivo es permitir que un negocio gestione sus operaciones mediante una aplicación moderna, accesible desde computadoras, tablets y dispositivos móviles.

El sistema debe diseñarse con una arquitectura profesional, escalable, segura, mantenible y de bajo costo.

**Importante:** todavía no contamos con los requisitos funcionales específicos del cliente.

Por esta razón, inicialmente construiremos únicamente la infraestructura y los componentes técnicos necesarios para desarrollar las funcionalidades comerciales posteriormente.

No se deben inventar reglas de negocio.

## 2. Objetivos principales

1. Construir una plataforma web con tecnologías modernas.
2. Mantener el costo inicial de infraestructura en $0 mensuales, respetando los límites de los servicios gratuitos.
3. Utilizar Docker para disponer de un entorno de desarrollo reproducible.
4. Implementar una arquitectura modular y preparada para crecimiento.
5. Gestionar el esquema de la base de datos mediante migraciones.
6. Automatizar pruebas, validaciones y despliegues.
7. Permitir desarrollo asistido por agentes de inteligencia artificial.
8. Publicar el sistema para acceder desde computadoras, tablets y celulares.
9. Mantener independencia de proveedores cuando sea razonablemente posible.
10. Facilitar futuras modificaciones sin reconstruir toda la aplicación.

## 3. Tecnologías seleccionadas

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Lucide React

### Backend
- Hono
- TypeScript
- Zod
- API REST
- Cloudflare Workers como runtime de producción

### Base de datos
- PostgreSQL
- Drizzle ORM
- Drizzle Kit
- Migraciones versionadas

### Autenticación
- Better Auth
- Sesiones seguras
- Usuarios, roles y permisos
- Autorización implementada desde el backend

La autenticación se implementará después de completar la infraestructura inicial.

### Desarrollo y automatización
- Docker
- Docker Compose
- pnpm Workspaces
- Git
- GitHub
- GitHub Actions
- Vitest
- Playwright
- ESLint
- Prettier

### Infraestructura de producción prevista
- Cloudflare Pages: frontend
- Cloudflare Workers: API
- Neon: PostgreSQL
- HTTPS obligatorio
- Variables de entorno y secretos gestionados por servicio

La compatibilidad de estas integraciones deberá verificarse durante la implementación.

## 4. Arquitectura del sistema

Se utilizará un monolito modular organizado como monorepo.

```text
Dispositivo del usuario
        |
        | HTTPS
        v
Frontend React
Cloudflare Pages
        |
        | API REST
        v
Backend Hono
Cloudflare Workers
        |
        | Drizzle ORM
        v
PostgreSQL
Neon
```

### Principios arquitectónicos

- Separación de presentación, aplicación y persistencia.
- Reutilización de contratos compartidos cuando exista una necesidad real.
- Validaciones tanto en frontend como en backend.
- Lógica de negocio independiente de los componentes visuales.
- Estructura modular.
- Migraciones versionadas.
- Código tipado con TypeScript estricto.
- Manejo centralizado de errores.
- Pruebas automatizadas.
- Seguridad desde el diseño.
- Evitar dependencias y abstracciones innecesarias.

No se utilizarán microservicios ni Kubernetes en la etapa inicial.

## 5. Estructura prevista de carpetas

```text
meat-management/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   └── styles/
│   │   └── Dockerfile
│   │
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/
│       │   ├── modules/
│       │   ├── infrastructure/
│       │   └── index.ts
│       ├── wrangler.jsonc
│       └── Dockerfile
│
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   └── index.ts
│   │   ├── drizzle/
│   │   └── drizzle.config.ts
│   │
│   └── shared/
│       └── src/
│
├── infra/
│   └── docker/
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── requirements/
│
├── .github/
│   └── workflows/
│
├── AGENTS.md
├── PROJECT_PLAN.md
├── compose.yaml
├── pnpm-workspace.yaml
├── package.json
├── pnpm-lock.yaml
├── .env.example
├── .gitignore
└── README.md
```

La estructura puede ajustarse por necesidades técnicas justificadas. Evitar crear directorios vacíos o capas innecesarias.

## 6. Entornos del sistema

### Desarrollo local

Se utilizará Docker Compose para ejecutar:

- Frontend React: puerto 5173.
- Backend Hono: puerto 8787.
- PostgreSQL: puerto 5432.

Comando principal esperado:

```bash
docker compose up --build -d
```

Se utilizarán volúmenes para conservar los datos de PostgreSQL.

El backend deberá funcionar con un adaptador de base de datos compatible con desarrollo local y con el entorno de producción previsto.

### Producción

El sistema se desplegará utilizando:

- Cloudflare Pages.
- Cloudflare Workers.
- Neon PostgreSQL.

Docker no será obligatorio en producción.

Las credenciales locales y de producción serán independientes.

No se compartirán bases de datos entre desarrollo y producción.

## 7. Estado actual del proyecto

### Completado

- Definición inicial del objetivo.
- Selección preliminar del stack tecnológico.
- Selección de arquitectura modular.
- Selección del proveedor de base de datos.
- Creación de un proyecto PostgreSQL en Neon.
- Selección de región AWS US East 2 (Ohio).
- Selección del plan Neon Free.
- Monorepo pnpm, React, Hono y PostgreSQL local con Docker Compose.
- Drizzle y migraciones versionadas, con pruebas de SQL y persistencia.
- Adminer incorporado al grupo Docker del proyecto.
- Better Auth con login, logout y sesiones persistidas en PostgreSQL.
- Administración local de usuarios, roles, permisos y auditoría básica.
- Interfaz administrativa responsive y comprobaciones de tipos, pruebas y build.

Resultados de ejecución: `docs/PHASE_1_REPORT.md` y `docs/PHASE_2_REPORT.md`.

### Pendiente de implementar o verificar

- Crear repositorio GitHub.
- Preparar GitHub Actions.
- Crear cuenta o proyecto Cloudflare.
- Desplegar el sistema.

No se debe marcar ningún elemento como completado sin comprobarlo.

## 8. Plan de desarrollo por fases

### Fase 1 — Infraestructura local

**Prioridad: inmediata.**

Objetivos:

1. Crear la estructura del monorepo.
2. Configurar TypeScript.
3. Instalar las librerías principales.
4. Crear frontend React.
5. Crear backend Hono.
6. Crear PostgreSQL en Docker.
7. Configurar Drizzle ORM.
8. Crear migraciones iniciales.
9. Conectar frontend, API y base de datos.
10. Configurar Docker Compose.
11. Crear pruebas iniciales.
12. Verificar funcionamiento local.
13. Comprobar compatibilidad con Cloudflare Workers.

Endpoints iniciales:

```http
GET /health
GET /health/db
```

El segundo endpoint debe consultar realmente la base de datos.

**Resultado esperado:** entorno de desarrollo funcional y reproducible, sin lógica comercial.

### Fase 2 — Autenticación y administración

Objetivos:

- Integrar Better Auth.
- Implementar login.
- Implementar logout.
- Gestionar sesiones.
- Crear administración de usuarios.
- Crear roles y permisos.
- Proteger rutas.
- Agregar auditoría básica.
- Crear una interfaz administrativa responsive.

**Resultado esperado:** plataforma con acceso controlado y administración inicial.

### Fase 3 — Despliegue gratuito

Objetivos:

1. Crear o configurar Cloudflare.
2. Configurar Cloudflare Pages.
3. Configurar Cloudflare Workers.
4. Conectar Hono con Neon.
5. Aplicar migraciones remotas.
6. Configurar variables de entorno seguras.
7. Configurar HTTPS.
8. Configurar CI/CD.
9. Ejecutar pruebas posteriores al despliegue.
10. Definir y probar respaldos y restauración.

**Resultado esperado:** aplicación disponible públicamente para realizar pruebas desde una tablet, sin utilizar todavía datos reales del negocio.

### Fase 4 — Levantamiento de requisitos

Pendiente de reunión con el cliente.

Será necesario determinar:

- Tipos de productos.
- Unidades de medida.
- Métodos de venta.
- Manejo de inventario.
- Precios y descuentos.
- Proveedores.
- Clientes.
- Compras.
- Pérdidas y mermas.
- Facturación y obligaciones aplicables.
- Reportes.
- Roles de empleados.
- Número de sucursales.
- Número de usuarios simultáneos.
- Necesidad de impresión de tickets.
- Necesidad de operación sin internet.

Estas son preguntas pendientes, no funcionalidades aprobadas.

### Fase 5 — Implementación del negocio

Se implementarán únicamente los módulos aprobados por el cliente.

Cada módulo deberá contar con:

- Requisitos documentados.
- Modelo de datos.
- Migraciones.
- Validaciones.
- Servicios.
- Endpoints.
- Interfaces.
- Pruebas.
- Documentación.

### Fase 6 — Preparación de producción comercial

Antes de utilizar el sistema en un negocio real se deberá comprobar:

- Seguridad.
- Permisos.
- Exactitud de cálculos monetarios.
- Transacciones de inventario y ventas.
- Integridad de datos.
- Rendimiento.
- Capacidad de usuarios simultáneos.
- Backups.
- Restauración.
- Disponibilidad.
- Monitoreo.
- Recuperación ante fallos.
- Límites y costos de infraestructura.

El plan gratuito no garantiza disponibilidad comercial ni capacidad ilimitada.

## 9. Reglas obligatorias para agentes de IA

Todos los agentes que participen en este repositorio deberán respetar las siguientes reglas:

1. Leer `PROJECT_PLAN.md` y `AGENTS.md` antes de realizar cambios.
2. No inventar requisitos de negocio.
3. No modificar la arquitectura sin una justificación técnica.
4. No introducir dependencias innecesarias.
5. Mantener TypeScript estricto.
6. No almacenar secretos en el repositorio.
7. No modificar migraciones que ya fueron aplicadas en entornos compartidos.
8. Implementar pruebas para nuevas funcionalidades.
9. Mantener separación de responsabilidades.
10. Evitar cambios en archivos no relacionados con la tarea.
11. No ejecutar operaciones destructivas sin autorización.
12. No realizar cambios en producción sin autorización.
13. No realizar commits o push sin autorización.
14. No afirmar que algo funciona sin haberlo probado.
15. Documentar bloqueos y decisiones relevantes.
16. Utilizar transacciones en operaciones que requieran atomicidad.
17. Usar tipos monetarios exactos y no aritmética de punto flotante para importes financieros.
18. Proteger rutas sensibles mediante autorización backend.
19. Verificar la compatibilidad real con Cloudflare Workers.
20. Priorizar soluciones sencillas, probadas y mantenibles.

## 10. Política de base de datos

El esquema será gestionado mediante Drizzle Kit y migraciones SQL.

No se modificarán manualmente tablas de producción sin un procedimiento documentado.

Las migraciones deberán poder ejecutarse de manera controlada.

Durante la primera fase solamente se podrán crear tablas técnicas mínimas para comprobar la infraestructura.

No crear tablas de ventas, productos o inventario sin requisitos aprobados.

La conexión a PostgreSQL local y Neon deberá configurarse por entorno.

## 11. Política de calidad

Antes de aceptar una fase, verificar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Y, cuando corresponda:

```bash
docker compose up --build -d
docker compose ps
```

También comprobar endpoints, logs, conectividad SQL y persistencia de datos.

El agente deberá diferenciar entre pruebas ejecutadas, pruebas pendientes y funcionalidades bloqueadas.

## 12. Criterios de entrega de la Fase 1

La primera fase se aceptará solamente cuando:

- El proyecto pueda ejecutarse desde una instalación limpia.
- Docker Compose levante los servicios.
- PostgreSQL mantenga los datos tras reiniciar.
- La API responda correctamente.
- El endpoint de base de datos realice una consulta SQL.
- React consulte exitosamente la API.
- Las migraciones funcionen.
- Las variables de entorno estén documentadas.
- Las pruebas principales pasen.
- El proyecto compile.
- La compatibilidad con Workers esté validada o se documenten bloqueos concretos.
- Exista documentación de instalación y mantenimiento.

## 13. Próxima acción

**Revisar la administración local de Fase 2 y preparar la Fase 3 cuando sea autorizada.**

El usuario autorizó la Fase 2 después de verificar la infraestructura local.
Las instrucciones de acceso y uso están en `gestion/fase-2.md`; las credenciales
locales se conservan en archivos privados ignorados por Git.

No conectar ni migrar Neon, configurar recursos Cloudflare, desplegar, crear
commits o publicar repositorios sin autorización. Los módulos comerciales siguen
pendientes de requisitos aprobados por el cliente.

---

## 14. Objetivo final

Construir una aplicación profesional que pueda mantenerse, desplegarse y evolucionar con independencia razonable de su desarrollador original.

La inteligencia artificial será utilizada para acelerar la implementación, pruebas y documentación, pero las decisiones arquitectónicas y la aceptación final permanecerán bajo supervisión humana.

**Principio central: primero una infraestructura confiable; después las funcionalidades del negocio.**
