import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Tablero from './pages/Tablero';
import TicketDetalle from './pages/TicketDetalle';
import Colas from './pages/Colas';
import Usuarios from './pages/Usuarios';

// Diseño de las páginas internas: barra superior + contenido
function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function NoEncontrado() {
  return (
    <div className="container py-5 text-center">
      <h1 className="h3">Página no encontrada</h1>
      <Link to="/">Ir al tablero</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas protegidas: cualquier usuario autenticado */}
          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Tablero />} />
              <Route path="/tickets/:id" element={<TicketDetalle />} />

              <Route element={<RutaProtegida roles={['tecnico', 'admin']} />}>
                <Route path="/colas" element={<Colas />} />
              </Route>
              <Route element={<RutaProtegida roles={['admin']} />}>
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>
              <Route path="*" element={<NoEncontrado />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
