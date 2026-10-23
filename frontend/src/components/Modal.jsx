import { useEffect } from 'react';

// Modal de Bootstrap controlado por React (sin el JavaScript de Bootstrap)
export default function Modal({ titulo, abierto, onCerrar, children }) {
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPresionar);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.classList.remove('modal-open');
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" onClick={onCerrar}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{titulo}</h5>
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
