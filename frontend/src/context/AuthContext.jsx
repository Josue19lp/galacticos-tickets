import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onSesionExpirada, refrescarToken, setAccessToken } from '../services/api';
import { authApi } from '../services/recursos';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true); // mientras se intenta recuperar la sesión
  const [sesionExpirada, setSesionExpirada] = useState(false);

  // Al abrir o recargar la app, la cookie httpOnly del refresh token permite recuperar la sesión
  useEffect(() => {
    refrescarToken()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setCargando(false));

    onSesionExpirada(() => {
      setUser(null);
      setSesionExpirada(true);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.accessToken);
    setSesionExpirada(false);
    setUser(data.user);
    return data.user;
  }, []);

  // El registro solo crea al usuario; después se inicia sesión con las mismas credenciales
  const registrar = useCallback(
    async ({ nombre, email, password }) => {
      await authApi.registro({ nombre, email, password });
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* aunque falle, se limpia la sesión local */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, cargando, sesionExpirada, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
