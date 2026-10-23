import { useEffect } from 'react';

// Alerta de Bootstrap que se puede cerrar. Si "autoCerrar" tiene milisegundos, se oculta sola.
export default function Alerta({ tipo = 'danger', children, onCerrar, autoCerrar }) {
  useEffect(() => {
    if (!autoCerrar || !onCerrar) return;
    const t = setTimeout(onCerrar, autoCerrar);
    return () => clearTimeout(t);
  }, [autoCerrar, onCerrar, children]);

  if (!children) return null;
  return (
    <div className={`alert alert-${tipo} d-flex align-items-start gap-2 py-2`} role="alert">
      <div className="flex-grow-1">{children}</div>
      {onCerrar && <button type="button" className="btn-close btn-sm" aria-label="Cerrar" onClick={onCerrar} />}
    </div>
  );
}
