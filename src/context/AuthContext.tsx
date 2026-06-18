import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api, { tokenStore, errMsg } from '../lib/api';
import type { AdminMe } from '../types';

interface AuthState {
  admin: AdminMe | null;
  loading: boolean; // initial token check in flight
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);

  // On boot, if we already hold a token, confirm it still maps to an admin.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<AdminMe>('/admin/me')
      .then(({ data }) => {
        if (data.isAdmin) setAdmin(data);
        else tokenStore.clear();
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    // Single admin sign-in: backend accepts the hard-coded super admin or a
    // DB user with is_admin, and returns a working token + admin identity.
    try {
      const { data } = await api.post<{ token: string; admin: AdminMe }>('/admin/login', {
        email,
        password,
      });
      if (!data?.token) throw new Error('Giriş başarısız.');
      tokenStore.set(data.token);
      setAdmin(data.admin);
    } catch (e) {
      tokenStore.clear();
      setAdmin(null);
      throw new Error(errMsg(e, 'Giriş başarısız.'));
    }
  };

  const logout = () => {
    tokenStore.clear();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
