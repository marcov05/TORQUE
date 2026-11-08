import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../services/api';
import { TOKEN_KEY } from '../services/http';
import type { User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await authApi.profile();
    setUser(profile);
    return profile;
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const response = await authApi.login(email, senha);
    window.localStorage.setItem(TOKEN_KEY, response.token);
    setUser(response.user);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('torque:unauthorized', onUnauthorized);
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
    } else {
      void refreshUser().catch(logout).finally(() => setIsLoading(false));
    }
    return () => window.removeEventListener('torque:unauthorized', onUnauthorized);
  }, [logout, refreshUser]);

  const value = useMemo(() => ({ user, isAuthenticated: user !== null, isLoading, login, logout, refreshUser }), [user, isLoading, login, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return context;
}
