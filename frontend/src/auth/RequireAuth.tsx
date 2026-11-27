import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'

/**
 * Redirige vers la connexion si aucune session n'est ouverte.
 * Confort d'interface uniquement : la vraie protection est le contrôle d'accès du backend.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return <p className="page-loading" role="status">Vérification de votre session…</p>
  }
  if (status === 'anonymous') {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
