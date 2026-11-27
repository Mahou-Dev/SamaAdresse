import { Camera, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth/authContext'
import { ApiError, deleteMyAddressPhoto, uploadMyAddressPhoto, type OwnerAddress } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { PhotoPicker } from './PhotoPicker'

/**
 * Gestion de la photo de façade par le propriétaire : ajout, remplacement et retrait tant que l'adresse est active.
 */
export function OwnerPhotoPanel({ address, currentUrl, onChanged }: {
  address: OwnerAddress
  currentUrl: string | null
  onChanged: (updated: OwnerAddress) => void
}) {
  const { token, logout, refresh } = useAuth()
  const [draft, setDraft] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const editable = address.status === 'ACTIVE' || address.status === 'SIGNALED'

  async function run(action: (t: string) => Promise<OwnerAddress>, success: string) {
    if (!token) return
    setBusy(true)
    setFeedback(null)
    try {
      const updated = await action(token)
      setDraft(null)
      setConfirmRemove(false)
      setFeedback({ tone: 'success', text: success })
      onChanged(updated)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const fresh = await refresh()
        if (fresh) {
          try {
            const updated = await action(fresh)
            setDraft(null)
            setConfirmRemove(false)
            setFeedback({ tone: 'success', text: success })
            onChanged(updated)
            return
          } catch (retryErr) {
            if (retryErr instanceof ApiError && retryErr.status === 401) { void logout(); return }
            setFeedback({ tone: 'error', text: errorMessage(retryErr) })
            return
          }
        }
        void logout()
        return
      }
      const text = error instanceof ApiError && (error.fieldErrors.file || error.fieldErrors.photo)
        ? (error.fieldErrors.file || error.fieldErrors.photo)
        : errorMessage(error)
      setFeedback({ tone: 'error', text })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel photo-panel" aria-labelledby="photo-title">
      <h2 className="panel-title" id="photo-title"><Camera aria-hidden="true" />Photo de la façade</h2>
      {editable ? (
        <>
          <PhotoPicker value={draft} onChange={setDraft} currentUrl={currentUrl} disabled={busy} />
          <div className="photo-panel__actions">
            {draft && (
              <button className="button button-primary" type="button" disabled={busy}
                onClick={() => void run((t) => uploadMyAddressPhoto(t, address.id, draft), 'Photo de façade enregistrée.')}>
                <Save aria-hidden="true" />{busy ? 'Envoi…' : 'Enregistrer la photo'}
              </button>
            )}
            {!draft && address.hasPhoto && removeControls()}
          </div>
        </>
      ) : (
        <>
          {currentUrl
            ? <img className="photo-panel__image" src={currentUrl} alt={`Façade : ${address.title}`} />
            : <p className="muted">Aucune photo n’a été jointe à cette adresse.</p>}
          <p className="field-hint">Réactivez l’adresse pour modifier sa photo de façade.</p>
          {address.hasPhoto && address.status !== 'SUSPENDED' && <div className="photo-panel__actions">{removeControls()}</div>}
        </>
      )}
      {feedback && <p className={`alert alert--${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
    </section>
  )

  function removeControls() {
    return confirmRemove ? (
      <>
        <button className="button button-danger" type="button" disabled={busy}
          onClick={() => void run((t) => deleteMyAddressPhoto(t, address.id), 'Photo retirée.')}>
          <Trash2 aria-hidden="true" />Confirmer le retrait
        </button>
        <button className="button button-secondary" type="button" disabled={busy} onClick={() => setConfirmRemove(false)}>Annuler</button>
      </>
    ) : (
      <button className="button button-secondary" type="button" onClick={() => setConfirmRemove(true)}><Trash2 aria-hidden="true" />Retirer la photo</button>
    )
  }
}
