import { ArrowLeft, ArrowLeftRight, ArrowRight, Check, Info, LocateFixed, MapPin, Save } from 'lucide-react'
import { useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { FormField } from '../components/FormField'
import { AddressMap } from '../components/map/AddressMap'
import { LocationPicker } from '../components/map/LocationPicker'
import { PhotoPicker } from '../components/PhotoPicker'
import { gridCell } from '../lib/addressCode'
import { draftsSupported, saveDraft } from '../lib/drafts'
import { ApiError, composeAddressDescription, createMyAddress, uploadMyAddressPhoto, type FieldErrors, type PlaceType } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { describedBy } from '../lib/forms'
import { looksSwapped, parseCoordinate, parseCoordinatePair } from '../lib/coordinates'
import { formatOutOfZoneMessage, getAllZones, getZoneName, resolveQuartier, type GeoQuartier } from '../lib/geoGrid'
import { accuracyLevel, formatDistance, GeolocationFailure, GEOLOCATION_MESSAGES, locateBestPosition } from '../lib/geolocation'
import { PLACE_TYPE_LABELS } from '../lib/labels'

type ListingChoice = '' | 'yes' | 'no'
type GeoState =
  | { kind: 'idle' }
  | { kind: 'locating'; accuracy?: number }
  | { kind: 'done'; accuracy: number; timestamp: number }
  | { kind: 'error'; message: string }

interface FormValues {
  title: string
  placeType: PlaceType | ''
  description: string
  latitude: string
  longitude: string
  listed: ListingChoice
  ownerNamePublic: boolean
}

const EMPTY: FormValues = { title: '', placeType: '', description: '', latitude: '', longitude: '', listed: '', ownerNamePublic: false }
const ZONES = getAllZones()

const STEPS = ['Informations', 'Localisation', 'Photo', 'Validation'] as const
const STEP_TITLES = ['informations générales', 'localisation', 'photo de la façade (facultative)', 'vérification et annuaire']
const STEP_FIELDS: Array<Array<string>> = [
  ['title', 'placeType', 'locationType', 'description'],
  ['latitude', 'longitude'],
  ['photo', 'file'],
  ['listed'],
]

function tryResolveQuartier(lat: number, lng: number): { quartier: GeoQuartier | null; error: string | null } {
  try {
    return { quartier: resolveQuartier(lat, lng), error: null }
  } catch {
    if (looksSwapped(lat, lng)) {
      return {
        quartier: null,
        error: 'Latitude et longitude semblent inversées : au Sénégal, la latitude est entre 12 et 16,8 et la longitude est négative (entre -17,6 et -11,3).',
      }
    }
    return { quartier: null, error: formatOutOfZoneMessage() }
  }
}

function validateStep(step: number, values: FormValues): FieldErrors {
  const errors: FieldErrors = {}
  if (step === 0) {
    if (values.title.trim().length < 2) errors.title = 'Le nom du lieu doit contenir au moins 2 caractères.'
    if (!values.placeType) errors.placeType = 'Choisissez un type de lieu.'
    const combined = composeAddressDescription(values.title, values.description)
    if (combined.length > 500) {
      errors.description = 'La description totale (nom + repères) ne doit pas dépasser 500 caractères.'
    }
  }
  if (step === 1) {
    const lat = parseCoordinate(values.latitude)
    const lng = parseCoordinate(values.longitude)
    if (lat === null || lat < -90 || lat > 90) errors.latitude = 'Saisissez une latitude valide (entre -90 et 90).'
    if (lng === null || lng < -180 || lng > 180) errors.longitude = 'Saisissez une longitude valide (entre -180 et 180).'
    if (!errors.latitude && !errors.longitude) {
      const resolved = tryResolveQuartier(lat as number, lng as number)
      if (!resolved.quartier && resolved.error) {
        errors.latitude = resolved.error
      }
    }
  }
  if (step === 3 && !values.listed) errors.listed = 'Indiquez si cette adresse doit figurer dans l’annuaire public.'
  return errors
}

export function NewAddressPage() {
  const { token, user, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' })
  const [photo, setPhoto] = useState<Blob | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const geolocationAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const lat = parseCoordinate(values.latitude)
  const lng = parseCoordinate(values.longitude)
  const point = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
  const resolvedGeo = point ? tryResolveQuartier(point.lat, point.lng) : { quartier: null, error: null }
  const resolvedQuartier = resolvedGeo.quartier
  const previewCode = point && resolvedQuartier
    ? `${resolvedQuartier.zoneCode}-${resolvedQuartier.code}-${gridCell(point.lat, point.lng)}`
    : null

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function setPoint(latitude: number, longitude: number) {
    setValues((current) => ({ ...current, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }))
  }

  function placeManually(latitude: number, longitude: number) {
    setPoint(latitude, longitude)
    setGeo((current) => (current.kind === 'done' ? { kind: 'idle' } : current))
  }

  function changeCoordinate(key: 'latitude' | 'longitude', value: string) {
    update(key, value)
    setGeo((current) => (current.kind === 'done' ? { kind: 'idle' } : current))
  }

  function pasteCoordinates(event: ClipboardEvent<HTMLInputElement>) {
    const pair = parseCoordinatePair(event.clipboardData.getData('text'))
    if (!pair) return
    event.preventDefault()
    setValues((current) => ({ ...current, latitude: String(pair.lat), longitude: String(pair.lng) }))
    setGeo((current) => (current.kind === 'done' ? { kind: 'idle' } : current))
  }

  function swapCoordinates() {
    setValues((current) => ({ ...current, latitude: current.longitude, longitude: current.latitude }))
    setFieldErrors((current) => ({ ...current, latitude: '', longitude: '' }))
  }

  function goTo(nextStep: number) {
    setStep(nextStep)
    setError(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function next() {
    const errors = validateStep(step, values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError('Corrigez les champs signalés pour continuer.')
      return
    }
    goTo(step + 1)
  }

  async function locateMe() {
    setGeo({ kind: 'locating' })
    try {
      const fix = await locateBestPosition(undefined, {
        onProgress: (progress) => setGeo({ kind: 'locating', accuracy: progress.accuracy }),
      })
      const check = tryResolveQuartier(fix.latitude, fix.longitude)
      if (!check.quartier) {
        setGeo({
          kind: 'error',
          message: `Position relevée (${fix.latitude.toFixed(5)}, ${fix.longitude.toFixed(5)}, ±${formatDistance(fix.accuracy)}) hors zones couvertes (Ziguinchor, Dakar, Saint-Louis). Placez le point sur la carte.`,
        })
        return
      }
      setPoint(fix.latitude, fix.longitude)
      setGeo({ kind: 'done', accuracy: fix.accuracy, timestamp: fix.timestamp })
    } catch (failure) {
      setGeo({ kind: 'error', message: failure instanceof GeolocationFailure ? failure.message : GEOLOCATION_MESSAGES.unavailable })
    }
  }

  async function submitAddress(activeToken: string, clientRequestId: string) {
    const input = {
      title: values.title.trim(),
      placeType: values.placeType as PlaceType,
      description: values.description.trim() || null,
      latitude: lat as number,
      longitude: lng as number,
      listed: values.listed === 'yes',
      ownerNamePublic: values.listed === 'yes' && values.ownerNamePublic,
      clientRequestId,
    }
    const created = await createMyAddress(activeToken, input)
    let photoError: string | null = null
    if (photo) {
      try {
        await uploadMyAddressPhoto(activeToken, created.id, photo)
      } catch (photoErr) {
        photoError = photoErr instanceof ApiError && (photoErr.fieldErrors.file || photoErr.fieldErrors.photo)
          ? (photoErr.fieldErrors.file || photoErr.fieldErrors.photo)
          : errorMessage(photoErr)
      }
    }
    navigate(`/mes-adresses/${created.id}`, {
      state: { justCreated: true, photoError, provisionalCode: previewCode ?? undefined },
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < STEPS.length - 1) {
      next()
      return
    }
    for (let s = 0; s < STEPS.length; s++) {
      const errors = validateStep(s, values)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setError('Corrigez les champs signalés avant d’enregistrer.')
        if (s !== step) goTo(s)
        return
      }
    }
    if (!token) return
    setSubmitting(true)
    setError(null)
    const clientRequestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    const draftInput = {
      title: values.title.trim(),
      placeType: values.placeType as PlaceType,
      description: values.description.trim() || null,
      latitude: lat as number,
      longitude: lng as number,
      listed: values.listed === 'yes',
      ownerNamePublic: values.listed === 'yes' && values.ownerNamePublic,
      clientRequestId,
    }

    try {
      await submitAddress(token, clientRequestId)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const fresh = await refresh()
        if (fresh) {
          try {
            await submitAddress(fresh, clientRequestId)
            return
          } catch (retryErr) {
            if (retryErr instanceof ApiError && retryErr.status === 401) { void logout(); return }
            setSubmitting(false)
            setError(errorMessage(retryErr))
            return
          }
        }
        void logout()
        return
      }
      if (err instanceof ApiError && err.status === 0 && user && draftsSupported()) {
        try {
          const draft = await saveDraft(user.id, draftInput, previewCode ?? 'BROUILLON', photo)
          navigate('/mes-adresses', { state: { draftSaved: draft.provisionalCode } })
          return
        } catch {
          // Stockage local refusé : affiche l'erreur réseau ci-dessous.
        }
      }
      setSubmitting(false)
      setError(errorMessage(err))
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors)
        const target = STEP_FIELDS.findIndex((fields) => fields.some((f) => f in err.fieldErrors))
        if (target >= 0 && target !== step) goTo(target)
      }
    }
  }

  const fe = fieldErrors
  return (
    <main className="app-page app-page--narrow">
      <Link className="back-link" to="/mes-adresses"><ArrowLeft aria-hidden="true" />Mes adresses</Link>
      <section className="panel wizard" aria-labelledby="new-address-title">
        <h1 id="new-address-title" className="wizard__title">Créer une nouvelle adresse</h1>
        <ol className="stepper" aria-label="Étapes de création">
          {STEPS.map((label, index) => (
            <li key={label} className={index === step ? 'stepper__item stepper__item--current' : index < step ? 'stepper__item stepper__item--done' : 'stepper__item'}
              aria-current={index === step ? 'step' : undefined}>
              <span className="stepper__num">{index < step ? <Check aria-hidden="true" /> : index + 1}</span>
              <span className="stepper__label">{label}</span>
            </li>
          ))}
        </ol>

        <form className="stack-form" onSubmit={handleSubmit} noValidate aria-label="Création d’adresse">
          <h2 className="wizard__step-title" ref={headingRef} tabIndex={-1}>
            Étape {step + 1} sur {STEPS.length} : {STEP_TITLES[step]}
          </h2>

          {step === 0 && (
            <div className="wizard__grid">
              <FormField id="address-type" label="Type de lieu" error={fe.placeType || fe.locationType}>
                <select id="address-type" value={values.placeType} aria-invalid={!!(fe.placeType || fe.locationType)}
                  aria-describedby={describedBy('address-type', fe.placeType || fe.locationType)} onChange={(e) => update('placeType', e.target.value as PlaceType | '')}>
                  <option value="">Choisir…</option>
                  {(Object.keys(PLACE_TYPE_LABELS) as PlaceType[]).map((type) => (
                    <option key={type} value={type}>{PLACE_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </FormField>
              <FormField id="address-title" label="Nom du lieu" error={fe.title}>
                <input id="address-title" value={values.title} maxLength={160} aria-invalid={!!fe.title} placeholder="Ex. Maison familiale Diallo"
                  aria-describedby={describedBy('address-title', fe.title)} onChange={(e) => update('title', e.target.value)} />
              </FormField>
              <FormField id="address-description" label="Repères visuels utiles (facultatif)" error={fe.description} hint="Nom + repères limités à 500 caractères au total. La zone et le quartier sont déterminés automatiquement depuis le point GPS.">
                <textarea id="address-description" rows={3} maxLength={450} value={values.description} aria-invalid={!!fe.description}
                  placeholder="Ex. portail bleu, 3e concession à gauche après la mosquée"
                  aria-describedby={describedBy('address-description', fe.description)} onChange={(e) => update('description', e.target.value)} />
              </FormField>
            </div>
          )}

          {step === 1 && (
            <div className="wizard__location">
              <div className="wizard__location-controls">
                <button className="button button-secondary" type="button" onClick={() => void locateMe()}
                  disabled={!geolocationAvailable || geo.kind === 'locating'}>
                  <LocateFixed aria-hidden="true" />{geo.kind === 'locating' ? 'Localisation…' : 'Utiliser ma position actuelle'}
                </button>
                <div className="chip-row" role="group" aria-label="Aller rapidement vers une zone couverte">
                  {ZONES.map((z) => (
                    <button key={z.code} type="button" className="chip"
                      onClick={() => placeManually((z.latMin + z.latMax) / 2, (z.lonMin + z.lonMax) / 2)}>
                      <MapPin aria-hidden="true" />{z.name}
                    </button>
                  ))}
                </div>
                {!geolocationAvailable && <p className="field-hint">{GEOLOCATION_MESSAGES.unsupported}</p>}
                {geo.kind === 'locating' && geo.accuracy !== undefined && (
                  <p className="field-hint" role="status">Affinage de la position… meilleure précision actuelle : {formatDistance(geo.accuracy)}.</p>
                )}
                {geo.kind === 'done' && <GeoFeedback accuracy={geo.accuracy} timestamp={geo.timestamp} />}
                {geo.kind === 'error' && <p className="field-error" role="alert">{geo.message}</p>}
                <div className="field-row">
                  <FormField id="address-latitude" label="Latitude" error={fe.latitude}>
                    <input id="address-latitude" inputMode="decimal" value={values.latitude} aria-invalid={!!fe.latitude} placeholder="ex. 12.5738"
                      aria-describedby={fe.latitude ? 'address-latitude-error' : 'coordinates-hint'} onChange={(e) => changeCoordinate('latitude', e.target.value)} onPaste={pasteCoordinates} />
                  </FormField>
                  <FormField id="address-longitude" label="Longitude" error={fe.longitude}>
                    <input id="address-longitude" inputMode="decimal" value={values.longitude} aria-invalid={!!fe.longitude} placeholder="ex. -16.2650"
                      aria-describedby={fe.longitude ? 'address-longitude-error' : 'coordinates-hint'} onChange={(e) => changeCoordinate('longitude', e.target.value)} onPaste={pasteCoordinates} />
                  </FormField>
                </div>
                {point && looksSwapped(point.lat, point.lng) && (
                  <button className="button button-secondary button-sm" type="button" onClick={swapCoordinates}>
                    <ArrowLeftRight aria-hidden="true" />Inverser latitude et longitude
                  </button>
                )}
                {resolvedQuartier && previewCode && (
                  <p className="provisional-code" role="status">
                    Zone détectée : <strong>{getZoneName(resolvedQuartier.zoneCode)} · {resolvedQuartier.name}</strong>
                    <small>Aperçu du format : {resolvedQuartier.zoneCode}-{resolvedQuartier.code}-XXXX (code définitif attribué par le serveur)</small>
                  </p>
                )}
                {point && !resolvedQuartier && resolvedGeo.error && (
                  <p className="field-error" role="alert">{resolvedGeo.error}</p>
                )}
                <p className="field-hint" id="coordinates-hint">Cliquez sur la carte pour placer le point, puis déplacez le marqueur pour l’ajuster. Zones couvertes : Ziguinchor, Dakar et Saint-Louis.</p>
              </div>
              <div className="map-frame wizard__map">
                <LocationPicker value={point} onChange={placeManually} accuracy={geo.kind === 'done' ? geo.accuracy : undefined} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard__photo">
              <p className="muted">Une photo de la façade aide vos visiteurs et livreurs à reconnaître le lieu. Formats acceptés : JPEG, PNG ou WebP (max 5 Mo).</p>
              <PhotoPicker value={photo} onChange={setPhoto} error={fe.photo || fe.file} />
            </div>
          )}

          {step === 3 && (<>
            <div className="wizard__review">
              <div className="code-preview" aria-label="Aperçu du code">
                <small>Zone & quartier résolus</small>
                <strong>{resolvedQuartier ? `${resolvedQuartier.zoneCode}-${resolvedQuartier.code}-XXXX` : '—'}</strong>
                <p>{resolvedQuartier ? `${getZoneName(resolvedQuartier.zoneCode)} · ${resolvedQuartier.name}` : 'Position requise'}. Le serveur génère votre code court unique et immuable dès l’enregistrement.</p>
              </div>
              {point && (
                <div className="map-frame wizard__review-map">
                  <AddressMap addresses={[{
                    key: 'apercu',
                    publicCode: 'Aperçu',
                    title: values.title,
                    placeType: (values.placeType || 'MAISON') as PlaceType,
                    district: resolvedQuartier?.name ?? '',
                    latitude: point.lat,
                    longitude: point.lng,
                  }]}
                    label="Position choisie" interactive={false} zoom={16} />
                </div>
              )}
            </div>
            <div className="wizard__grid">
              <dl className="summary">
                <div><dt>Lieu</dt><dd>{values.title} · {values.placeType && PLACE_TYPE_LABELS[values.placeType]}</dd></div>
                {resolvedQuartier && <div><dt>Quartier · Zone</dt><dd>{resolvedQuartier.name}, {getZoneName(resolvedQuartier.zoneCode)}</dd></div>}
                <div><dt>Coordonnées</dt><dd>{values.latitude}, {values.longitude}</dd></div>
                {values.description.trim() && <div><dt>Repères</dt><dd>{values.description}</dd></div>}
                <div><dt>Photo de façade</dt><dd>{photo ? 'Jointe (envoyée juste après l’enregistrement)' : 'Aucune'}</dd></div>
              </dl>
              <fieldset className="consent" aria-describedby={fe.listed ? 'consent-error' : 'consent-help'}>
                <legend>Visibilité dans l’annuaire public</legend>
                <p className="field-hint" id="consent-help">Votre code et son QR code sont immédiatement utilisables. Choisissez en plus si ce lieu doit apparaître dans la recherche de l’annuaire public.</p>
                <label className="choice">
                  <input type="radio" name="consent" value="yes" checked={values.listed === 'yes'} onChange={() => update('listed', 'yes')} />
                  <span>Oui, référencer cette adresse dans l’annuaire public</span>
                </label>
                <label className="choice">
                  <input type="radio" name="consent" value="no" checked={values.listed === 'no'} onChange={() => update('listed', 'no')} />
                  <span>Non, accessible uniquement aux personnes à qui je transmets le code</span>
                </label>
                {values.listed === 'yes' && (
                  <label className="choice choice--check">
                    <input type="checkbox" checked={values.ownerNamePublic} onChange={(e) => update('ownerNamePublic', e.target.checked)} />
                    <span>Afficher mon nom dans l’annuaire<small>On pourra retrouver cette adresse en cherchant votre nom. Votre e-mail et téléphone ne sont jamais montrés.</small></span>
                  </label>
                )}
                {fe.listed && <p className="field-error" id="consent-error">{fe.listed}</p>}
              </fieldset>
              <p className="alert"><Info aria-hidden="true" className="inline-icon" /> Votre adresse sera immédiatement active dès l’enregistrement, avec sa fiche publique et son QR code.</p>
            </div>
          </>)}

          {error && <p className="alert alert--error" role="alert">{error}</p>}
          <div className="wizard__nav">
            {step > 0
              ? <button className="button button-secondary" type="button" onClick={() => goTo(step - 1)}><ArrowLeft aria-hidden="true" />Précédent</button>
              : <span />}
            {step < STEPS.length - 1
              ? <button className="button button-primary" type="submit">Suivant<ArrowRight aria-hidden="true" /></button>
              : <button className="button button-primary" type="submit" disabled={submitting}><Save aria-hidden="true" />{submitting ? 'Enregistrement…' : 'Enregistrer l’adresse'}</button>}
          </div>
        </form>
      </section>
    </main>
  )
}

function GeoFeedback({ accuracy, timestamp }: { accuracy: number; timestamp: number }) {
  const level = accuracyLevel(accuracy)
  const time = new Intl.DateTimeFormat('fr-FR', { timeStyle: 'medium' }).format(new Date(timestamp))
  if (level === 'good') {
    return <p className="field-hint" role="status">Position de l’appareil relevée à {time}, précise à environ {formatDistance(accuracy)} (cercle bleu). Vérifiez-la sur la carte.</p>
  }
  return (
    <p className="alert alert--warning" role="status">
      Position approximative : l’appareil annonce une incertitude d’environ {formatDistance(accuracy)} (relevé de {time}, cercle bleu sur la carte).
      {level === 'poor' && ' Sur un ordinateur ou à l’intérieur, la position vient souvent du Wi-Fi ou du réseau et peut être éloignée du vrai lieu.'}
      {' '}Déplacez le marqueur sur l’entrée exacte avant d’enregistrer.
    </p>
  )
}
