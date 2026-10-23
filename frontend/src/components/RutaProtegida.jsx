import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Cargando from './Cargando';

// Uso: <Route element={<RutaProtegida roles={['admin']} />}> ... </Route>
// Sin "roles" basta con haber iniciado sesión.
export default function RutaProtegida({ roles }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando texto="Recuperando sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}
