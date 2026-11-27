import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/authContext'

/** Confort d'interface seulement : le backend renverrait 403 de toute façon. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') {
    return (
      <main className="admin-page">
        <section className="admin-panel state">
          <ShieldAlert aria-hidden="true" />
          <h1>Accès réservé aux administrateurs</h1>
          <p>Votre compte n’a pas le rôle administrateur.</p>
        </section>
      </main>
    )
  }
  return <>{children}</>
}
