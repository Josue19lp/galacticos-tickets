import { useEffect } from 'react';

// Alerta de Bootstrap que se puede cerrar. Si "autoCerrar" tiene milisegundos, se oculta sola.
// Los errores se anuncian de inmediato (role="alert"); los demás avisos, de forma cortés (role="status").
export default function Alerta({ tipo = 'danger', children, onCerrar, autoCerrar }) {
  useEffect(() => {
    if (!autoCerrar || !onCerrar) return;
    const t = setTimeout(onCerrar, autoCerrar);
    return () => clearTimeout(t);
  }, [autoCerrar, onCerrar, children]);

  if (!children) return null;
  return (
    <div className={`alert alert-${tipo} d-flex align-items-start gap-2 py-2`} role={tipo === 'danger' ? 'alert' : 'status'}>
      <div className="flex-grow-1">{children}</div>
      {onCerrar && <button type="button" className="btn-close" aria-label="Cerrar aviso" onClick={onCerrar} />}
    </div>
  );
}
