import { Archive, MessageSquare, PencilLine, RotateCcw, Save, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/authContext'
import { publicAddressUrl } from '../hooks/usePublicAddress'
import { LocalLinkWarning } from './LocalLinkWarning'
import {
  ApiError, archiveMyAddress, normalizeSenegalPhone, restoreMyAddress, sendAddressSms, updateMyAddress,
  type FieldErrors, type OwnerAddress, type PlaceType,
} from '../lib/api'
import { errorMessage } from '../lib/errors'
import { describedBy } from '../lib/forms'
import { PLACE_TYPE_LABELS } from '../lib/labels'
import { FormField } from './FormField'

type Feedback = { tone: 'success' | 'error' | 'warning'; text: string } | null

/**
 * Gestion d'une adresse par son propriétaire : modification (description, type, visibilité annuaire),
 * envoi du lien par SMS, archivage et restauration.
 */
export function OwnerManagePanel({ address, onChanged }: { address: OwnerAddress; onChanged: (a: OwnerAddress) => void }) {
  const archived = address.status === 'ARCHIVED'
  const suspended = address.status === 'SUSPENDED'
  return (
    <section className="panel manage" aria-labelledby="manage-title">
      <h2 className="panel-title" id="manage-title"><PencilLine aria-hidden="true" />Gérer l’adresse</h2>
      {suspended ? (
        <p className="alert alert--warning" role="status">
          {address.moderationNotice || 'Cette adresse a été suspendue par la modération et ne peut plus être modifiée.'}
        </p>
      ) : archived ? (
        <RestoreControl address={address} onChanged={onChanged} />
      ) : (
        <>
          <EditForm address={address} onChanged={onChanged} />
          {address.publiclyAccessible && <SmsForm address={address} />}
          <ArchiveControl address={address} onChanged={onChanged} />
        </>
      )}
    </section>
  )
}

function useRunner() {
  const { token, logout, refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function run<T>(action: (token: string) => Promise<T>, onSuccess: (result: T) => Feedback) {
    if (!token) return
    setBusy(true)
    setFeedback(null)
    setFieldErrors({})
    try {
      setFeedback(onSuccess(await action(token)))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const fresh = await refresh()
        if (fresh) {
          try {
            setFeedback(onSuccess(await action(fresh)))
            return
          } catch (retryErr) {
            if (retryErr instanceof ApiError && retryErr.status === 401) { void logout(); return }
            if (retryErr instanceof ApiError) setFieldErrors(retryErr.fieldErrors)
            setFeedback({ tone: 'error', text: errorMessage(retryErr) })
            return
          }
        }
        void logout()
        return
      }
      if (error instanceof ApiError) setFieldErrors(error.fieldErrors)
      setFeedback({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }
  return { busy, feedback, fieldErrors, run, setFeedback }
}

function EditForm({ address, onChanged }: { address: OwnerAddress; onChanged: (a: OwnerAddress) => void }) {
  const [title, setTitle] = useState(address.title)
  const [placeType, setPlaceType] = useState<PlaceType>(address.placeType)
  const [description, setDescription] = useState(address.description ?? '')
  const [listed, setListed] = useState(address.listed)
  const [ownerNamePublic, setOwnerNamePublic] = useState(address.ownerNamePublic)
  const { busy, feedback, fieldErrors: fe, run, setFeedback } = useRunner()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanDesc = description.trim()
    const combinedLen = cleanDesc ? cleanTitle.length + 3 + cleanDesc.length : cleanTitle.length
    if (!cleanTitle) {
      setFeedback({ tone: 'error', text: 'Le nom ou libellé du lieu est obligatoire.' })
      return
    }
    if (combinedLen > 500) {
      setFeedback({ tone: 'error', text: 'La description totale (nom + repères) ne peut pas dépasser 500 caractères.' })
      return
    }
    void run(
      (token) => updateMyAddress(token, address.id, {
        title: cleanTitle,
        placeType,
        description: cleanDesc || null,
        listed,
        ownerNamePublic: listed && ownerNamePublic,
      }),
      (updated) => {
        onChanged(updated)
        return { tone: 'success', text: 'Modifications enregistrées.' }
      },
    )
  }

  return (
    <form className="stack-form manage__form" onSubmit={submit} noValidate aria-label="Modifier l’adresse">
      <div className="field-row">
        <FormField id="edit-title" label="Nom du lieu" error={fe.title || fe.description}>
          <input id="edit-title" value={title} maxLength={160} aria-invalid={!!(fe.title || fe.description)}
            aria-describedby={describedBy('edit-title', fe.title || fe.description)} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="edit-type" label="Type de lieu" error={fe.locationType || fe.placeType}>
          <select id="edit-type" value={placeType} onChange={(e) => setPlaceType(e.target.value as PlaceType)}>
            {(Object.keys(PLACE_TYPE_LABELS) as PlaceType[]).map((t) => <option key={t} value={t}>{PLACE_TYPE_LABELS[t]}</option>)}
          </select>
        </FormField>
      </div>
      <FormField id="edit-description" label="Repères utiles" error={fe.description} hint="Nom + repères limités à 500 caractères au total.">
        <textarea id="edit-description" rows={2} maxLength={450} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>
      <label className="choice choice--check">
        <input type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} />
        <span>Référencer dans l’annuaire public<small>Décocher retire l’adresse de la recherche publique ; le code et le QR code restent actifs.</small></span>
      </label>
      {listed && (
        <label className="choice choice--check">
          <input type="checkbox" checked={ownerNamePublic} onChange={(e) => setOwnerNamePublic(e.target.checked)} />
          <span>Afficher mon nom dans l’annuaire</span>
        </label>
      )}
      <p className="field-hint">Le code, la position GPS, la zone et le quartier sont immuables : pour changer de lieu, créez une nouvelle adresse.</p>
      {feedback && <p className={`alert alert--${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
      <div><button className="button button-primary" type="submit" disabled={busy}><Save aria-hidden="true" />{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </form>
  )
}

function SmsForm({ address }: { address: OwnerAddress }) {
  const [phone, setPhone] = useState('')
  const { busy, feedback, fieldErrors: fe, run, setFeedback } = useRunner()
  const [unavailable, setUnavailable] = useState(false)
  const link = publicAddressUrl(address.publicCode)
  const message = `SamaAdresse : adresse ${address.publicCode}. Voir la fiche et l’itinéraire : ${link}`

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = normalizeSenegalPhone(phone)
    if (!/^\+221(70|75|76|77|78)[0-9]{7}$/.test(normalized)) {
      setFeedback({ tone: 'error', text: 'Saisissez un numéro mobile sénégalais valide (ex. 77 123 45 67 ou +221771234567).' })
      return
    }
    void run(
      (token) => sendAddressSms(token, address.publicCode, normalized).catch((error) => {
        if (error instanceof ApiError && (error.status === 502 || error.status === 503)) setUnavailable(true)
        throw error
      }),
      (result) => (result.status === 'SENT'
        ? { tone: 'success', text: `SMS envoyé au ${result.maskedPhone}.` }
        : { tone: 'warning', text: `Mode simulation du serveur (${result.maskedPhone}) : aucun SMS réel n’a été facturé.` }),
    )
  }

  return (
    <form className="stack-form manage__sms" onSubmit={submit} noValidate aria-label="Envoyer le lien par SMS">
      <h3><MessageSquare aria-hidden="true" className="inline-icon" /> Envoyer le lien par SMS</h3>
      <div className="manage__sms-row">
        <FormField id="sms-phone" label="Numéro du destinataire" error={fe.phoneNumber || fe.phone} hint="Mobile sénégalais : 77 123 45 67 ou +221 77 123 45 67">
          <input id="sms-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} aria-invalid={!!(fe.phoneNumber || fe.phone)}
            aria-describedby={describedBy('sms-phone', fe.phoneNumber || fe.phone, 'hint')} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <button className="button button-success" type="submit" disabled={busy || !phone.trim()}><Send aria-hidden="true" />{busy ? 'Envoi…' : 'Envoyer'}</button>
      </div>
      {feedback && <p className={`alert alert--${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
      <LocalLinkWarning url={link} />
      {unavailable && (
        <a className="button button-secondary" href={`sms:${encodeURIComponent(phone)}?&body=${encodeURIComponent(message)}`}>
          <MessageSquare aria-hidden="true" />Ouvrir ma messagerie à la place
        </a>
      )}
    </form>
  )
}

function ArchiveControl({ address, onChanged }: { address: OwnerAddress; onChanged: (a: OwnerAddress) => void }) {
  const [confirming, setConfirming] = useState(false)
  const { busy, feedback, run } = useRunner()
  return (
    <div className="manage__archive">
      {confirming ? (
        <>
          <p className="alert alert--warning" role="status">Archiver {address.publicCode} ? La fiche publique, le lien et le QR code seront désactivés jusqu’à une éventuelle restauration.</p>
          <div className="manage__actions">
            <button className="button button-danger" type="button" disabled={busy}
              onClick={() => void run((token) => archiveMyAddress(token, address.id), (updated) => { onChanged(updated); return null })}>
              <Archive aria-hidden="true" />Confirmer l’archivage
            </button>
            <button className="button button-secondary" type="button" disabled={busy} onClick={() => setConfirming(false)}>Annuler</button>
          </div>
        </>
      ) : (
        <button className="button button-secondary" type="button" onClick={() => setConfirming(true)}><Archive aria-hidden="true" />Archiver l’adresse</button>
      )}
      {feedback && <p className="alert alert--error" role="alert">{feedback.text}</p>}
    </div>
  )
}

function RestoreControl({ address, onChanged }: { address: OwnerAddress; onChanged: (a: OwnerAddress) => void }) {
  const { busy, feedback, run } = useRunner()
  return (
    <div className="stack-form">
      <p className="muted">Cette adresse est archivée : sa fiche publique et son QR code sont actuellement désactivés. Vous pouvez la réactiver à tout moment.</p>
      {feedback && <p className={`alert alert--${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
      <div>
        <button className="button button-primary" type="button" disabled={busy}
          onClick={() => void run((token) => restoreMyAddress(token, address.id), (updated) => {
            onChanged(updated)
            return { tone: 'success', text: 'Adresse restaurée et de nouveau active.' }
          })}>
          <RotateCcw aria-hidden="true" />{busy ? 'Restauration…' : 'Restaurer l’adresse'}
        </button>
      </div>
    </div>
  )
}
