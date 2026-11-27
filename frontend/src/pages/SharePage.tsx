import { ArrowLeft, Copy, Download, MessageSquare, Printer, Share2 } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LocalLinkWarning } from '../components/LocalLinkWarning'
import { PublicStates } from '../components/PublicStates'
import { publicAddressUrl, usePublicAddress } from '../hooks/usePublicAddress'
import { copyText } from '../lib/clipboard'

const QR_OPTIONS = { errorCorrectionLevel: 'M' as const, margin: 2, color: { dark: '#071a33', light: '#ffffff' } }

export function SharePage() {
  const { code = '' } = useParams()
  const state = usePublicAddress(code)
  const [svg, setSvg] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const address = state.kind === 'ready' ? state.address : null
  const url = address ? publicAddressUrl(address.publicCode) : ''

  // Le QR code n'est généré qu'après confirmation par l'API que l'adresse est publique.
  useEffect(() => {
    if (!url) return
    let cancelled = false
    QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' })
      .then((markup) => { if (!cancelled) setSvg(markup) })
      .catch(() => { if (!cancelled) setSvg(null) })
    return () => { cancelled = true }
  }, [url])

  if (!address) return <main className="app-page app-page--narrow page-standalone"><PublicStates state={state as Exclude<typeof state, { kind: 'ready' }>} /></main>

  const message = `Voici mon adresse SamaAdresse ${address.publicCode} (${address.title}, ${address.district}) : ${url}`

  async function copy(text: string, done: string) {
    setFeedback(await copyText(text) ? done : 'Copie impossible : sélectionnez le texte manuellement.')
  }

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1024 })
    triggerDownload(dataUrl, `samaadresse-${address!.publicCode}.png`)
  }

  function downloadSvg() {
    if (!svg) return
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    triggerDownload(blobUrl, `samaadresse-${address!.publicCode}.svg`)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
  }

  async function share() {
    try {
      await navigator.share({ title: `SamaAdresse ${address!.publicCode}`, text: message, url })
    } catch {
      // Partage annulé.
    }
  }

  return (
    <main className="app-page app-page--narrow page-standalone">
      <Link className="back-link no-print" to={`/a/${encodeURIComponent(address.publicCode)}`}><ArrowLeft aria-hidden="true" />Fiche de l’adresse</Link>
      <div className="share-layout">
        <section className="panel share-card" aria-labelledby="share-title">
          <span className="kicker">QR code et partage</span>
          <h1 id="share-title" className="share-card__code">{address.publicCode}</h1>
          <p className="muted">{address.title} · {address.district}, {address.city}</p>
          {svg
            // SVG produit localement par la bibliothèque qrcode à partir de l'URL publique : aucun contenu externe.
            ? <div className="share-card__qr" role="img" aria-label={`QR code menant à ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
            : <p className="loading" role="status">Génération du QR code…</p>}
          <p className="share-card__hint">Scannez ce QR code pour ouvrir la fiche de l’adresse.</p>
          <div className="share-card__link">
            <label className="visually-hidden" htmlFor="share-url">Lien public</label>
            <input className="input" id="share-url" value={url} readOnly onFocus={(e) => e.target.select()} />
            <button className="button button-secondary button-sm no-print" type="button" onClick={() => copy(url, 'Lien copié.')}><Copy aria-hidden="true" />Copier</button>
          </div>
          <LocalLinkWarning url={url} className="no-print" />
        </section>

        <section className="panel share-actions no-print" aria-label="Actions de partage">
          {canShare && <button className="button button-primary button-block" type="button" onClick={share}><Share2 aria-hidden="true" />Partager le lien</button>}
          <a className="button button-success button-block" href={`sms:?&body=${encodeURIComponent(message)}`}><MessageSquare aria-hidden="true" />Envoyer par SMS</a>
          <button className="button button-secondary button-block" type="button" onClick={() => copy(message, 'Message copié.')}><Copy aria-hidden="true" />Copier le message</button>
          <div className="share-actions__row">
            <button className="button button-secondary" type="button" onClick={downloadPng}><Download aria-hidden="true" />PNG</button>
            <button className="button button-secondary" type="button" onClick={downloadSvg} disabled={!svg}><Download aria-hidden="true" />SVG</button>
            <button className="button button-secondary" type="button" onClick={() => window.print()}><Printer aria-hidden="true" />Imprimer</button>
          </div>
          {feedback && <p className="alert alert--success" role="status">{feedback}</p>}
          <p className="field-hint">« Envoyer par SMS » ouvre l’application de messagerie de votre appareil : SamaAdresse n’envoie aucun SMS lui-même.</p>
        </section>
      </div>
    </main>
  )
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}
