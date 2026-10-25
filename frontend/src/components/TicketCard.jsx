import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { haceCuanto, puedeCambiarEstado } from '../utils/formato';
import { BadgePrioridad } from './Badges';
import AccionesEstado from './AccionesEstado';

// "Carlos Técnico" → "CT"
const iniciales = (nombre) =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export default function TicketCard({ ticket, onCambiarEstado, ocupado }) {
  const { user } = useAuth();
  const esMio = user.rol === 'tecnico' && ticket.tecnico_id === user.id;
  const asignado = Boolean(ticket.tecnico_nombre);

  return (
    <article className={`tarjeta-ticket ${esMio ? 'es-mio' : ''}`}>
      <div className="d-flex justify-content-between align-items-center">
        <span className="tarjeta-id">#{ticket.id}</span>
        <BadgePrioridad valor={ticket.prioridad} />
      </div>

      <h3 className="tarjeta-titulo">
        <Link to={`/tickets/${ticket.id}`}>{ticket.titulo}</Link>
      </h3>

      {user.rol !== 'cliente' && <p className="tarjeta-cliente">Cliente: {ticket.cliente_nombre}</p>}

      <div className="tarjeta-pie">
        <div className="d-flex align-items-center gap-2 text-truncate">
          <span className={`avatar ${asignado ? '' : 'avatar-vacio'}`} aria-hidden="true">
            {asignado ? iniciales(ticket.tecnico_nombre) : '?'}
          </span>
          <span className="text-truncate">{asignado ? ticket.tecnico_nombre : 'Sin asignar'}</span>
          {esMio && <span className="badge text-bg-primary">Tú</span>}
        </div>
        <span className="text-nowrap" title={new Date(ticket.updated_at).toLocaleString('es-GT')}>
          {haceCuanto(ticket.updated_at)}
        </span>
      </div>

      {puedeCambiarEstado(user, ticket) && (
        <AccionesEstado ticket={ticket} onCambiar={onCambiarEstado} ocupado={ocupado} variante="tarjeta" />
      )}
    </article>
  );
}