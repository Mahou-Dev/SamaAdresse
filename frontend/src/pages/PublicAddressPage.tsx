import { ArrowLeft, Link2, QrCode, Share2, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AddressDetails } from '../components/AddressDetails'
import { PublicStates } from '../components/PublicStates'
import { ReportForm } from '../components/ReportForm'
import { RouteControls } from '../components/RouteControls'
import { publicAddressUrl, usePublicAddress } from '../hooks/usePublicAddress'
import { apiUrl } from '../lib/api'
import { copyText } from '../lib/clipboard'

export function PublicAddressPage() {
  const { code = '' } = useParams()
  const state = usePublicAddress(code)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [route, setRoute] = useState<Array<[number, number]>>()
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  if (state.kind !== 'ready') return <main className="app-page app-page--narrow page-standalone"><PublicStates state={state} /></main>

  const a = state.address
  const url = publicAddressUrl(a.publicCode)

  async function copy(text: string, done: string) {
    setFeedback(await copyText(text) ? done : 'Copie impossible : sélectionnez le texte manuellement.')
  }

  function copyLink() {
    void copy(url, 'Lien copié.')
  }

  async function share() {
    try {
      await navigator.share({ title: `SamaAdresse ${a.publicCode}`, text: `${a.title} — ${a.district}, ${a.city}`, url })
    } catch {
      // Partage annulé par la personne : aucun message nécessaire.
    }
  }

  return (
    <main className="app-page app-page--narrow page-standalone">
      <Link className="back-link" to="/recherche"><ArrowLeft aria-hidden="true" />Recherche</Link>
      {a.offlineCopyAt && (
        <p className="alert alert--warning offline-banner" role="status">
          <WifiOff aria-hidden="true" className="inline-icon" /> Hors ligne : copie de cette fiche enregistrée sur l’appareil le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(a.offlineCopyAt))}.
        </p>
      )}
      <AddressDetails
        address={{ ...a, photoUrl: a.photoUrl ? apiUrl(a.photoUrl) : null }}
        route={route}
        routeControls={<RouteControls code={a.publicCode} latitude={a.latitude} longitude={a.longitude} onRoute={setRoute} />}
        badge={<span className="status-badge status-badge--active">Adresse active</span>}
        actions={<>
          {canShare && <button className="button button-secondary" type="button" onClick={share}><Share2 aria-hidden="true" />Partager</button>}
          <button className="button button-secondary" type="button" onClick={copyLink}><Link2 aria-hidden="true" />Copier le lien</button>
          <button className="button button-secondary" type="button" onClick={() => copy(a.publicCode, 'Code copié.')}>Copier le code</button>
          <Link className="button button-primary" to={`/a/${encodeURIComponent(a.publicCode)}/partage`}><QrCode aria-hidden="true" />QR code</Link>
          {feedback && <span className="copy-feedback" role="status">{feedback}</span>}
        </>}
      />
      {a.ownerName && <p className="muted owner-line">Adresse enregistrée par {a.ownerName}.</p>}
      {!a.offlineCopyAt && <ReportForm code={a.publicCode} />}
    </main>
  )
}
