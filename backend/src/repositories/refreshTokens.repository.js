const db = require('../config/db');

async function guardar(userId, tokenHash, expiresAt) {
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
}

async function buscarVigente(tokenHash) {
  const { rows } = await db.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()',
    [tokenHash]
  );
  return rows[0];
}

async function revocar(tokenHash) {
  await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
}

module.exports = { guardar, buscarVigente, revocar };
