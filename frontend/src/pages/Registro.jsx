import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extraerError } from '../utils/errores';
import Alerta from '../components/Alerta';
import PantallaAcceso from '../components/PantallaAcceso';

// Mismas reglas que validators/auth.validator.js
function validar({ nombre, email, password, confirmar }) {
  const e = {};
  const n = nombre.trim();
  if (n.length < 2) e.nombre = 'Ingresa tu nombre (mínimo 2 caracteres)';
  else if (n.length > 100) e.nombre = 'Máximo 100 caracteres';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Ingresa un correo válido';
  else if (email.trim().length > 150) e.email = 'Máximo 150 caracteres';
  if (password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres';
  else if (password.length > 72) e.password = 'Máximo 72 caracteres';
  if (confirmar !== password) e.confirmar = 'Las contraseñas no coinciden';
  return e;
}

export default function Registro() {
  const { user, registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
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
    const encontrados = validar(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    setError('');
    try {
      await registrar({ nombre: form.nombre.trim(), email: form.email.trim(), password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      const { mensaje, campos } = extraerError(err);
      setError(mensaje);
      setErrores(campos);
    } finally {
      setEnviando(false);
    }
  };

  const campo = (name, label, type = 'text', autoComplete) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <input
        id={name} name={name} type={type} autoComplete={autoComplete} required
        className={`form-control ${errores[name] ? 'is-invalid' : ''}`}
        value={form[name]} onChange={cambiar}
      />
      <div className="invalid-feedback">{errores[name]}</div>
    </div>
  );

  return (
    <PantallaAcceso titulo="Crear cuenta" subtitulo="Regístrate como cliente para reportar incidencias.">
      <Alerta onCerrar={() => setError('')}>{error}</Alerta>
      <form onSubmit={enviar} noValidate>
        {campo('nombre', 'Nombre completo', 'text', 'name')}
        {campo('email', 'Correo electrónico', 'email', 'email')}
        {campo('password', 'Contraseña', 'password', 'new-password')}
        {campo('confirmar', 'Confirmar contraseña', 'password', 'new-password')}
        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={enviando}>
          {enviando && <span className="spinner-border spinner-border-sm me-2" />}
          Crear cuenta
        </button>
      </form>
      <p className="text-center small mt-4 mb-0">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </PantallaAcceso>
  );
}
