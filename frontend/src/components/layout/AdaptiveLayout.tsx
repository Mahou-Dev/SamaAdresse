import { useAuth } from '../../auth/authContext'
import { AppLayout } from './AppLayout'
import { PublicLayout } from './PublicLayout'

/** Pages accessibles à tous (recherche, fiche publique) : affichées dans l'espace personnel si connecté. */
export function AdaptiveLayout() {
  const { status } = useAuth()
  return status === 'authenticated' ? <AppLayout /> : <PublicLayout />
}
