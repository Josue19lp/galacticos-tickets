import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ORIGIN } from '../services/api';
import { jobsApi } from '../services/recursos';
import { ESTADOS_JOB, PRIORIDAD_JOB, fecha, haceCuanto } from '../utils/formato';
import { extraerError } from '../utils/errores';
import { BadgeJob, BadgePrioridad } from '../components/Badges';
import Alerta from '../components/Alerta';
import Cargando from '../components/Cargando';
import { EsqueletoTabla } from '../components/Esqueleto';

const COLAS = [
  { valor: 'asignacion', etiqueta: 'Asignación', descripcion: 'Asigna el técnico con menos carga' },
  { valor: 'notificacion', etiqueta: 'Notificación', descripcion: 'Envía correos al cliente y al técnico' },
];
const ESTADOS_BULL = ['waiting', 'prioritized', 'active', 'delayed', 'completed', 'failed'];

export default function Colas() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const seleccionado = params.get('job');

  const [resumen, setResumen] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filtros, setFiltros] = useState({ cola: '', estado: '', limite: 50 });
  const [autoRefresco, setAutoRefresco] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [r, j] = await Promise.all([jobsApi.resumen(), jobsApi.listar(filtros)]);
      setResumen(r);
      setJobs(j);
      setError('');
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
    if (!autoRefresco) return;
    const t = setInterval(cargar, 3000);
    return () => clearInterval(t);
  }, [cargar, autoRefresco]);

  const cambiarFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const abrir = (id) => setParams(id ? { job: id } : {});

  // Resumen simplificado por cola: "En cola" junta waiting + prioritized
  // (en BullMQ los trabajos con prioridad esperan en "prioritized").
  const gruposDe = (cola) => {
    const r = resumen?.[cola] || {};
    return [
      { clave: 'cola', etiqueta: 'En cola', n: (r.waiting || 0) + (r.prioritized || 0), filtro: 'prioritized' },
      { clave: 'procesando', etiqueta: 'Procesando', n: r.active || 0, filtro: 'active' },
      { clave: 'reintentando', etiqueta: 'Reintentando', n: r.delayed || 0, filtro: 'delayed' },
      { clave: 'completado', etiqueta: 'Completados', n: r.completed || 0, filtro: 'completed' },
      { clave: 'fallido', etiqueta: 'Fallidos', n: r.failed || 0, filtro: 'failed' },
    ];
  };

  const filtrarPor = (cola, estado) => {
    const yaActivo = filtros.cola === cola && filtros.estado === estado;
    setFiltros({ ...filtros, cola: yaActivo ? '' : cola, estado: yaActivo ? '' : estado });
  };

  return (
    <div className="container-xl py-4">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <h1 className="titulo-pagina mb-1">Colas de trabajo</h1>
          <p className="text-body-secondary small mb-0">3 intentos automáticos con espera de 2, 4 y 8 s</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" id="auto" checked={autoRefresco} onChange={(e) => setAutoRefresco(e.target.checked)} />
            <label className="form-check-label small" htmlFor="auto">Tiempo real</label>
          </div>
          {user.rol === 'admin' && (
            <a className="btn btn-accion px-3 d-flex align-items-center" href={`${API_ORIGIN}/admin/queues`} target="_blank" rel="noreferrer">
              Abrir bull-board ↗
            </a>
          )}
        </div>
      </div>

      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      {/* Resumen por cola: una barra y una leyenda en texto */}
      <div className="row g-3 mb-4">
        {COLAS.map((c) => {
          const grupos = gruposDe(c.valor);
          const total = grupos.reduce((suma, g) => suma + g.n, 0);
          return (
            <div className="col-lg-6" key={c.valor}>
              <section className="cola-panel">
                <div className="d-flex justify-content-between align-items-baseline gap-2 flex-wrap">
                  <h2 className="cola-nombre">{c.etiqueta}</h2>
                  <span className="cola-desc">{c.descripcion}</span>
                </div>
                <p className="cola-total">
                  <span className="cola-total-num">{resumen ? total : '–'}</span> trabajos
                </p>
                <div className="cola-barra" aria-hidden="true">
                  {grupos.filter((g) => g.n > 0).map((g) => (
                    <span key={g.clave} className={`seg seg-${g.clave}`} style={{ flexGrow: g.n }} />
                  ))}
                </div>
                <ul className="cola-leyenda">
                  {grupos.map((g) => (
                    <li key={g.clave}>
                      <button
                        type="button"
                        className={`leyenda-item ${filtros.cola === c.valor && filtros.estado === g.filtro ? 'activo' : ''} ${g.clave === 'fallido' && g.n > 0 ? 'hay-fallos' : ''}`}
                        aria-pressed={filtros.cola === c.valor && filtros.estado === g.filtro}
                        onClick={() => filtrarPor(c.valor, g.filtro)}
                        title={`Ver ${g.etiqueta.toLowerCase()} en ${c.etiqueta}`}
                      >
                        <span className={`punto seg-${g.clave}`} aria-hidden="true" />
                        <span className="leyenda-num">{resumen ? g.n : '–'}</span>
                        {g.etiqueta}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          );
        })}
      </div>

      <div className="row g-3">
        <div className={seleccionado ? 'col-lg-7' : 'col-12'}>
          <div className="panel-trabajos">
            <div className="panel-trabajos-cabecera">
              <h2 className="panel-titulo me-auto">Trabajos</h2>
              <select name="cola" className="form-select form-select-sm w-auto" value={filtros.cola} onChange={cambiarFiltro} aria-label="Cola">
                <option value="">Todas las colas</option>
                {COLAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
              </select>
              <select name="estado" className="form-select form-select-sm w-auto" value={filtros.estado} onChange={cambiarFiltro} aria-label="Estado">
                <option value="">Todos los estados</option>
                {ESTADOS_BULL.map((e) => <option key={e} value={e}>{ESTADOS_JOB[e].etiqueta}</option>)}
              </select>
            </div>
            {cargando ? (
              <EsqueletoTabla />
            ) : jobs.length === 0 ? (
              <p className="text-body-secondary small mb-0 p-4">No hay trabajos con esos filtros.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 tabla-trabajos">
                  <thead>
                    <tr><th>Trabajo</th><th>Ticket</th><th>Prioridad</th><th>Estado</th><th>Intentos</th><th>Creado</th></tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr
                        key={j.id}
                        className={`fila-clic ${seleccionado === j.id ? 'table-active' : ''}`}
                        onClick={() => abrir(j.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(j.id); } }}
                        tabIndex={0}
                        aria-selected={seleccionado === j.id}
                        aria-label={`Ver detalle de ${j.nombre} del ticket ${j.datos.ticketId}`}
                      >
                        <td>
                          <div className="fw-semibold">{j.nombre}</div>
                          <div className="text-body-secondary">{j.cola}</div>
                        </td>
                        <td>#{j.datos.ticketId}</td>
                        <td>{j.prioridad ? <BadgePrioridad valor={PRIORIDAD_JOB[j.prioridad]} /> : '—'}</td>
                        <td><BadgeJob valor={j.estado} /></td>
                        <td className="numeros">{j.intentos}/{j.maxIntentos}</td>
                        <td className="text-nowrap" title={fecha(j.creado)}>{haceCuanto(j.creado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {seleccionado && (
          <div className="col-lg-5">
            <DetalleJob id={seleccionado} onCerrar={() => abrir(null)} esAdmin={user.rol === 'admin'} alCambiar={cargar} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetalleJob({ id, onCerrar, esAdmin, alCambiar }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [reintentando, setReintentando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setJob(await jobsApi.obtener(id));
      setError('');
    } catch (err) {
      setError(extraerError(err).mensaje);
    }
  }, [id]);

  useEffect(() => {
    setJob(null);
    cargar();
    const t = setInterval(cargar, 3000);
    return () => clearInterval(t);
  }, [cargar]);

  const reintentar = async () => {
    setReintentando(true);
    try {
      setJob(await jobsApi.reintentar(id));
      setAviso('Trabajo reenviado a la cola.');
      alCambiar();
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setReintentando(false);
    }
  };

  return (
    <div className="panel-trabajos detalle-job">
      <div className="panel-cabecera justify-content-between">
        <h2 className="panel-titulo">Detalle del trabajo</h2>
        <button type="button" className="btn-close" aria-label="Cerrar detalle" onClick={onCerrar} />
      </div>
      <div className="p-4 small">
        <Alerta onCerrar={() => setError('')}>{error}</Alerta>
        <Alerta tipo="success" onCerrar={() => setAviso('')} autoCerrar={5000}>{aviso}</Alerta>
        {!job ? (
          !error && <Cargando />
        ) : (
          <>
            <div className="font-monospace text-break mb-2">{job.id}</div>
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <BadgeJob valor={job.estado} />
              <span>Intentos: {job.intentos}/{job.maxIntentos}</span>
              <Link to={`/tickets/${job.datos.ticketId}`}>Ver ticket #{job.datos.ticketId}</Link>
            </div>

            <dl className="row mb-2">
              <dt className="col-4 fw-normal text-body-secondary">Creado</dt><dd className="col-8">{fecha(job.creado)}</dd>
              <dt className="col-4 fw-normal text-body-secondary">Procesado</dt><dd className="col-8">{fecha(job.procesado)}</dd>
              <dt className="col-4 fw-normal text-body-secondary">Finalizado</dt><dd className="col-8">{fecha(job.finalizado)}</dd>
            </dl>

            {job.error && (
              <div className="alert alert-danger py-2">
                <div className="fw-semibold">Último error</div>
                {job.error}
              </div>
            )}

            {esAdmin && job.estado === 'failed' && (
              <button type="button" className="btn btn-primary mb-3" onClick={reintentar} disabled={reintentando}>
                {reintentando && <span className="spinner-border spinner-border-sm me-2" />}
                Reintentar trabajo
              </button>
            )}

            <div className="fw-semibold mb-1">Datos</div>
            <pre className="bloque-json">{JSON.stringify(job.datos, null, 2)}</pre>
            {job.resultado && (
              <>
                <div className="fw-semibold mb-1">Resultado</div>
                <pre className="bloque-json">{JSON.stringify(job.resultado, null, 2)}</pre>
              </>
            )}

            <div className="fw-semibold mb-1">Bitácora (job_logs)</div>
            {job.bitacora.length === 0 ? (
              <p className="text-body-secondary">Sin registros.</p>
            ) : (
              <ol className="linea-tiempo">
                {job.bitacora.map((b) => (
                  <li key={b.id}>
                    <div className="d-flex gap-2 align-items-center">
                      <BadgeJob valor={b.estado} />
                      <span className="text-body-secondary">{fecha(b.created_at)} · intento {b.intentos}</span>
                    </div>
                    {b.detalle && <div className="text-break mt-1">{b.detalle}</div>}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}