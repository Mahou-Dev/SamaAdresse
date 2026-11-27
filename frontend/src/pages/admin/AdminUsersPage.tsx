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
          <p className="admin-muted admin-note">
            <Info aria-hidden="true" className="inline-icon" /> Le backend Spring Boot expose la modération des signalements, le registre complet des adresses et le journal d’audit (<code>/api/admin/reports</code>, <code>/api/admin/addresses</code>, <code>/api/admin/actions</code>), mais pas de route d’énumération des utilisateurs (principe de minimisation des données personnelles).
          </p>
          <Link className="button button-primary" to="/admin/signalements">Accéder à la modération des signalements</Link>
        </section>
      </main>
    </AdminOnly>
  )
}
