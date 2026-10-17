import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  customFetch,
  setMemoryAccessToken,
  hasSessionIndicator,
  setSessionIndicator,
  clearSessionIndicator,
  SA_SESSION_KEY,
} from '../api/apiClient';
import type { UserProfile, AuthResponseData } from '../api/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => hasSessionIndicator());
  const initRanRef = useRef(false);

  const updateAccessToken = useCallback((token: string | null) => {
    setMemoryAccessToken(token);
    setAccessTokenState(token);
  }, []);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    // 0.2 : Ne pas appeler /api/auth/refresh au chargement si aucune session n'a existé (sa_session=1 absent)
    if (!hasSessionIndicator()) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const data = await customFetch<AuthResponseData>('/api/auth/refresh', {
          method: 'POST',
        });
        setSessionIndicator();
        updateAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          clearSessionIndicator();
          updateAccessToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [updateAccessToken]);

  // Synchronisation inter-onglets : la déconnexion dans un onglet supprime la session dans les autres
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SA_SESSION_KEY && event.newValue !== '1') {
        updateAccessToken(null);
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [updateAccessToken]);

  const login = async (email: string, password: string) => {
    const data = await customFetch<AuthResponseData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setSessionIndicator();
    updateAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (fullName: string, email: string, phoneNumber: string, password: string) => {
    await customFetch<UserProfile>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, phoneNumber, password }),
    });
  };

  const logout = useCallback(async () => {
    try {
      await customFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearSessionIndicator();
      updateAccessToken(null);
      setUser(null);
    }
  }, [updateAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
