const app = require('./app');
const { port } = require('./config/env');
const db = require('./config/db');

(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✔ Conectado a PostgreSQL');
  } catch (err) {
    console.error('✖ No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  }
  app.listen(port, () => {
    console.log(`🚀 API en http://localhost:${port}`);
    console.log(`📊 bull-board en http://localhost:${port}/admin/queues (solo admin)`);
  });
})();
