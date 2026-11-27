import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { PHOTO_ACCEPT, PhotoError, preparePhoto } from '../lib/photo'

interface PhotoPickerProps {
  /** Photo choisie (déjà préparée) ou null. */
  value: Blob | null
  onChange: (photo: Blob | null) => void
  /** Photo déjà enregistrée à afficher tant qu'aucune nouvelle n'est choisie. */
  currentUrl?: string | null
  disabled?: boolean
  error?: string
}

/** Choix d'une photo de façade avec aperçu ; sur téléphone, le sélecteur propose aussi l'appareil photo. */
export function PhotoPicker({ value, onChange, currentUrl, disabled, error }: PhotoPickerProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setLocalError(null)
    try {
      onChange(await preparePhoto(file))
    } catch (e) {
      setLocalError(e instanceof PhotoError ? e.message : 'Cette photo n’a pas pu être lue.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const shown = preview ?? currentUrl ?? null
  const message = localError ?? error
  return (
    <div className={message ? 'photo-picker photo-picker--invalid' : 'photo-picker'}>
      <div className="photo-picker__frame">
        {shown
          ? <img src={shown} alt={preview ? 'Aperçu de la photo choisie' : 'Photo de façade enregistrée'} />
          : <div className="photo-picker__empty"><Camera aria-hidden="true" /><span>Aucune photo</span></div>}
      </div>
      <div className="photo-picker__actions">
        {/* Champ placé avant son libellé-bouton : le focus clavier est rendu visible sur le libellé. */}
        <input ref={inputRef} id={inputId} className="visually-hidden" type="file" accept={PHOTO_ACCEPT}
          disabled={disabled || busy} aria-describedby={`${inputId}-hint`} onChange={(e) => handleFile(e.target.files?.[0])} />
        <label className={`button button-secondary${disabled || busy ? ' button--disabled' : ''}`} htmlFor={inputId}>
          <ImagePlus aria-hidden="true" />{busy ? 'Préparation…' : shown ? 'Changer de photo' : 'Choisir une photo'}
        </label>
        {value && (
          <button className="button button-secondary" type="button" onClick={() => onChange(null)} disabled={disabled}>
            <Trash2 aria-hidden="true" />Retirer
          </button>
        )}
      </div>
      <p className="field-hint" id={`${inputId}-hint`}>JPEG, PNG ou WebP, 5 Mo au maximum. La photo est réduite et ses métadonnées (dont la position GPS de l’appareil) sont supprimées.</p>
      {message && <p className="field-error" role="alert">{message}</p>}
    </div>
  )
}
