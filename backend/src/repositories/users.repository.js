const db = require('../config/db');

const CAMPOS = 'id, nombre, email, rol, created_at';

async function buscarPorEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

async function buscarPorId(id) {
  const { rows } = await db.query(`SELECT ${CAMPOS} FROM users WHERE id = $1`, [id]);
  return rows[0];
}

async function crear({ nombre, email, passwordHash, rol = 'cliente' }) {
  const { rows } = await db.query(
    `INSERT INTO users (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING ${CAMPOS}`,
    [nombre, email, passwordHash, rol]
  );
  return rows[0];
}

async function listar({ rol } = {}) {
  const params = [];
  let sql = `SELECT ${CAMPOS} FROM users`;
  if (rol) {
    params.push(rol);
    sql += ' WHERE rol = $1';
  }
  const { rows } = await db.query(`${sql} ORDER BY id`, params);
  return rows;
}

// Técnico con menos tickets abiertos (pendiente o en progreso); desempata por id
async function tecnicoConMenosCarga() {
  const { rows } = await db.query(`
    SELECT u.id, u.nombre, u.email, COUNT(t.id)::int AS abiertos
    FROM users u
    LEFT JOIN tickets t ON t.tecnico_id = u.id AND t.estado <> 'resuelto'
    WHERE u.rol = 'tecnico'
    GROUP BY u.id
    ORDER BY abiertos ASC, u.id ASC
    LIMIT 1`);
  return rows[0];
}

module.exports = { buscarPorEmail, buscarPorId, crear, listar, tecnicoConMenosCarga };
