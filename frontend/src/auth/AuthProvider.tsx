import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from '../lib/api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

/**
 * Indicateur de session légère dans sessionStorage (le véritable Refresh Token reste dans un cookie HttpOnly
 * posé par Spring Boot sur /api/auth/refresh). Permet le rafraîchissement silencieux au rechargement et la
 * consultation du profil hors ligne.
 */
export const SESSION_KEY = 'samaadresse.session'

interface StoredSession {
  token: string
  expiresAt: string
  user: api.User
}

function readSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

function writeSession(session: StoredSession | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Stockage indisponible (navigation privée stricte) : la session reste en mémoire.
  }
}

function isTokenFresh(expiresAt: string) {
  return new Date(expiresAt).getTime() > Date.now() + 15_000
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(readSession)
  const [status, setStatus] = useState<AuthStatus>(() => (readSession() ? 'checking' : 'anonymous'))

  const applySession = useCallback((next: StoredSession | null) => {
    writeSession(next)
    setSession(next)
    setStatus(next ? 'authenticated' : 'anonymous')
  }, [])

  const fromResponse = useCallback((response: api.AuthResponse) => {
    applySession({
      token: response.accessToken,
      expiresAt: response.expiresAt,
      user: response.user,
    })
  }, [applySession])

  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const refreshed = await api.refreshSession()
      fromResponse(refreshed)
      return refreshed.accessToken
    } catch (error) {
      if (error instanceof api.ApiError && (error.status === 401 || error.status === 403)) {
        applySession(null)
      }
      return null
    }
  }, [applySession, fromResponse])

  const logout = useCallback(async () => {
    applySession(null)
    await api.logoutSession()
  }, [applySession])

  // Au rechargement, on revérifie le jeton (ou on le rafraîchit silencieusement via le cookie HttpOnly).
  useEffect(() => {
    if (status !== 'checking' || !session) return
    let cancelled = false

    const verify = async () => {
      if (isTokenFresh(session.expiresAt)) {
        try {
          const user = await api.getCurrentUser(session.token)
          if (!cancelled) applySession({ ...session, user })
          return
        } catch (error: unknown) {
          if (cancelled) return
          if (!(error instanceof api.ApiError && error.status === 401)) {
            // Hors ligne ou API momentanément injoignable : on garde la session locale.
            setStatus('authenticated')
            return
          }
        }
      }
      // Access token expiré ou refusé : tentative de rafraîchissement silencieux via le cookie HttpOnly.
      try {
        const refreshed = await api.refreshSession()
        if (!cancelled) fromResponse(refreshed)
      } catch (error: unknown) {
        if (cancelled) return
        if (error instanceof api.ApiError && (error.status === 401 || error.status === 403)) {
          applySession(null)
        } else {
          setStatus('authenticated')
        }
      }
    }

    void verify()
    return () => { cancelled = true }
  }, [status, session, applySession, fromResponse])

  // Rafraîchissement silencieux automatique 60 s avant l'expiration de l'Access Token (15 min côté serveur).
  useEffect(() => {
    if (!session) return
    const msBeforeExpiry = new Date(session.expiresAt).getTime() - Date.now()
    const delay = Math.max(msBeforeExpiry - 60_000, 5_000)
    const timer = window.setTimeout(() => {
      void refresh()
    }, delay)
    return () => window.clearTimeout(timer)
  }, [session, refresh])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    token: session?.token ?? null,
    expiresAt: session?.expiresAt ?? null,
    login: async (email, password) => fromResponse(await api.login({ email: email.trim(), password })),
    register: async (email, password, displayName, phoneNumber) =>
      fromResponse(await api.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
      })),
    logout,
    refresh,
  }), [status, session, fromResponse, logout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
