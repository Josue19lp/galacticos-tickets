// Bloques grises que brillan mientras cargan los datos (en lugar de un spinner).
// aria-busy avisa a los lectores de pantalla que el contenido aún se está cargando.
const Barra = ({ ancho = '100%', alto = 12, className = '' }) => (
  <span className={`esqueleto ${className}`} style={{ width: ancho, height: alto }} />
);

export function EsqueletoTablero() {
  return (
    <div className="tablero" aria-busy="true" aria-label="Cargando tickets">
      {[3, 2, 2].map((n, c) => (
        <div className="columna" key={c}>
          <Barra ancho="40%" alto={16} />
          {Array.from({ length: n }, (_, i) => (
            <div className="tarjeta-ticket" key={i}>
              <Barra ancho="25%" />
              <Barra ancho="85%" alto={14} />
              <Barra ancho="55%" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function EsqueletoTabla({ filas = 5 }) {
  return (
    <div className="p-3 d-flex flex-column gap-3" aria-busy="true" aria-label="Cargando datos">
      {Array.from({ length: filas }, (_, i) => (
        <div className="d-flex gap-3" key={i}>
          <Barra ancho="30%" /><Barra ancho="20%" /><Barra ancho="15%" /><Barra ancho="25%" />
        </div>
      ))}
    </div>
  );
}
