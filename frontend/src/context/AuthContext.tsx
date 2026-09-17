import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  customFetch,
  setMemoryAccessToken,
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
  const [loading, setLoading] = useState<boolean>(true);

  const updateAccessToken = (token: string | null) => {
    setMemoryAccessToken(token);
    setAccessTokenState(token);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await customFetch<AuthResponseData>('/api/auth/refresh', {
          method: 'POST',
        });
        updateAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        updateAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await customFetch<AuthResponseData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

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
      updateAccessToken(null);
      setUser(null);
    }
  }, []);

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
