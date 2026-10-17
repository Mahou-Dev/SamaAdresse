import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  customFetch,
  refreshAuth,
  setMemoryAccessToken,
  hasSessionIndicator,
  setSessionIndicator,
  clearSessionIndicator,
  SA_SESSION_KEY,
} from '../api/apiClient';
import type { UserProfile, AuthResponseData } from '../api/apiClient';
import { syncManager } from '../utils/syncManager';

export const SA_OFFLINE_USER_KEY = 'sa_offline_user';

export interface OfflineUserData {
  userId: string;
  displayName: string;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isOfflineAuth: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isOfflineAuth, setIsOfflineAuth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const initRanRef = useRef(false);

  const updateAccessToken = useCallback((token: string | null) => {
    setMemoryAccessToken(token);
    setAccessTokenState(token);
  }, []);

  const restoreOfflineUser = useCallback(() => {
    try {
      const stored = localStorage.getItem(SA_OFFLINE_USER_KEY);
      if (stored) {
        const parsed: OfflineUserData = JSON.parse(stored);
        if (parsed?.userId) {
          setUser({
            id: parsed.userId,
            fullName: parsed.displayName || 'Utilisateur',
            email: '',
            phoneNumber: '',
            role: 'PROPRIETAIRE',
            enabled: true,
            createdAt: '',
          });
          setIsOfflineAuth(true);
          return true;
        }
      }
    } catch {
      // ignore parse errors
    }
    return false;
  }, []);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    // Initialiser le moteur de synchronisation
    syncManager.init();

    // 0.2 : Si aucune session n'a existé
    if (!hasSessionIndicator()) {
      // Vérifier si un utilisateur hors ligne est enregistré
      const restored = restoreOfflineUser();
      if (!restored) {
        setLoading(false);
        return;
      }
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const data = await refreshAuth();
        if (!data) throw new Error('Refresh failed');
        setSessionIndicator();
        updateAccessToken(data.accessToken);
        setUser(data.user);
        setIsOfflineAuth(false);

        try {
          localStorage.setItem(
            SA_OFFLINE_USER_KEY,
            JSON.stringify({ userId: data.user.id, displayName: data.user.fullName })
          );
        } catch {
          // ignore storage error
        }

        // Tenter de rafraîchir les codes réservés
        syncManager.refreshReservedCodes();
      } catch {
        const restored = restoreOfflineUser();
        if (!restored && (typeof navigator === 'undefined' || navigator.onLine)) {
          clearSessionIndicator();
          updateAccessToken(null);
          setUser(null);
          setIsOfflineAuth(false);
        }
      } finally {
        setLoading(false);
      }
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      restoreOfflineUser();
      setLoading(false);
    } else {
      initAuth();
    }

    const handleOnline = () => {
      if (hasSessionIndicator()) {
        initAuth();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [updateAccessToken, restoreOfflineUser]);

  // Synchronisation inter-onglets : la déconnexion dans un onglet supprime la session dans les autres
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SA_SESSION_KEY && event.newValue !== '1') {
        updateAccessToken(null);
        setUser(null);
        setIsOfflineAuth(false);
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
    setIsOfflineAuth(false);

    try {
      localStorage.setItem(
        SA_OFFLINE_USER_KEY,
        JSON.stringify({ userId: data.user.id, displayName: data.user.fullName })
      );
    } catch {
      // ignore
    }

    // Réapprovisionner les codes réservés pour capture hors ligne
    syncManager.refreshReservedCodes();
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
      setIsOfflineAuth(false);
      try {
        localStorage.removeItem(SA_OFFLINE_USER_KEY);
      } catch {
        // ignore
      }
    }
  }, [updateAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: (!!user && !!accessToken) || (!!user && isOfflineAuth),
        isOfflineAuth,
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
