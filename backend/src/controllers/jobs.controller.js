const jobsService = require('../services/jobs.service');

const listar = async (req, res) => res.json(await jobsService.listar(req.query));
const resumen = async (req, res) => res.json(await jobsService.resumen());
const obtener = async (req, res) => res.json(await jobsService.obtener(req.params.id));
const reintentar = async (req, res) => res.json(await jobsService.reintentar(req.params.id));

module.exports = { listar, resumen, obtener, reintentar };
