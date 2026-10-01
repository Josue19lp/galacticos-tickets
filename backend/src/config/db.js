const { Pool } = require('pg');
const { databaseUrl } = require('./env');

const pool = new Pool({ connectionString: databaseUrl });

pool.on('error', (err) => console.error('Error inesperado en PostgreSQL:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
