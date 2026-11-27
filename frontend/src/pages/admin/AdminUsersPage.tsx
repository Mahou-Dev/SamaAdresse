import { Info, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminOnly } from './AdminOnly'

export function AdminUsersPage() {
  return (
    <AdminOnly>
      <main className="admin-page">
        <header className="admin-page__head">
          <h1>Utilisateurs</h1>
          <span>Administration des comptes</span>
        </header>
        <section className="admin-panel state">
          <Users aria-hidden="true" />
          <h2>Gestion des comptes non exposée par l’API actuelle</h2>
          <p className="admin-muted" style={{ maxWidth: '52ch' }}>
            <Info aria-hidden="true" className="inline-icon" /> Le backend Spring Boot expose actuellement la modération des signalements et la suspension/réactivation des adresses (<code>/api/admin/reports</code>, <code>/api/admin/addresses/&#123;id&#125;/suspend|reinstate</code>), mais pas encore de route d’énumération des utilisateurs.
          </p>
          <Link className="button button-primary" to="/admin/signalements">Accéder à la modération des signalements</Link>
        </section>
      </main>
    </AdminOnly>
  )
}
