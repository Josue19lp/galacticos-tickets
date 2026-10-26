import { useCallback, useEffect, useState } from 'react';
import { usersApi } from '../services/recursos';
import { ROLES, fecha } from '../utils/formato';
import { extraerError } from '../utils/errores';
import { BadgeRol } from '../components/Badges';
import Alerta from '../components/Alerta';
import { EsqueletoTabla } from '../components/Esqueleto';

const VACIO = { nombre: '', email: '', password: '', rol: 'tecnico' };

function validar({ nombre, email, password }) {
  const e = {};
  if (nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Correo no válido';
  if (password.length < 8) e.password = 'Mínimo 8 caracteres';
  else if (password.length > 72) e.password = 'Máximo 72 caracteres';
  return e;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [rol, setRol] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setUsuarios(await usersApi.listar({ rol }));
      setError('');
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setCargando(false);
    }
  }, [rol]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: undefined });
  };

  const crear = async (e) => {
    e.preventDefault();
    const encontrados = validar(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      const nuevo = await usersApi.crear({ ...form, nombre: form.nombre.trim(), email: form.email.trim() });
      setAviso({ tipo: 'success', texto: `Usuario ${nuevo.nombre} creado como ${ROLES[nuevo.rol].etiqueta.toLowerCase()}.` });
      setForm(VACIO);
      cargar();
    } catch (err) {
      const { mensaje, campos } = extraerError(err);
      setAviso({ tipo: 'danger', texto: mensaje });
      setErrores(campos);
    } finally {
      setEnviando(false);
    }
  };

  const conteo = (r) => usuarios.filter((u) => u.rol === r).length;

  return (
    <div className="container-xl py-4">
      <div className="mb-4">
        <h1 className="titulo-pagina mb-1">Usuarios</h1>
        <p className="text-body-secondary small mb-0">Clientes, técnicos y administradores del sistema</p>
      </div>
      <div className="row g-3">
        <div className="col-lg-8">
          <section className="panel overflow-hidden">
            <div className="panel-cabecera justify-content-between">
              <div className="small text-body-secondary">
                {rol ? `${usuarios.length} ${ROLES[rol].etiqueta.toLowerCase()}(s)` :
                  `${usuarios.length} usuarios · ${conteo('admin')} admin · ${conteo('tecnico')} técnicos · ${conteo('cliente')} clientes`}
              </div>
              <select className="form-select w-auto" value={rol} onChange={(e) => setRol(e.target.value)} aria-label="Filtrar por rol">
                <option value="">Todos los roles</option>
                {Object.entries(ROLES).map(([v, r]) => <option key={v} value={v}>{r.etiqueta}</option>)}
              </select>
            </div>
            <div className={error ? 'px-3 pt-3' : ''}><Alerta onCerrar={() => setError('')}>{error}</Alerta></div>
            {cargando ? <EsqueletoTabla /> : (
              <div className="table-responsive">
                <table className="table align-middle mb-0 tabla">
                  <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registrado</th></tr></thead>
                  <tbody>
                    {usuarios.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-body-secondary py-4">No hay usuarios con ese rol.</td></tr>
                    )}
                    {usuarios.map((u) => (
                      <tr key={u.id}>
                        <td className="text-body-secondary numeros">{u.id}</td>
                        <td className="fw-semibold">{u.nombre}</td>
                        <td>{u.email}</td>
                        <td><BadgeRol valor={u.rol} /></td>
                        <td className="text-nowrap numeros">{fecha(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="col-lg-4">
          <section className="panel p-4">
            <div>
              <h2 className="panel-titulo mb-2">Crear usuario</h2>
              <p className="small text-body-secondary">El registro público solo crea clientes. Aquí puedes crear técnicos y administradores.</p>
              <Alerta tipo={aviso?.tipo} onCerrar={() => setAviso(null)} autoCerrar={6000}>{aviso?.texto}</Alerta>
              <form onSubmit={crear} noValidate>
                {[
                  ['nombre', 'Nombre', 'text'],
                  ['email', 'Correo', 'email'],
                  ['password', 'Contraseña temporal', 'password'],
                ].map(([name, label, type]) => (
                  <div className="mb-2" key={name}>
                    <label htmlFor={`u-${name}`} className="form-label small mb-1">{label}</label>
                    <input
                      id={`u-${name}`} name={name} type={type} required spellCheck={false}
                      autoComplete={name === 'password' ? 'new-password' : 'off'}
                      className={`form-control ${errores[name] ? 'is-invalid' : ''}`}
                      value={form[name]} onChange={cambiar}
                    />
                    <div className="invalid-feedback">{errores[name]}</div>
                  </div>
                ))}
                <div className="mb-3">
                  <label htmlFor="u-rol" className="form-label small mb-1">Rol</label>
                  <select id="u-rol" name="rol" className="form-select" value={form.rol} onChange={cambiar}>
                    {Object.entries(ROLES).map(([v, r]) => <option key={v} value={v}>{r.etiqueta}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
                  {enviando && <span className="spinner-border spinner-border-sm me-2" />}
                  Crear usuario
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
