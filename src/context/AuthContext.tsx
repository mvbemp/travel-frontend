import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getMe } from '../api/auth';

interface JwtUser {
  id: number;
  email: string;
  type: 'admin' | 'user' | 'super_admin';
  full_name?: string;
}

interface AuthContextType {
  token: string | null;
  user: JwtUser | null;
  isAdmin: boolean;
  initializing: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

function parseJwt(token: string): JwtUser | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem('token')
  );
  const [user, setUser] = useState<JwtUser | null>(
    () => {
      const t = localStorage.getItem('token');
      return t ? parseJwt(t) : null;
    }
  );
  const [initializing, setInitializing] = useState(() => !!localStorage.getItem('token'));

  const isAdmin = user?.type === 'admin' || user?.type === 'super_admin';

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem('token', t);
      setUser(parseJwt(t));
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const logout = () => setToken(null);

  useEffect(() => {
    if (!token) { setInitializing(false); return; }
    getMe()
      .then((data: JwtUser) => setUser(data))
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, initializing, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
