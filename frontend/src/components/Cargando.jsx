export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5 text-body-secondary">
      <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
