const db = require('../config/db');

async function registrar({ jobId, cola, ticketId, estado, intentos, detalle }) {
  await db.query(
    `INSERT INTO job_logs (job_id, cola, ticket_id, estado, intentos, detalle)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [jobId, cola, ticketId || null, estado, intentos || 0, detalle || null]
  );
}

async function porJob(jobId) {
  const { rows } = await db.query(
    'SELECT * FROM job_logs WHERE job_id = $1 ORDER BY created_at',
    [jobId]
  );
  return rows;
}

async function porTicket(ticketId) {
  const { rows } = await db.query(
    'SELECT * FROM job_logs WHERE ticket_id = $1 ORDER BY created_at',
    [ticketId]
  );
  return rows;
}

module.exports = { registrar, porJob, porTicket };
