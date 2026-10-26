import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi, usersApi } from '../services/recursos';
import { estadoInfo, fecha, puedeCambiarEstado, puedeEditar, puedeEliminar } from '../utils/formato';
import { extraerError } from '../utils/errores';
import { BadgeEstado, BadgeJob, BadgePrioridad } from '../components/Badges';
import AccionesEstado from '../components/AccionesEstado';
import TicketForm from '../components/TicketForm';
import Alerta from '../components/Alerta';
import Cargando from '../components/Cargando';

export default function TicketDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [editando, setEditando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [tecnicos, setTecnicos] = useState([]);

  const cargar = useCallback(async () => {
    try {
      setTicket(await ticketsApi.obtener(id));
      setError('');
    } catch (err) {
      setError(extraerError(err).mensaje);
    }
  }, [id]);

  // El historial de jobs cambia mientras el worker procesa, así que se refresca periódicamente
  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 5000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    if (user.rol === 'admin') usersApi.listar({ rol: 'tecnico' }).then(setTecnicos).catch(() => {});
  }, [user.rol]);

  if (!ticket) {
    return (
      <div className="container-xl py-4">
        {error ? (
          <>
            <Alerta>{error}</Alerta>
            <Link to="/">← Volver al tablero</Link>
          </>
        ) : (
          <Cargando />
        )}
      </div>
    );
  }

  const esCliente = user.rol === 'cliente';
  const esTecnico = user.rol === 'tecnico';

  const guardar = async (datos) => {
    // Solo se envían los campos que cambiaron (el backend exige al menos uno)
    const cambios = Object.fromEntries(Object.entries(datos).filter(([k, v]) => ticket[k] !== v));
    if (esTecnico) delete cambios.prioridad; // el técnico no cambia la prioridad
    if (Object.keys(cambios).length) await ticketsApi.editar(ticket.id, cambios);
    setEditando(false);
    setAviso({ tipo: 'success', texto: 'Cambios guardados.' });
    cargar();
  };

  const cambiarEstado = async (_t, estado) => {
    setOcupado(true);
    try {
      const { jobId } = await ticketsApi.cambiarEstado(ticket.id, estado);
      setAviso({ tipo: 'success', texto: `Estado cambiado a “${estadoInfo(estado).etiqueta}”. Notificación encolada (${jobId}).` });
      await cargar();
    } catch (err) {
      setAviso({ tipo: 'danger', texto: extraerError(err).mensaje });
    } finally {
      setOcupado(false);
    }
  };

  const reasignar = async (e) => {
    const valor = e.target.value === '' ? null : Number(e.target.value);
    setOcupado(true);
    try {
      await ticketsApi.editar(ticket.id, { tecnico_id: valor });
      setAviso({ tipo: 'success', texto: valor ? 'Técnico reasignado. Se notificará por correo.' : 'El ticket quedó sin técnico.' });
      await cargar();
    } catch (err) {
      setAviso({ tipo: 'danger', texto: extraerError(err).mensaje });
    } finally {
      setOcupado(false);
    }
  };

  const eliminar = async () => {
    setOcupado(true);
    try {
      await ticketsApi.eliminar(ticket.id);
      navigate('/', { replace: true });
    } catch (err) {
      setAviso({ tipo: 'danger', texto: extraerError(err).mensaje });
      setOcupado(false);
      setConfirmarBorrado(false);
    }
  };

  return (
    <div className="container-xl py-4">
      <Link to="/" className="small text-decoration-none">← Volver al tablero</Link>

      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mt-2 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="tarjeta-id">#{ticket.id}</span>
            <BadgeEstado valor={ticket.estado} />
            <BadgePrioridad valor={ticket.prioridad} />
          </div>
          <h1 className="titulo-pagina mb-0 text-break">{ticket.titulo}</h1>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {puedeEditar(user, ticket) && !editando && (
            <button type="button" className="btn btn-accion px-3" onClick={() => setEditando(true)}>Editar</button>
          )}
          {puedeEliminar(user, ticket) && !confirmarBorrado && (
            <button type="button" className="btn btn-accion btn-accion-peligro px-3" onClick={() => setConfirmarBorrado(true)}>Eliminar</button>
          )}
          {confirmarBorrado && (
            <div className="d-flex align-items-center gap-2 confirmar-borrado" role="group" aria-label="Confirmar eliminación">
              <span className="small text-danger fw-semibold">¿Eliminar definitivamente?</span>
              <button type="button" className="btn btn-danger" onClick={eliminar} disabled={ocupado}>Sí, eliminar</button>
              <button type="button" className="btn btn-accion px-3" onClick={() => setConfirmarBorrado(false)}>No</button>
            </div>
          )}
        </div>
      </div>

      <Alerta tipo={aviso?.tipo} onCerrar={() => setAviso(null)} autoCerrar={8000}>{aviso?.texto}</Alerta>
      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      <div className="row g-3">
        <div className="col-lg-8">
          <section className="panel p-4">
            {editando ? (
              <TicketForm
                inicial={ticket} onGuardar={guardar} onCancelar={() => setEditando(false)}
                textoBoton="Guardar cambios" bloquearPrioridad={esTecnico}
              />
            ) : (
              <>
                <h2 className="panel-titulo mb-2">Descripción</h2>
                <p className="mb-0 texto-largo">{ticket.descripcion}</p>
              </>
            )}
          </section>

          {esCliente ? <Seguimiento ticket={ticket} /> : <HistorialTecnico historial={ticket.historial} />}
        </div>

        <div className="col-lg-4">
          <aside className="panel">
            <dl className="ficha mb-0">
              <div>
                <dt>Cliente</dt>
                <dd className="fw-semibold">{ticket.cliente_nombre}</dd>
                <dd className="text-break">{ticket.cliente_email}</dd>
              </div>
              <div>
                <dt>Técnico asignado</dt>
                {user.rol === 'admin' ? (
                  <dd>
                    <select className="form-select" value={ticket.tecnico_id ?? ''} onChange={reasignar} disabled={ocupado} aria-label="Técnico asignado">
                      <option value="">Sin asignar</option>
                      {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </dd>
                ) : ticket.tecnico_nombre ? (
                  <>
                    <dd className="fw-semibold">{ticket.tecnico_nombre}</dd>
                    <dd className="text-break">{ticket.tecnico_email}</dd>
                  </>
                ) : (
                  <dd className="text-body-secondary">Pendiente de asignación automática</dd>
                )}
              </div>
              <div>
                <dt>Creado</dt>
                <dd className="numeros">{fecha(ticket.created_at)}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd className="numeros">{fecha(ticket.updated_at)}</dd>
              </div>
              {puedeCambiarEstado(user, ticket) && (
                <div>
                  <dt className="mb-2">Cambiar estado</dt>
                  <dd><AccionesEstado ticket={ticket} onCambiar={cambiarEstado} ocupado={ocupado} variante="tarjeta" /></dd>
                </div>
              )}
              {esTecnico && ticket.tecnico_id === null && (
                <div><dd className="text-body-secondary small">Este ticket aún no tiene técnico; podrás cambiar su estado cuando te sea asignado.</dd></div>
              )}
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---- Vista del cliente: línea de tiempo en lenguaje simple, sin colas, intentos ni errores ----
function Seguimiento({ ticket }) {
  const eventos = [{ id: 'creado', fecha: ticket.created_at, texto: 'Reportaste la incidencia' }];
  for (const h of ticket.historial) {
    if (h.estado !== 'completado') continue; // los reintentos y fallos son internos
    const d = leerDetalle(h.detalle);
    if (h.cola === 'asignacion' && d?.tecnico) eventos.push({ id: h.id, fecha: h.created_at, texto: `Se asignó al técnico ${d.tecnico}` });
    if (h.cola === 'notificacion' && d?.asunto) eventos.push({ id: h.id, fecha: h.created_at, texto: `Te enviamos un correo: ${d.asunto}` });
  }
  if (!ticket.tecnico_id) eventos.push({ id: 'espera', fecha: null, texto: 'Buscando un técnico disponible…' });

  return (
    <section className="panel p-4 mt-3">
      <h2 className="panel-titulo mb-3">Seguimiento</h2>
      <ol className="linea-tiempo mb-0">
        {eventos.map((e) => (
          <li key={e.id}>
            <div>{e.texto}</div>
            {e.fecha && <div className="small text-body-secondary numeros">{fecha(e.fecha)}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---- Vista de técnico y admin: bitácora completa de procesos en segundo plano ----
function HistorialTecnico({ historial }) {
  return (
    <section className="panel mt-3 overflow-hidden">
      <div className="panel-cabecera">
        <h2 className="panel-titulo me-auto">Historial de procesos en segundo plano</h2>
        <span className="small text-body-secondary">Asignación y notificaciones</span>
      </div>
      {historial.length === 0 ? (
        <p className="text-body-secondary small mb-0 p-4">Sin registros todavía.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle mb-0 tabla">
            <thead>
              <tr><th>Fecha</th><th>Cola</th><th>Estado</th><th>Intentos</th><th>Detalle</th></tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id}>
                  <td className="text-nowrap numeros">{fecha(h.created_at)}</td>
                  <td><Link to={`/colas?job=${encodeURIComponent(h.job_id)}`} title={h.job_id}>{h.cola}</Link></td>
                  <td><BadgeJob valor={h.estado} /></td>
                  <td className="numeros">{h.intentos}</td>
                  <td className="text-break">{resumirDetalle(h.detalle)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function leerDetalle(detalle) {
  try {
    return JSON.parse(detalle);
  } catch {
    return null;
  }
}

// La bitácora guarda el resultado del job como JSON; se muestra de forma legible
function resumirDetalle(detalle) {
  if (!detalle) return '—';
  const d = leerDetalle(detalle);
  if (!d) return detalle; // mensajes de error en texto plano
  if (d.omitido) return d.omitido;
  if (d.tecnico) return `Asignado a ${d.tecnico} (carga previa: ${d.cargaPrevia} pts)`;
  if (d.asunto) return `Correo enviado: ${d.asunto}`;
  return detalle;
}
