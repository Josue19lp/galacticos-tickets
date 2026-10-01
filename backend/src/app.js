const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { clientUrl } = require('./config/env');
const bullBoard = require('./config/bullBoard');
const soloAdminPorCookie = require('./middlewares/adminPanel');
const { noEncontrado, manejadorErrores } = require('./middlewares/errores');

const app = express();

// bull-board usa scripts y estilos en línea, así que se monta antes de helmet
app.use(bullBoard.BASE, cookieParser(), soloAdminPorCookie, bullBoard.router);

app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true })); // credentials para la cookie del refresh
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true, fecha: new Date() }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tickets', require('./routes/tickets.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/jobs', require('./routes/jobs.routes'));

app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
