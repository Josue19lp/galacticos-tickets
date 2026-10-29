const nodemailer = require('nodemailer');
const { smtp, mailtrap } = require('../config/env');
const simulacion = require('./simulacion.service');

let transporter;

// Si no hay credenciales en .env, crea una cuenta de prueba de Ethereal al vuelo
async function obtenerTransporter() {
  if (transporter) return transporter;
  let { user, pass } = smtp;
  if (!user || !pass) {
    const cuenta = await nodemailer.createTestAccount();
    ({ user, pass } = cuenta);
    console.log(`📧 Cuenta Ethereal creada: ${user} / ${pass} (https://ethereal.email/login)`);
  }
  transporter = nodemailer.createTransport({
    host: smtp.host, port: smtp.port, secure: smtp.port === 465, auth: { user, pass },
  });
  return transporter;
}

// Envío por API HTTP de Mailtrap Sandbox. Se usa en producción porque Render (plan gratuito)
// bloquea los puertos SMTP. Igual que Ethereal, los correos quedan en una bandeja de pruebas.
async function enviarPorMailtrap({ para, asunto, html }) {
  const { token, inboxId } = mailtrap;
  const resp = await fetch(`https://sandbox.api.mailtrap.io/api/send/${inboxId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { email: 'soporte@galacticos.test', name: 'Soporte Galacticos S.A.' },
      to: para.map((email) => ({ email })),
      subject: asunto,
      html,
    }),
  });
  const cuerpo = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // Lanzar el error hace que BullMQ reintente el trabajo
    throw new Error(`Mailtrap respondió ${resp.status}: ${JSON.stringify(cuerpo.errors || cuerpo)}`);
  }
  return { messageId: cuerpo.message_ids?.[0] || null, preview: null, via: 'mailtrap' };
}

async function enviar({ para, asunto, html }) {
  // Fallo a propósito para demostrar reintentos: por variable de entorno o por el interruptor de la vista Colas
  if (smtp.simularFallo) throw new Error('Fallo simulado de SMTP (SIMULAR_FALLO_SMTP=true)');
  if (await simulacion.estaActiva()) throw new Error('Fallo simulado de envío de correo (activado desde la vista Colas)');
  if (mailtrap.token && mailtrap.inboxId) return enviarPorMailtrap({ para, asunto, html });

  const t = await obtenerTransporter();
  const info = await t.sendMail({
    from: '"Soporte Galacticos S.A." <soporte@galacticos.test>',
    to: para,
    subject: asunto,
    html,
  });
  return { messageId: info.messageId, preview: nodemailer.getTestMessageUrl(info) || null, via: 'smtp' };
}

module.exports = { enviar };
