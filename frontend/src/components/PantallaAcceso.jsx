// Diseño compartido por Login y Registro: fondo estrellado con una órbita dorada y tarjeta tipo vidrio
export default function PantallaAcceso({ titulo, subtitulo, children }) {
  return (
    <main className="acceso">
      <div className="estrellas" aria-hidden="true" />
      <div className="orbita" aria-hidden="true" />
      <div className="acceso-contenido">
        <div className="acceso-marca">
          <img src="/favicon.svg" alt="" width="52" height="52" />
          <div>
            <div className="acceso-nombre">Galacticos S.A.</div>
            <div className="acceso-lema">Mesa de soporte técnico</div>
          </div>
        </div>
        <div className="card acceso-tarjeta">
          <div className="card-body p-4 p-sm-5">
            <h1 className="h4 fw-bold mb-1">{titulo}</h1>
            <p className="text-body-secondary small mb-4">{subtitulo}</p>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
