const { redisUrl } = require('./env');

// BullMQ acepta opciones de conexión; parseamos la URL (soporta Redis Cloud con usuario/clave y rediss://)
const url = new URL(redisUrl);

const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  username: url.username || undefined,
  password: url.password ? decodeURIComponent(url.password) : undefined,
  tls: url.protocol === 'rediss:' ? {} : undefined,
  maxRetriesPerRequest: null, // requerido por los workers de BullMQ
};

module.exports = { connection };
