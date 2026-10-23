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
      <div className="container-lg py-4">
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

  const guardar = async (datos) => {
    // Solo se envían los campos que cambiaron (el backend exige al menos uno)
    const cambios = Object.fromEntries(Object.entries(datos).filter(([k, v]) => ticket[k] !== v));
    if (Object.keys(cambios).length) await ticketsApi.editar(ticket.id, cambios);
    setEditando(false);
    setAviso({ tipo: 'success', texto: 'Cambios guardados.' });
    cargar();
  };

  const cambiarEstado = async (_t, estado) => {
    setOcupado(true);
    try {
      const { jobId } = await ticketsApi.cambiarEstado(ticket.id, estado);
      setAviso({ tipo: 'success', texto: `Estado cambiado a "${estadoInfo(estado).etiqueta}". Notificación encolada (${jobId}).` });
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

  const verColas = user.rol !== 'cliente';

  return (
    <div className="container-lg py-4">
      <Link to="/" className="small text-decoration-none">← Volver al tablero</Link>

      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mt-2 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="text-body-secondary font-monospace">#{ticket.id}</span>
            <BadgeEstado valor={ticket.estado} />
            <BadgePrioridad valor={ticket.prioridad} />
          </div>
          <h1 className="h4 mb-0">{ticket.titulo}</h1>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {puedeEditar(user, ticket) && !editando && (
            <button className="btn btn-outline-primary btn-sm" onClick={() => setEditando(true)}>Editar</button>
          )}
          {puedeEliminar(user, ticket) && !confirmarBorrado && (
            <button className="btn btn-outline-danger btn-sm" onClick={() => setConfirmarBorrado(true)}>Eliminar</button>
          )}
          {confirmarBorrado && (
            <div className="d-flex align-items-center gap-2 border border-danger rounded px-2 py-1">
              <small className="text-danger">¿Eliminar definitivamente?</small>
              <button className="btn btn-danger btn-sm" onClick={eliminar} disabled={ocupado}>Sí, eliminar</button>
              <button className="btn btn-light btn-sm" onClick={() => setConfirmarBorrado(false)}>No</button>
            </div>
          )}
        </div>
      </div>

      <Alerta tipo={aviso?.tipo} onCerrar={() => setAviso(null)} autoCerrar={8000}>{aviso?.texto}</Alerta>
      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              {editando ? (
                <TicketForm inicial={ticket} onGuardar={guardar} onCancelar={() => setEditando(false)} textoBoton="Guardar cambios" />
              ) : (
                <>
                  <h2 className="h6 text-body-secondary">Descripción</h2>
                  <p className="mb-0 texto-largo">{ticket.descripcion}</p>
                </>
              )}
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
              <h2 className="h6 mb-0">Historial de procesos en segundo plano</h2>
              <small className="text-body-secondary">Asignación y notificaciones</small>
            </div>
            {ticket.historial.length === 0 ? (
              <p className="card-body text-body-secondary small mb-0">Sin registros todavía.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0 small">
                  <thead>
                    <tr><th>Fecha</th><th>Cola</th><th>Estado</th><th>Intentos</th><th>Detalle</th></tr>
                  </thead>
                  <tbody>
                    {ticket.historial.map((h) => (
                      <tr key={h.id}>
                        <td className="text-nowrap">{fecha(h.created_at)}</td>
                        <td>
                          {verColas ? (
                            <Link to={`/colas?job=${encodeURIComponent(h.job_id)}`} title={h.job_id}>{h.cola}</Link>
                          ) : h.cola}
                        </td>
                        <td><BadgeJob valor={h.estado} /></td>
                        <td>{h.intentos}</td>
                        <td className="text-break">{resumirDetalle(h.detalle)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <ul className="list-group list-group-flush small">
              <li className="list-group-item">
                <div className="text-body-secondary">Cliente</div>
                <div className="fw-semibold">{ticket.cliente_nombre}</div>
                <div>{ticket.cliente_email}</div>
              </li>
              <li className="list-group-item">
                <div className="text-body-secondary mb-1">Técnico asignado</div>
                {user.rol === 'admin' ? (
                  <select className="form-select form-select-sm" value={ticket.tecnico_id ?? ''} onChange={reasignar} disabled={ocupado} aria-label="Técnico asignado">
                    <option value="">Sin asignar</option>
                    {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                ) : ticket.tecnico_nombre ? (
                  <>
                    <div className="fw-semibold">{ticket.tecnico_nombre}</div>
                    <div>{ticket.tecnico_email}</div>
                  </>
                ) : (
                  <span className="text-body-secondary">Pendiente de asignación automática</span>
                )}
              </li>
              <li className="list-group-item">
                <div className="text-body-secondary">Creado</div>
                <div>{fecha(ticket.created_at)}</div>
              </li>
              <li className="list-group-item">
                <div className="text-body-secondary">Última actualización</div>
                <div>{fecha(ticket.updated_at)}</div>
              </li>
              {puedeCambiarEstado(user, ticket) && (
                <li className="list-group-item">
                  <div className="text-body-secondary mb-2">Cambiar estado</div>
                  <AccionesEstado ticket={ticket} onCambiar={cambiarEstado} ocupado={ocupado} />
                </li>
              )}
              {user.rol === 'tecnico' && ticket.tecnico_id === null && (
                <li className="list-group-item text-body-secondary">
                  Este ticket aún no tiene técnico; podrás cambiar su estado cuando te sea asignado.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// La bitácora guarda el resultado del job como JSON; se muestra de forma legible
function resumirDetalle(detalle) {
  if (!detalle) return '—';
  try {
    const d = JSON.parse(detalle);
    if (d.omitido) return d.omitido;
    if (d.tecnico) return `Asignado a ${d.tecnico} (tenía ${d.cargaPrevia} abiertos)`;
    if (d.asunto) return `Correo enviado: ${d.asunto}`;
    return detalle;
  } catch {
    return detalle; // mensajes de error en texto plano
  }
}
