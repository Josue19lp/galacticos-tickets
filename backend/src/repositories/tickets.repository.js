const db = require('../config/db');

// Consulta base con los nombres y correos de cliente y técnico
const SELECT_DETALLE = `
  SELECT t.*,
         c.nombre AS cliente_nombre, c.email AS cliente_email,
         tec.nombre AS tecnico_nombre, tec.email AS tecnico_email
  FROM tickets t
  JOIN users c ON c.id = t.cliente_id
  LEFT JOIN users tec ON tec.id = t.tecnico_id`;

// Filtra según el rol: cliente → los suyos; técnico → asignados y sin asignar; admin → todos
async function listar(user, { estado, prioridad } = {}) {
  const condiciones = [];
  const params = [];

  if (user.rol === 'cliente') {
    params.push(user.id);
    condiciones.push(`t.cliente_id = $${params.length}`);
  } else if (user.rol === 'tecnico') {
    params.push(user.id);
    condiciones.push(`(t.tecnico_id = $${params.length} OR t.tecnico_id IS NULL)`);
  }
  if (estado) {
    params.push(estado);
    condiciones.push(`t.estado = $${params.length}`);
  }
  if (prioridad) {
    params.push(prioridad);
    condiciones.push(`t.prioridad = $${params.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await db.query(
    `${SELECT_DETALLE} ${where}
     ORDER BY CASE t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END, t.created_at DESC`,
    params
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await db.query(`${SELECT_DETALLE} WHERE t.id = $1`, [id]);
  return rows[0];
}

async function crear({ titulo, descripcion, prioridad, clienteId }) {
  const { rows } = await db.query(
    `INSERT INTO tickets (titulo, descripcion, prioridad, cliente_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [titulo, descripcion, prioridad, clienteId]
  );
  return rows[0];
}

// Actualiza solo los campos permitidos que vengan definidos
async function actualizar(id, cambios) {
  const permitidos = ['titulo', 'descripcion', 'prioridad', 'estado', 'tecnico_id'];
  const sets = [];
  const params = [];
  for (const campo of permitidos) {
    if (cambios[campo] !== undefined) {
      params.push(cambios[campo]);
      sets.push(`${campo} = $${params.length}`);
    }
  }
  if (!sets.length) return buscarPorId(id);
  params.push(id);
  await db.query(
    `UPDATE tickets SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
    params
  );
  return buscarPorId(id);
}

// Asigna solo si sigue sin técnico (evita pisar una asignación manual del admin)
async function asignarSiLibre(ticketId, tecnicoId) {
  const { rowCount } = await db.query(
    `UPDATE tickets SET tecnico_id = $1, updated_at = NOW()
     WHERE id = $2 AND tecnico_id IS NULL`,
    [tecnicoId, ticketId]
  );
  return rowCount > 0;
}

async function eliminar(id) {
  await db.query('DELETE FROM tickets WHERE id = $1', [id]);
}

module.exports = { listar, buscarPorId, crear, actualizar, asignarSiLibre, eliminar };
