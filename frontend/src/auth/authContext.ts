import { createContext, useContext } from 'react'
import type { User } from '../lib/api'

export type AuthStatus = 'checking' | 'anonymous' | 'authenticated'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  token: string | null
  expiresAt: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string, phoneNumber: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
  return value
}
