import { ArrowLeft, Copy, Eye, Info, QrCode } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AddressDetails } from '../components/AddressDetails'
import { OwnerManagePanel } from '../components/OwnerManagePanel'
import { OwnerPhotoPanel } from '../components/OwnerPhotoPanel'
import { StatusBadge } from '../components/StatusBadge'
import { StatusTimeline } from '../components/StatusTimeline'
import { useApiResource } from '../hooks/useApiResource'
import { apiUrl, getMyAddress, type OwnerAddress } from '../lib/api'
import { copyText } from '../lib/clipboard'
import { formatDate, visibilityLabel } from '../lib/labels'

export function MyAddressDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navState = location.state as { justCreated?: boolean; provisionalCode?: string; photoError?: string | null } | null
  const justCreated = navState?.justCreated === true
  const { state } = useApiResource((token) => getMyAddress(token, id), [id])
  const [updated, setUpdated] = useState<OwnerAddress | null>(null)
  const [photoVersion, setPhotoVersion] = useState(0)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle')

  async function copyCode(code: string) {
    setCopied(await copyText(code) ? 'ok' : 'failed')
  }

  if (state.kind === 'loading') return <main className="app-page"><p className="loading" role="status">Chargement…</p></main>
  if (state.kind === 'error' && (state.status === 404 || state.status === 400)) {
    return (
      <main className="app-page">
        <section className="panel state">
          <h1>Adresse introuvable</h1>
          <p>Cette adresse n’existe pas ou ne vous appartient pas.</p>
          <Link className="button button-primary" to="/mes-adresses">Retour à mes adresses</Link>
        </section>
      </main>
    )
  }
  if (state.kind === 'error') return <main className="app-page"><p className="alert alert--error" role="alert">{state.message}</p></main>

  const a = updated?.id === id ? updated : state.data
  const code = encodeURIComponent(a.publicCode)
  const resolvedPhotoUrl = a.photoUrl
    ? `${apiUrl(a.photoUrl)}${photoVersion > 0 ? `?v=${photoVersion}` : ''}`
    : null

  return (
    <main className="app-page app-page--narrow">
      <Link className="back-link" to="/mes-adresses"><ArrowLeft aria-hidden="true" />Mes adresses</Link>
      {justCreated && (
        <p className="alert alert--success" role="status">
          Adresse enregistrée et active avec le code définitif <strong>{a.publicCode}</strong>.
          {a.codeChanged && a.previousCode && (
            <> Le code provisoire {a.previousCode} a été remplacé par ce code définitif.</>
          )}
        </p>
      )}
      {justCreated && navState?.photoError && <p className="alert alert--warning" role="alert">La photo n’a pas pu être envoyée ({navState.photoError}). Vous pouvez la réessayer ci-dessous.</p>}
      <AddressDetails
        address={{ ...a, photoUrl: resolvedPhotoUrl }}
        badge={<StatusBadge status={a.status} />}
        actions={<>
          <button className="button button-secondary" type="button" onClick={() => copyCode(a.publicCode)}><Copy aria-hidden="true" />Copier le code</button>
          {a.publiclyAccessible ? (
            <>
              <Link className="button button-secondary" to={`/a/${code}`}><Eye aria-hidden="true" />Fiche publique</Link>
              <Link className="button button-primary" to={`/a/${code}/partage`}><QrCode aria-hidden="true" />QR code et partage</Link>
            </>
          ) : (
            <p className="address-sheet__hint"><Info aria-hidden="true" />Le lien public et le QR code sont désactivés tant que l’adresse n’est pas active.</p>
          )}
          {copied === 'ok' && <span className="copy-feedback" role="status">Code copié.</span>}
          {copied === 'failed' && <span className="copy-feedback copy-feedback--error" role="alert">Copie impossible : sélectionnez le code manuellement.</span>}
        </>}
      />
      <OwnerPhotoPanel address={a} currentUrl={resolvedPhotoUrl} onChanged={(next) => { setUpdated(next); setPhotoVersion((v) => v + 1) }} />
      <OwnerManagePanel key={`${a.id}-${a.status}`} address={a} onChanged={setUpdated} />
      <section className="panel owner-facts" aria-labelledby="follow-title">
        <h2 className="panel-title" id="follow-title">Suivi de l’adresse</h2>
        <StatusTimeline address={a} />
        <dl>
          <div><dt>Visibilité</dt><dd>{visibilityLabel(a)}</dd></div>
          <div><dt>Zone · Quartier</dt><dd>{a.city} ({a.zone}) · {a.district} ({a.quartier})</dd></div>
          <div><dt>Créée le</dt><dd>{formatDate(a.createdAt)}</dd></div>
        </dl>
        {a.status === 'SUSPENDED' && (
          <p className="alert alert--warning">{a.moderationNotice || 'Cette adresse a été suspendue par la modération.'}</p>
        )}
      </section>
    </main>
  )
}
