import { CirclePlus, CloudOff, Map as MapIcon, MapPinned, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AddressRow } from '../components/AddressRow'
import { useApiResource } from '../hooks/useApiResource'
import { useDrafts } from '../hooks/useDrafts'
import { listMyAddresses } from '../lib/api'
import { visibilityLabel } from '../lib/labels'

export function MyAddressesPage() {
  const [page, setPage] = useState(0)
  const location = useLocation()
  const draftSaved = (location.state as { draftSaved?: string } | null)?.draftSaved
  const drafts = useDrafts()
  const syncedCount = drafts.report?.synced.length ?? 0
  const { state } = useApiResource((token) => listMyAddresses(token, page), [page, syncedCount])

  return (
    <main className="app-page">
      <div className="app-page__head">
        <div>
          <h1>Mes adresses</h1>
          <p className="muted">Chaque adresse active dispose d’un code immuable, d’un lien de partage et d’un QR code.</p>
        </div>
        <div className="app-page__actions">
          <Link className="button button-secondary" to="/carte"><MapIcon aria-hidden="true" />Voir sur la carte</Link>
          <Link className="button button-primary" to="/mes-adresses/nouvelle"><CirclePlus aria-hidden="true" />Créer une adresse</Link>
        </div>
      </div>

      {draftSaved && drafts.drafts.length > 0 && (
        <p className="alert alert--warning" role="status">Pas de connexion : l’adresse est gardée sur cet appareil avec le code provisoire <strong>{draftSaved}</strong>. Elle sera envoyée automatiquement au retour du réseau.</p>
      )}
      {drafts.drafts.length > 0 && (
        <section className="panel drafts" aria-labelledby="drafts-title">
          <div className="drafts__head">
            <h2 className="panel-title" id="drafts-title"><CloudOff aria-hidden="true" />En attente de synchronisation ({drafts.drafts.length})</h2>
            <button className="button button-primary button-sm" type="button" onClick={() => void drafts.sync()} disabled={drafts.syncing}>
              <RefreshCw aria-hidden="true" />{drafts.syncing ? 'Envoi…' : 'Synchroniser maintenant'}
            </button>
          </div>
          {drafts.report?.offline && <p className="alert alert--warning" role="status">Toujours hors connexion : nouvel essai au retour du réseau.</p>}
          <ul className="drafts__list">
            {drafts.drafts.map((d) => (
              <li key={d.id}>
                <span>
                  <strong>{d.provisionalCode} <em>provisoire</em></strong>
                  <small>{d.input.title}{d.photo ? ' · photo jointe' : ''}</small>
                  {d.lastError && <small className="field-error">Refusée par le serveur : {d.lastError}</small>}
                </span>
                <button className="icon-button icon-button--light" type="button" aria-label={`Supprimer le brouillon ${d.provisionalCode}`} onClick={() => void drafts.remove(d.id)}><Trash2 /></button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {drafts.report && drafts.report.synced.length > 0 && (
        <p className="alert alert--success" role="status">
          {drafts.report.synced.length} adresse{drafts.report.synced.length > 1 ? 's' : ''} synchronisée{drafts.report.synced.length > 1 ? 's' : ''} : {drafts.report.synced.map((a) => a.publicCode).join(', ')} (codes définitifs).
        </p>
      )}
      {state.kind === 'loading' && <p className="loading" role="status">Chargement de vos adresses…</p>}
      {state.kind === 'error' && <p className="alert alert--error" role="alert">{state.message}</p>}
      {state.kind === 'ready' && state.data.totalElements === 0 && (
        <section className="panel state">
          <MapPinned aria-hidden="true" />
          <h2>Aucune adresse pour le moment</h2>
          <p>Créez votre première adresse pour obtenir un code à partager.</p>
          <Link className="button button-primary" to="/mes-adresses/nouvelle">Créer ma première adresse</Link>
        </section>
      )}
      {state.kind === 'ready' && state.data.totalElements > 0 && (
        <section className="panel panel--flush">
          <p className="list-count">{state.data.totalElements} adresse{state.data.totalElements > 1 ? 's' : ''}</p>
          <ul className="address-list">
            {state.data.items.map((address) => (
              <li key={address.id}>
                <AddressRow address={address} />
                <p className="address-list__visibility">{visibilityLabel(address)}</p>
              </li>
            ))}
          </ul>
          {state.data.totalPages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="button button-secondary button-sm" type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
              <span>Page {page + 1} sur {state.data.totalPages}</span>
              <button className="button button-secondary button-sm" type="button" disabled={page + 1 >= state.data.totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
            </nav>
          )}
        </section>
      )}
    </main>
  )
}
