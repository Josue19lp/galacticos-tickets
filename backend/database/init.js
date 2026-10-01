// Crea las tablas y carga los usuarios de prueba: npm run db:init
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (const f of ['schema.sql', 'seed.sql']) {
      await pool.query(fs.readFileSync(path.join(__dirname, f), 'utf8'));
      console.log(`✔ ${f} ejecutado`);
    }
  } catch (err) {
    console.error('Error inicializando la base de datos:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
