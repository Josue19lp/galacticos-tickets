// Arranque para producción en un solo servicio (plan gratuito de Render):
// levanta la API y el worker de colas en el mismo proceso.
// En local se siguen usando por separado: npm run dev + npm run worker
require('./server');
require('./workers/worker');
