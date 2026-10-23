import { TRANSICIONES } from '../utils/formato';

// Botones para mover un ticket entre estados (solo se muestran a quien puede hacerlo)
export default function AccionesEstado({ ticket, onCambiar, ocupado, tamano = 'sm' }) {
  return (
    <div className="d-flex flex-wrap gap-1">
      {TRANSICIONES[ticket.estado].map((t) => (
        <button
          key={t.a}
          type="button"
          className={`btn btn-${tamano} ${t.a === 'resuelto' ? 'btn-success' : t.a === 'progreso' ? 'btn-primary' : 'btn-outline-secondary'}`}
          disabled={ocupado}
          onClick={() => onCambiar(ticket, t.a)}
        >
          {t.texto}
        </button>
      ))}
    </div>
  );
}
