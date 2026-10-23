import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsApi } from '../services/recursos';
import { ESTADOS, PRIORIDADES, estadoInfo } from '../utils/formato';
import { extraerError } from '../utils/errores';
import ColumnaEstado from '../components/ColumnaEstado';
import TicketForm from '../components/TicketForm';
import Modal from '../components/Modal';
import Alerta from '../components/Alerta';
import Cargando from '../components/Cargando';

const REFRESCO_MS = 10000; // el worker asigna en segundo plano, así que el tablero se actualiza solo

export default function Tablero() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ocupadoId, setOcupadoId] = useState(null);

  const [prioridad, setPrioridad] = useState('');
  const [asignacion, setAsignacion] = useState(''); // '' | 'mios' | 'sin'
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    try {
      setTickets(await ticketsApi.listar({ prioridad }));
      setError('');
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setCargando(false);
    }
  }, [prioridad]);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  // Filtros que se aplican en el navegador (búsqueda y asignación)
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tickets.filter((t) => {
      if (asignacion === 'mios' && t.tecnico_id !== user.id) return false;
      if (asignacion === 'sin' && t.tecnico_id !== null) return false;
      if (!q) return true;
      return [t.titulo, t.descripcion, t.cliente_nombre, t.tecnico_nombre, `#${t.id}`]
        .some((v) => v && v.toLowerCase().includes(q));
    });
  }, [tickets, busqueda, asignacion, user.id]);

  const crear = async (datos) => {
    const { ticket, jobId } = await ticketsApi.crear(datos);
    setModalAbierto(false);
    setAviso({
      tipo: 'success',
      texto: (
        <>
          Ticket <Link to={`/tickets/${ticket.id}`}>#{ticket.id}</Link> creado. La asignación automática de técnico
          quedó en cola <span className="font-monospace small">({jobId})</span>.
        </>
      ),
    });
    await cargar();
    setTimeout(cargar, 2500); // para ver al técnico asignado por el worker
  };

  const cambiarEstado = async (ticket, estado) => {
    setOcupadoId(ticket.id);
    try {
      await ticketsApi.cambiarEstado(ticket.id, estado);
      setAviso({
        tipo: 'success',
        texto: `Ticket #${ticket.id} movido a "${estadoInfo(estado).etiqueta}". Se encoló la notificación por correo.`,
      });
      await cargar();
    } catch (err) {
      setAviso({ tipo: 'danger', texto: extraerError(err).mensaje });
    } finally {
      setOcupadoId(null);
    }
  };

  const titulo = { cliente: 'Mis tickets', tecnico: 'Tickets asignados y por asignar', admin: 'Todos los tickets' }[user.rol];

  return (
    <div className="container-xl py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h4 mb-0">{titulo}</h1>
          <small className="text-body-secondary">Se actualiza automáticamente cada {REFRESCO_MS / 1000} s</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={cargar} title="Actualizar">Actualizar</button>
          <button className="btn btn-primary" onClick={() => setModalAbierto(true)}>+ Nuevo ticket</button>
        </div>
      </div>

      <div className="filtros card card-body py-2 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md">
            <input
              type="search" className="form-control form-control-sm" placeholder="Buscar por título, cliente, técnico o #id"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar"
            />
          </div>
          <div className="col-6 col-md-auto">
            <select className="form-select form-select-sm" value={prioridad} onChange={(e) => setPrioridad(e.target.value)} aria-label="Prioridad">
              <option value="">Todas las prioridades</option>
              {PRIORIDADES.map((p) => <option key={p.valor} value={p.valor}>Prioridad {p.etiqueta.toLowerCase()}</option>)}
            </select>
          </div>
          {user.rol !== 'cliente' && (
            <div className="col-6 col-md-auto">
              <select className="form-select form-select-sm" value={asignacion} onChange={(e) => setAsignacion(e.target.value)} aria-label="Asignación">
                <option value="">Cualquier asignación</option>
                {user.rol === 'tecnico' && <option value="mios">Asignados a mí</option>}
                <option value="sin">Sin asignar</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <Alerta tipo={aviso?.tipo} onCerrar={() => setAviso(null)} autoCerrar={8000}>{aviso?.texto}</Alerta>
      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      {cargando ? (
        <Cargando texto="Cargando tickets…" />
      ) : (
        <div className="tablero">
          {ESTADOS.map((e) => (
            <ColumnaEstado
              key={e.valor}
              estado={e}
              tickets={visibles.filter((t) => t.estado === e.valor)}
              onCambiarEstado={cambiarEstado}
              ocupadoId={ocupadoId}
            />
          ))}
        </div>
      )}

      <Modal titulo="Nuevo ticket" abierto={modalAbierto} onCerrar={() => setModalAbierto(false)}>
        <TicketForm onGuardar={crear} onCancelar={() => setModalAbierto(false)} />
      </Modal>
    </div>
  );
}
