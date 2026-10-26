# Frontend — Sistema de Tickets Galacticos S.A.

SPA en React + Vite que consume la API Express del backend.
Stack: React Router, Axios (interceptores JWT), Bootstrap 5 y validación manual + HTML5.

## Requisitos
- Node.js 20.19 o superior (Vite 8)
- El backend corriendo en `http://localhost:3000` (`npm run dev`) y el worker (`npm run worker`)

## Instalación
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:3000/api
npm run dev              # http://localhost:5173
```
El puerto 5173 debe coincidir con `CLIENT_URL` del `.env` del backend (CORS y cookie).

Usuarios de prueba (contraseña `Galacticos2026`): admin@galacticos.test, carlos@galacticos.test,
ana@galacticos.test y cliente@galacticos.test.

## Estructura
```
src/
├── pages/         Login, Registro, Tablero, TicketDetalle, Colas, Usuarios
├── components/    TicketCard, TicketForm, ColumnaEstado, RutaProtegida, Navbar, Modal, ...
├── services/      api.js (axios + interceptores), recursos.js (una función por endpoint)
├── context/       AuthContext.jsx (usuario, login, registro, logout)
├── utils/         formato.js (catálogos, fechas, permisos), errores.js (errores del backend)
└── App.jsx        rutas públicas y protegidas por rol
```

## Cómo funciona la autenticación
1. **Login:** `POST /api/auth/login` devuelve el `accessToken` (se guarda **solo en memoria**) y
   el backend deja el refresh token en una cookie `httpOnly`.
2. **Peticiones:** el interceptor de petición agrega `Authorization: Bearer <accessToken>`.
3. **Token expirado:** si la API responde 401, el interceptor de respuesta llama a
   `POST /api/auth/refresh`, guarda el nuevo token y repite la petición original. Si varias
   peticiones fallan a la vez, comparten una sola renovación (el backend rota el refresh token).
4. **Recargar la página:** al iniciar, `AuthContext` llama a `/auth/refresh` con la cookie para
   recuperar la sesión sin pedir la contraseña.
5. **Sesión vencida:** si el refresh también falla, se vuelve al login con un aviso.

Axios usa `withCredentials: true` para que viaje la cookie.

## Pantallas y permisos
| Pantalla | Cliente | Técnico | Admin |
|---|---|---|---|
| Tablero (pendiente / en progreso / resuelto) | Sus tickets | Asignados y sin asignar | Todos |
| Crear ticket | Sí | No | No |
| Editar ticket | Suyos no resueltos | Asignados | Todos |
| Cambiar estado | No | Sus asignados | Todos |
| Reasignar técnico | No | No | Sí |
| Eliminar | Suyos pendientes | No | Sí |
| Colas (jobs, reintentos, bitácora) | No | Sí | Sí + reintentar + bull-board |
| Usuarios (listar y crear técnicos/admins) | No | No | Sí |

El backend vuelve a validar todos estos permisos; el frontend solo oculta lo que no aplica.

## Evidencia de colas para la demo
- Al crear un ticket aparece el id del job de asignación; el tablero se actualiza cada 10 s
  y muestra el técnico que asignó el worker.
- El detalle de cada ticket muestra su historial de `job_logs` (encolado, reintentando, completado, fallido).
- La vista **Colas** se actualiza cada 3 s: conteos por estado, lista de trabajos, detalle con
  error, datos, resultado y bitácora. El admin puede reintentar un job fallido y abrir bull-board.
- Para mostrar reintentos: en el backend poner `SIMULAR_FALLO_SMTP=true`, reiniciar el worker,
  cambiar el estado de un ticket y ver en **Colas** cómo pasa por "Esperando reintento" hasta "Fallido".
  Después volver a `false`, reiniciar el worker y presionar **Reintentar trabajo**.

## Build de producción
```bash
npm run build     # genera dist/
npm run preview
```
