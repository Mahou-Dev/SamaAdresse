import { Archive, CircleCheck, CirclePlus, Flag, Globe, MapPinned, Search, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { AddressRow } from '../components/AddressRow'
import { AddressMap } from '../components/map/AddressMap'
import { StatCard } from '../components/StatCard'
import { useApiResource } from '../hooks/useApiResource'
import { listAllMyAddresses } from '../lib/api'
import { countByStatus, toMapAddress } from '../lib/addressViews'

export function DashboardPage() {
  const { user } = useAuth()
  const { state } = useApiResource((token) => listAllMyAddresses(token), [])
  const firstName = user?.displayName.split(' ')[0] ?? ''

  return (
    <main className="app-page">
      <div className="app-page__head">
        <div>
          <h1>Bonjour {firstName}</h1>
          <p className="muted">Bienvenue sur SamaAdresse !</p>
        </div>
        <div className="app-page__actions">
          <Link className="button button-secondary" to="/recherche"><Search aria-hidden="true" />Rechercher</Link>
          <Link className="button button-primary" to="/mes-adresses/nouvelle"><CirclePlus aria-hidden="true" />Créer une adresse</Link>
        </div>
      </div>

      {state.kind === 'loading' && <p className="loading" role="status">Chargement de vos adresses…</p>}
      {state.kind === 'error' && <p className="alert alert--error" role="alert">{state.message}</p>}
      {state.kind === 'ready' && (() => {
        const items = state.data
        const total = items.length
        const counts = countByStatus(items)
        const latest = items.slice(0, 3)
        return (
          <>
            <div className="stat-grid">
              <StatCard icon={MapPinned} tone="blue" value={total} label="Mes adresses" />
              <StatCard icon={CircleCheck} tone="green" value={counts.active} label="Actives" />
              <StatCard icon={Globe} tone="amber" value={counts.listedOnes} label="Dans l’annuaire" />
              <StatCard icon={counts.suspended > 0 ? ShieldAlert : Archive} tone="red" value={counts.suspended + counts.archived} label={counts.suspended > 0 ? 'Suspendues / archivées' : 'Archivées'} />
            </div>
            {total > 0 && (
              <ul className="dashboard-notes">
                <li><Globe aria-hidden="true" /><span><strong>{counts.publicOnes}</strong> adresse{counts.publicOnes > 1 ? 's' : ''} consultable{counts.publicOnes > 1 ? 's' : ''} immédiatement par code, lien ou QR code</span></li>
                {counts.signaled > 0 && <li><Flag aria-hidden="true" /><span><strong>{counts.signaled}</strong> signalée{counts.signaled > 1 ? 's' : ''} : un examen de modération est en cours</span></li>}
                {counts.suspended > 0 && <li className="dashboard-notes__warn"><ShieldAlert aria-hidden="true" /><span><strong>{counts.suspended}</strong> suspendue{counts.suspended > 1 ? 's' : ''} par la modération : ouvrez la fiche pour consulter le motif</span></li>}
              </ul>
            )}

            {total === 0 ? (
              <section className="panel state">
                <MapPinned aria-hidden="true" />
                <h2>Aucune adresse pour le moment</h2>
                <p>Créez votre première adresse pour obtenir immédiatement un code SamaAdresse à partager.</p>
                <Link className="button button-primary" to="/mes-adresses/nouvelle"><CirclePlus aria-hidden="true" />Créer ma première adresse</Link>
              </section>
            ) : (
              <section className="dashboard-map" aria-label="Carte de mes adresses">
                <div className="map-frame dashboard-map__frame">
                  <AddressMap addresses={items.map(toMapAddress)} label="Carte de mes adresses" />
                </div>
                <aside className="dashboard-map__panel">
                  <h2 className="panel-title"><MapPinned aria-hidden="true" />Mes dernières adresses</h2>
                  <div className="dashboard-map__list">
                    {latest.map((address) => <AddressRow key={address.id} address={address} compact />)}
                  </div>
                  <Link className="text-link" to="/mes-adresses">Voir tout</Link>
                </aside>
              </section>
            )}
          </>
        )
      })()}
    </main>
  )
}
