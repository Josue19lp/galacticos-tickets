import { useEffect, useRef } from 'react';

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Modal de Bootstrap controlado por React (sin el JavaScript de Bootstrap).
// Mantiene el foco dentro del modal mientras está abierto y lo devuelve al botón que lo abrió.
export default function Modal({ titulo, abierto, onCerrar, children }) {
  const caja = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement;

    const alPresionar = (e) => {
      if (e.key === 'Escape') return onCerrar();
      if (e.key !== 'Tab' || !caja.current) return;
      const elementos = [...caja.current.querySelectorAll(ENFOCABLES)];
      if (!elementos.length) return;
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };

    document.addEventListener('keydown', alPresionar);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.classList.remove('modal-open');
      previo?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onClick={onCerrar}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" ref={caja}>
            <div className="modal-header">
              <h2 className="modal-title h5" id="modal-titulo">{titulo}</h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
