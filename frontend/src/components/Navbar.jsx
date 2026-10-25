import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/formato';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const salir = async () => {
    await logout();
    navigate('/login');
  };

  const enlaces = [
    { a: '/', texto: 'Tablero', roles: ['admin', 'tecnico', 'cliente'] },
    { a: '/colas', texto: 'Colas', roles: ['admin', 'tecnico'] },
    { a: '/usuarios', texto: 'Usuarios', roles: ['admin'] },
  ].filter((e) => e.roles.includes(user.rol));

  return (
    <nav className="navbar navbar-expand-md navbar-dark barra">
      <div className="container-xl">
        <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>
            Galacticos <span className="fw-light">Soporte</span>
          </span>
        </NavLink>
        <button className="navbar-toggler" type="button" aria-label="Menú" onClick={() => setAbierto(!abierto)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${abierto ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto">
            {enlaces.map((e) => (
              <li className="nav-item" key={e.a}>
                <NavLink className="nav-link" to={e.a} end onClick={() => setAbierto(false)}>
                  {e.texto}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-3 py-2 py-md-0">
            <span className="avatar-usuario" aria-hidden="true">
              {user.nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')}
            </span>
            <div className="text-white small lh-sm">
              <div className="fw-semibold">{user.nombre}</div>
              <div className="rol-usuario">{ROLES[user.rol]?.etiqueta}</div>
            </div>
            <button className="btn btn-sm btn-salir" onClick={salir}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}