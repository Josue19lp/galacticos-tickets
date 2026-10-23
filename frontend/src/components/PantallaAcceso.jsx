// Diseño compartido por Login y Registro
export default function PantallaAcceso({ titulo, subtitulo, children }) {
  return (
    <main className="acceso">
      <div className="acceso-marca">
        <img src="/favicon.svg" alt="" width="44" height="44" />
        <div>
          <div className="h4 mb-0 text-white">Galacticos S.A.</div>
          <div className="text-white-50 small">Mesa de soporte técnico</div>
        </div>
      </div>
      <div className="card acceso-tarjeta shadow">
        <div className="card-body p-4">
          <h1 className="h4 mb-1">{titulo}</h1>
          <p className="text-body-secondary small mb-4">{subtitulo}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
