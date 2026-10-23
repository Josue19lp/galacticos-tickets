import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extraerError } from '../utils/errores';
import Alerta from '../components/Alerta';
import PantallaAcceso from '../components/PantallaAcceso';

// Usuarios del seed.sql, solo visibles en desarrollo para agilizar la demo
const DEMO = [
  { email: 'admin@galacticos.test', rol: 'Admin' },
  { email: 'carlos@galacticos.test', rol: 'Técnico' },
  { email: 'cliente@galacticos.test', rol: 'Cliente' },
];

export default function Login() {
  const { user, login, sesionExpirada } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
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
            id="email" name="email" type="email" autoComplete="email" required autoFocus
            className={`form-control ${errores.email ? 'is-invalid' : ''}`}
            value={form.email} onChange={cambiar}
          />
          <div className="invalid-feedback">{errores.email}</div>
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">Contraseña</label>
          <input
            id="password" name="password" type="password" autoComplete="current-password" required
            className={`form-control ${errores.password ? 'is-invalid' : ''}`}
            value={form.password} onChange={cambiar}
          />
          <div className="invalid-feedback">{errores.password}</div>
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando && <span className="spinner-border spinner-border-sm me-2" />}
          Entrar
        </button>
      </form>

      <p className="text-center small mt-4 mb-0">
        ¿No tienes cuenta? <Link to="/registro">Regístrate como cliente</Link>
      </p>

      {import.meta.env.DEV && (
        <div className="mt-4 pt-3 border-top">
          <p className="small text-body-secondary mb-2">Usuarios de prueba (contraseña <code>Galacticos2026</code>):</p>
          <div className="d-flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email} type="button" className="btn btn-sm btn-outline-secondary"
                onClick={() => setForm({ email: d.email, password: 'Galacticos2026' })}
              >
                {d.rol}
              </button>
            ))}
          </div>
        </div>
      )}
    </PantallaAcceso>
  );
}
