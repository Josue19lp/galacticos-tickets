import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { haceCuanto, puedeCambiarEstado } from '../utils/formato';
import { BadgePrioridad } from './Badges';
import AccionesEstado from './AccionesEstado';

export default function TicketCard({ ticket, onCambiarEstado, ocupado }) {
  const { user } = useAuth();
  const esMio = user.rol === 'tecnico' && ticket.tecnico_id === user.id;

  return (
    <article className={`card tarjeta-ticket borde-${ticket.prioridad} ${esMio ? 'es-mio' : ''}`}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <small className="text-body-secondary font-monospace">#{ticket.id}</small>
          <BadgePrioridad valor={ticket.prioridad} />
        </div>

        <h3 className="h6 mb-1">
          <Link to={`/tickets/${ticket.id}`} className="stretched-link-titulo text-decoration-none">
            {ticket.titulo}
          </Link>
        </h3>
        <p className="small text-body-secondary mb-2 recorte-2">{ticket.descripcion}</p>

        <div className="small d-flex flex-column gap-1">
          {user.rol !== 'cliente' && (
            <span><span className="text-body-secondary">Cliente:</span> {ticket.cliente_nombre}</span>
          )}
          <span>
            <span className="text-body-secondary">Técnico:</span>{' '}
            {ticket.tecnico_nombre ? (
              <>
                {ticket.tecnico_nombre}
                {esMio && <span className="badge text-bg-primary ms-1">Tú</span>}
              </>
            ) : (
              <span className="badge text-bg-light border">Sin asignar</span>
            )}
          </span>
          <span className="text-body-secondary" title={new Date(ticket.updated_at).toLocaleString('es-GT')}>
            Actualizado {haceCuanto(ticket.updated_at)}
          </span>
        </div>

        {puedeCambiarEstado(user, ticket) && (
          <div className="mt-2 pt-2 border-top">
            <AccionesEstado ticket={ticket} onCambiar={onCambiarEstado} ocupado={ocupado} />
          </div>
        )}
      </div>
    </article>
  );
}
