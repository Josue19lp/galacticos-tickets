import { TRANSICIONES } from '../utils/formato';

// Botones para mover un ticket entre estados (solo se muestran a quien puede hacerlo).
// variante="tarjeta": botones claros de ancho completo, como en el tablero.
export default function AccionesEstado({ ticket, onCambiar, ocupado, tamano = 'sm', variante }) {
  const claseBoton = (destino) => {
    if (variante === 'tarjeta') return 'btn btn-accion flex-fill';
    if (destino === 'resuelto') return `btn btn-${tamano} btn-success`;
    if (destino === 'progreso') return `btn btn-${tamano} btn-primary`;
    return `btn btn-${tamano} btn-outline-secondary`;
  };

  return (
    <div className="d-flex flex-wrap gap-2">
      {TRANSICIONES[ticket.estado].map((t) => (
        <button
          key={t.a}
          type="button"
          className={claseBoton(t.a)}
          disabled={ocupado}
          onClick={() => onCambiar(ticket, t.a)}
        >
          {t.texto}
        </button>
      ))}
    </div>
  );
}