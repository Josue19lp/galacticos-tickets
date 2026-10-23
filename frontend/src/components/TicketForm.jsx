import { useState } from 'react';
import { PRIORIDADES } from '../utils/formato';
import { extraerError } from '../utils/errores';
import Alerta from './Alerta';

// Mismas reglas que el esquema Joi del backend (validators/ticket.validator.js)
function validar({ titulo, descripcion, prioridad }) {
  const e = {};
  const t = titulo.trim();
  const d = descripcion.trim();
  if (!t) e.titulo = 'El título es obligatorio';
  else if (t.length < 5) e.titulo = 'Mínimo 5 caracteres';
  else if (t.length > 150) e.titulo = 'Máximo 150 caracteres';
  if (!d) e.descripcion = 'Describe el problema';
  else if (d.length < 10) e.descripcion = 'Mínimo 10 caracteres';
  else if (d.length > 5000) e.descripcion = 'Máximo 5000 caracteres';
  if (!PRIORIDADES.some((p) => p.valor === prioridad)) e.prioridad = 'Elige una prioridad';
  return e;
}

/**
 * Formulario para crear o editar un ticket.
 * - inicial: valores iniciales (al editar)
 * - onGuardar(datos): debe devolver una promesa; si falla se muestran los errores del backend
 */
export default function TicketForm({ inicial, onGuardar, onCancelar, textoBoton = 'Crear ticket' }) {
  const [form, setForm] = useState({
    titulo: inicial?.titulo || '',
    descripcion: inicial?.descripcion || '',
    prioridad: inicial?.prioridad || 'media',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: undefined });
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    setErrorGeneral('');
    try {
      await onGuardar({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
      });
    } catch (err) {
      const { mensaje, campos } = extraerError(err);
      setErrorGeneral(mensaje);
      setErrores(campos);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate>
      <Alerta onCerrar={() => setErrorGeneral('')}>{errorGeneral}</Alerta>

      <div className="mb-3">
        <label htmlFor="titulo" className="form-label">Título</label>
        <input
          id="titulo" name="titulo" className={`form-control ${errores.titulo ? 'is-invalid' : ''}`}
          value={form.titulo} onChange={cambiar} required minLength={5} maxLength={150}
          placeholder="Ej. No puedo acceder al correo corporativo" autoFocus
        />
        <div className="invalid-feedback">{errores.titulo}</div>
      </div>

      <div className="mb-3">
        <label htmlFor="descripcion" className="form-label">Descripción</label>
        <textarea
          id="descripcion" name="descripcion" rows={5}
          className={`form-control ${errores.descripcion ? 'is-invalid' : ''}`}
          value={form.descripcion} onChange={cambiar} required minLength={10} maxLength={5000}
          placeholder="¿Qué pasó? ¿Desde cuándo? ¿Qué mensaje de error aparece?"
        />
        <div className="d-flex justify-content-between">
          <div className="invalid-feedback d-block">{errores.descripcion}</div>
          <small className="text-body-secondary text-nowrap">{form.descripcion.length}/5000</small>
        </div>
      </div>

      <fieldset className="mb-4">
        <legend className="form-label fs-6">Prioridad</legend>
        <div className="btn-group w-100" role="group">
          {PRIORIDADES.map((p) => (
            <span key={p.valor} className="flex-fill d-flex">
              <input
                type="radio" className="btn-check" name="prioridad" id={`prio-${p.valor}`}
                value={p.valor} checked={form.prioridad === p.valor} onChange={cambiar}
              />
              <label className={`btn btn-outline-${p.color} flex-fill`} htmlFor={`prio-${p.valor}`}>
                {p.etiqueta}
              </label>
            </span>
          ))}
        </div>
        {errores.prioridad && <div className="invalid-feedback d-block">{errores.prioridad}</div>}
      </fieldset>

      <div className="d-flex justify-content-end gap-2">
        {onCancelar && (
          <button type="button" className="btn btn-light" onClick={onCancelar}>Cancelar</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando && <span className="spinner-border spinner-border-sm me-2" />}
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
