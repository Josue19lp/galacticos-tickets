import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extraerError } from '../utils/errores';
import Alerta from '../components/Alerta';
import PantallaAcceso from '../components/PantallaAcceso';

// Solo se recuerda el CORREO en el navegador, nunca la contraseña
const CLAVE_CORREO = 'galacticos_correo_recordado';

function leerCorreoGuardado() {
  try {
    return localStorage.getItem(CLAVE_CORREO) || '';
  } catch {
    return ''; // navegación privada o almacenamiento bloqueado
  }
}

function guardarCorreo(email, recordar) {
  try {
    if (recordar) localStorage.setItem(CLAVE_CORREO, email);
    else localStorage.removeItem(CLAVE_CORREO);
  } catch {
    /* si el navegador no lo permite, simplemente no se recuerda */
  }
}

// Íconos del ojito (SVG en línea, sin librerías extra)
const OjoAbierto = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const OjoCerrado = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const { user, login, sesionExpirada } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const correoGuardado = leerCorreoGuardado();
  const [form, setForm] = useState({ email: correoGuardado, password: '' });
  const [recordar, setRecordar] = useState(Boolean(correoGuardado));
  const [verPassword, setVerPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: undefined });
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) encontrados.email = 'Ingresa un correo válido';
    if (!form.password) encontrados.password = 'Ingresa tu contraseña';
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    setError('');
    try {
      await login(form.email.trim(), form.password);
      guardarCorreo(form.email.trim(), recordar); // solo si el login fue correcto
      navigate(location.state?.desde || '/', { replace: true });
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PantallaAcceso titulo="Iniciar sesión" subtitulo="Reporta y da seguimiento a tus incidencias técnicas.">
      {sesionExpirada && !error && (
        <Alerta tipo="warning">Tu sesión expiró. Vuelve a iniciar sesión.</Alerta>
      )}
      <Alerta onCerrar={() => setError('')}>{error}</Alerta>

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Correo electrónico</label>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            autoFocus={!correoGuardado}
            className={`form-control ${errores.email ? 'is-invalid' : ''}`}
            value={form.email} onChange={cambiar}
          />
          <div className="invalid-feedback">{errores.email}</div>
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Contraseña</label>
          <div className={`input-group ${errores.password ? 'has-validation' : ''}`}>
            <input
              id="password" name="password" type={verPassword ? 'text' : 'password'}
              autoComplete="current-password" required autoFocus={Boolean(correoGuardado)}
              className={`form-control ${errores.password ? 'is-invalid' : ''}`}
              value={form.password} onChange={cambiar}
            />
            <button
              type="button"
              className="btn btn-outline-secondary btn-ojo"
              onClick={() => setVerPassword(!verPassword)}
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verPassword ? <OjoCerrado /> : <OjoAbierto />}
            </button>
            <div className="invalid-feedback">{errores.password}</div>
          </div>
        </div>

        <div className="form-check mb-4">
          <input
            id="recordar" type="checkbox" className="form-check-input"
            checked={recordar} onChange={(e) => setRecordar(e.target.checked)}
          />
          <label htmlFor="recordar" className="form-check-label">Recordar mi correo</label>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando && <span className="spinner-border spinner-border-sm me-2" />}
          Entrar
        </button>
      </form>

      <p className="text-center small mt-4 mb-0">
        ¿No tienes cuenta? <Link to="/registro">Regístrate como cliente</Link>
      </p>
    </PantallaAcceso>
  );
}