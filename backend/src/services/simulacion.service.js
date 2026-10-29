// Simulación de fallos de correo, activable en vivo desde la vista Colas (solo admin).
// La bandera se guarda en Redis porque la API y el worker la comparten, tanto en local
// (procesos separados) como en producción (mismo proceso). Así no hace falta redesplegar.
const IORedis = require('ioredis');
const { connection } = require('../config/redis');

const CLAVE = 'galacticos:simular-fallo-correo';
const DURACION_MAX_S = 3600; // se apaga sola después de 1 hora, por si se olvida desactivarla

let redis;
const cliente = () => (redis ??= new IORedis(connection));

// Si no se puede leer la bandera, se asume desactivada: la simulación nunca debe
// impedir el envío real de correos.
async function estaActiva() {
  try {
    return (await cliente().get(CLAVE)) === '1';
  } catch {
    return false;
  }
}

async function cambiar(activo) {
  if (activo) await cliente().set(CLAVE, '1', 'EX', DURACION_MAX_S);
  else await cliente().del(CLAVE);
  return { activo };
}

module.exports = { estaActiva, cambiar };
