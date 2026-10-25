import TicketCard from './TicketCard';

export default function ColumnaEstado({ estado, tickets, onCambiarEstado, ocupadoId }) {
  return (
    <section className={`columna columna-${estado.valor}`} aria-label={estado.etiqueta}>
      <header className="columna-cabecera">
        <h2 className="columna-titulo">
          <span className="columna-punto" aria-hidden="true" />
          {estado.etiqueta}
        </h2>
        <span className="columna-total">{tickets.length}</span>
      </header>
      <div className="columna-cuerpo">
        {tickets.length === 0 && <p className="text-body-secondary small text-center my-4">Sin tickets</p>}
        {tickets.map((t) => (
          <TicketCard key={t.id} ticket={t} onCambiarEstado={onCambiarEstado} ocupado={ocupadoId === t.id} />
        ))}
      </div>
    </section>
  );
}