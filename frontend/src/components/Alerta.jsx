import { useEffect } from 'react';

// Alerta que se puede cerrar. Si "autoCerrar" tiene milisegundos, se oculta sola.
// - Éxito: aparece como toast flotante (arriba a la derecha) para no empujar el contenido.
// - Errores y advertencias: se quedan en línea, junto a lo que falló.
// Los errores se anuncian de inmediato (role="alert"); los demás, de forma cortés (role="status").
export default function Alerta({ tipo = 'danger', children, onCerrar, autoCerrar }) {
  useEffect(() => {
    if (!autoCerrar || !onCerrar) return;
    const t = setTimeout(onCerrar, autoCerrar);
    return () => clearTimeout(t);
  }, [autoCerrar, onCerrar, children]);

  if (!children) return null;

  const contenido = (
    <div
      className={`alert alert-${tipo} d-flex align-items-start gap-2 py-2 ${tipo === 'success' ? 'toast-aviso shadow' : ''}`}
      role={tipo === 'danger' ? 'alert' : 'status'}
    >
      {tipo === 'success' && <span className="toast-marca" aria-hidden="true">✓</span>}
      <div className="flex-grow-1">{children}</div>
      {onCerrar && <button type="button" className="btn-close" aria-label="Cerrar aviso" onClick={onCerrar} />}
    </div>
  );

  return tipo === 'success' ? <div className="zona-toasts">{contenido}</div> : contenido;
}
