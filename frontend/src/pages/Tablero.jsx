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
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

// Botón tipo "píldora" para los filtros
function Pildora({ activa, onClick, children }) {
  return (
    <button type="button" className={`pildora ${activa ? 'activa' : ''}`} aria-pressed={activa} onClick={onClick}>
      {children}
    </button>
  );
}

export default function Tablero() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ocupadoId, setOcupadoId] = useState(null);

  const [prioridad, setPrioridad] = useState(''); // '' | 'alta' | 'media' | 'baja'
  const [asignacion, setAsignacion] = useState(''); // '' | 'mios' | 'sin'
  const [busqueda, setBusqueda] = useState('');

  // Se cargan todos los tickets visibles para el rol; los filtros se aplican en el navegador
  // para que las tarjetas de resumen no cambien al filtrar.
  const cargar = useCallback(async () => {
    try {
      setTickets(await ticketsApi.listar());
      setError('');
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  const resumen = useMemo(() => {
    const abiertos = tickets.filter((t) => t.estado !== 'resuelto');
    return [
      { etiqueta: 'Abiertos', valor: abiertos.length, clase: '' },
      { etiqueta: 'Prioridad alta', valor: abiertos.filter((t) => t.prioridad === 'alta').length, clase: 'resumen-alta' },
      { etiqueta: 'Sin asignar', valor: abiertos.filter((t) => t.tecnico_id === null).length, clase: 'resumen-sin' },
      {
        etiqueta: 'Resueltos esta semana',
        valor: tickets.filter((t) => t.estado === 'resuelto' && Date.now() - new Date(t.updated_at) < SEMANA_MS).length,
        clase: 'resumen-resuelto',
      },
    ];
  }, [tickets]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tickets.filter((t) => {
      if (prioridad && t.prioridad !== prioridad) return false;
      if (asignacion === 'mios' && t.tecnico_id !== user.id) return false;
      if (asignacion === 'sin' && t.tecnico_id !== null) return false;
      if (!q) return true;
      return [t.titulo, t.descripcion, t.cliente_nombre, t.tecnico_nombre, `#${t.id}`]
        .some((v) => v && v.toLowerCase().includes(q));
    });
  }, [tickets, busqueda, prioridad, asignacion, user.id]);

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
    <div className="container-xl py-4 tablero-pagina">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <h1 className="titulo-pagina mb-1">{titulo}</h1>
          <p className="text-body-secondary small mb-0">Se actualiza automáticamente cada {REFRESCO_MS / 1000} s</p>
        </div>
        <button className="btn btn-primary btn-nuevo" onClick={() => setModalAbierto(true)}>+ Nuevo ticket</button>
      </div>

      <div className="resumen mb-4">
        {resumen.map((r) => (
          <div key={r.etiqueta} className="resumen-tarjeta">
            <span className="resumen-etiqueta">{r.etiqueta}</span>
            <span className={`resumen-valor ${r.clase}`}>{cargando ? '–' : r.valor}</span>
          </div>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
        <input
          type="search" className="form-control buscador" placeholder="Buscar por título, cliente o #id"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar"
        />
        <div className="d-flex flex-wrap gap-2" role="group" aria-label="Filtrar por prioridad">
          <Pildora activa={prioridad === ''} onClick={() => setPrioridad('')}>Todas</Pildora>
          {PRIORIDADES.map((p) => (
            <Pildora key={p.valor} activa={prioridad === p.valor} onClick={() => setPrioridad(p.valor)}>
              {p.etiqueta}
            </Pildora>
          ))}
        </div>
        {user.rol !== 'cliente' && (
          <div className="d-flex flex-wrap gap-2" role="group" aria-label="Filtrar por asignación">
            {user.rol === 'tecnico' && (
              <Pildora activa={asignacion === 'mios'} onClick={() => setAsignacion(asignacion === 'mios' ? '' : 'mios')}>
                Asignados a mí
              </Pildora>
            )}
            <Pildora activa={asignacion === 'sin'} onClick={() => setAsignacion(asignacion === 'sin' ? '' : 'sin')}>
              Sin asignar
            </Pildora>
          </div>
        )}
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