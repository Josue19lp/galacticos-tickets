const nodemailer = require('nodemailer');
const { smtp } = require('../config/env');

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

async function enviar({ para, asunto, html }) {
  if (smtp.simularFallo) throw new Error('Fallo simulado de SMTP (SIMULAR_FALLO_SMTP=true)');
  const t = await obtenerTransporter();
  const info = await t.sendMail({
    from: '"Soporte Galacticos S.A." <soporte@galacticos.test>',
    to: para,
    subject: asunto,
    html,
  });
  return { messageId: info.messageId, preview: nodemailer.getTestMessageUrl(info) || null };
}

module.exports = { enviar };
