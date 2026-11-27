import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from '../lib/api'
import { storeReservedCodes } from '../lib/drafts'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

/**
 * SEC-03 : L'Access Token JWT est conservé UNIQUEMENT en mémoire React (jamais écrit en sessionStorage).
 * Seul un indicateur non sensible ({ user, expiresAt }) est mémorisé dans sessionStorage pour déclencher
 * le rafraîchissement silencieux via le cookie HttpOnly (Path=/api/auth) au rechargement ou hors ligne.
 */
export const SESSION_KEY = 'samaadresse.session'

interface StoredSessionHint {
  token?: string
  expiresAt: string
  user: api.User
}

interface MemorySession {
  token: string | null
  expiresAt: string
  user: api.User
}

function readSession(): MemorySession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSessionHint
    if (!parsed?.user || !parsed?.expiresAt) return null
    return {
      token: parsed.token ?? null,
      expiresAt: parsed.expiresAt,
      user: parsed.user,
    }
  } catch {
    return null
  }
}

function writeSessionHint(session: MemorySession | null) {
  try {
    if (session) {
      // Ne jamais persister le jeton Bearer dans sessionStorage (protection XSS)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        expiresAt: session.expiresAt,
        user: session.user,
      }))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // Stockage indisponible (navigation privée stricte) : la session reste en mémoire.
  }
}

function isTokenFresh(expiresAt: string) {
  return new Date(expiresAt).getTime() > Date.now() + 15_000
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MemorySession | null>(readSession)
  const [status, setStatus] = useState<AuthStatus>(() => (readSession() ? 'checking' : 'anonymous'))

  const applySession = useCallback((next: MemorySession | null) => {
    writeSessionHint(next)
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
    const activeToken = session?.token ?? null
    applySession(null)
    await api.logoutSession(activeToken)
  }, [applySession, session?.token])

  // Au rechargement, on revérifie le jeton (ou on le rafraîchit silencieusement via le cookie HttpOnly).
  useEffect(() => {
    if (status !== 'checking' || !session) return
    let cancelled = false

    const verify = async () => {
      if (session.token && isTokenFresh(session.expiresAt)) {
        try {
          const user = await api.getCurrentUser(session.token)
          if (!cancelled) applySession({ ...session, user })
          return
        } catch (error: unknown) {
          if (cancelled) return
          if (!(error instanceof api.ApiError && error.status === 401)) {
            setStatus('authenticated')
            return
          }
        }
      }
      // Access token absent en mémoire ou expiré : rafraîchissement silencieux via cookie HttpOnly.
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

  // Pré-chargement discret du pool de codes réservés serveur (P1-02 : code hors ligne conservé après sync).
  useEffect(() => {
    if (status !== 'authenticated' || !session?.token || !session.user) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    let cancelled = false
    const token = session.token
    const userId = session.user.id
    void api.listReservedCodes(token)
      .then((codes) => {
        if (!cancelled && Array.isArray(codes) && codes.length > 0) {
          storeReservedCodes(userId, codes)
        }
      })
      .catch(() => {
        // Silencieux en cas de réseau absent ou tests unitaires sans mock reservations
      })
    return () => { cancelled = true }
  }, [status, session?.token, session?.user])

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
