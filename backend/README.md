# Backend — Sistema de Tickets Galacticos S.A.

API REST en Node.js + Express 5, PostgreSQL (`pg`), JWT, BullMQ + Redis y Nodemailer.

## Requisitos
- Node.js 18 o superior
- PostgreSQL
- Redis (local, Memurai en Windows o Redis Cloud gratuito)

## Instalación
```bash
npm install
cp .env.example .env            # editar DATABASE_URL, REDIS_URL y los secretos JWT
createdb galacticos_tickets     # o créala desde pgAdmin
npm run db:init                 # ejecuta schema.sql + seed.sql
npm run dev                     # API en http://localhost:3000
npm run worker                  # en otra terminal: procesa las colas
```

### Usuarios de prueba (contraseña: `Galacticos2026`)
| Email | Rol |
|---|---|
| admin@galacticos.test | admin |
| carlos@galacticos.test | tecnico |
| ana@galacticos.test | tecnico |
| cliente@galacticos.test | cliente |

## Endpoints
| Método | Ruta | Rol |
|---|---|---|
| POST | /api/auth/register | Público |
| POST | /api/auth/login | Público → `{ user, accessToken }` + cookie `refreshToken` |
| POST | /api/auth/refresh | Cookie → nuevo `accessToken` (rota el refresh) |
| POST | /api/auth/logout | Autenticado |
| GET | /api/tickets?estado=&prioridad= | Autenticado (filtrado por rol) |
| GET | /api/tickets/:id | Autenticado (incluye `historial` de jobs) |
| POST | /api/tickets | Autenticado → encola asignación |
| PUT | /api/tickets/:id | Autenticado (`tecnico_id` solo admin) |
| PATCH | /api/tickets/:id/estado | Técnico asignado, admin → encola notificación |
| DELETE | /api/tickets/:id | Cliente (propio y pendiente), admin |
| GET | /api/users/me | Autenticado |
| GET | /api/users?rol= | Admin |
| POST | /api/users | Admin (crear técnicos/admins) |
| GET | /api/jobs?cola=&estado=&limite= | Técnico, admin |
| GET | /api/jobs/resumen | Técnico, admin (conteos por estado) |
| GET | /api/jobs/:id | Técnico, admin (incluye `bitacora`) |
| POST | /api/jobs/:id/reintentar | Admin |
| GET | /admin/queues | bull-board (requiere haber iniciado sesión como admin) |

## Notas para el frontend
- Axios debe usar `withCredentials: true` para que viaje la cookie del refresh token.
- Un 401 con `{"error":"Token expirado"}` indica que hay que llamar a `/api/auth/refresh` y repetir la petición.
- Errores de validación: `400 { error, detalles: [{ campo, mensaje }] }`.

## Demo de reintentos
Poner `SIMULAR_FALLO_SMTP=true` en `.env` y reiniciar el worker. Los correos fallan, BullMQ reintenta a los 2, 4 y 8 s, y el job queda en `failed` (visible en bull-board, `/api/jobs?estado=failed` y la tabla `job_logs`). Luego volver a `false` y reintentar desde bull-board o `POST /api/jobs/:id/reintentar`.

## Correos
Si `SMTP_USER`/`SMTP_PASS` están vacíos, el worker crea una cuenta Ethereal automáticamente y muestra en consola el enlace de vista previa de cada correo.
