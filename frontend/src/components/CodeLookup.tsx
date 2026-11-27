import { ChevronRight, MapPin, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiUrl, getPublicAddress, type PublicAddress } from '../lib/api'
import { isValidCode, normalizeCode } from '../lib/addressCode'
import { PLACE_TYPE_LABELS } from '../lib/labels'

type LookupState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; address: PublicAddress }
  | { kind: 'not-found' }
  | { kind: 'gone' }
  | { kind: 'error'; message: string }

/** Recherche d'une adresse publique par son code (GET /api/addresses/{code}). */
export function CodeLookup({ initialCode = '', autoSearch = false }: { initialCode?: string; autoSearch?: boolean }) {
  const [code, setCode] = useState(initialCode)
  const [lookup, setLookup] = useState<LookupState>({ kind: 'idle' })
  const autoRan = useRef(false)

  const run = useCallback(async (rawCode: string) => {
    const normalizedCode = normalizeCode(rawCode)
    if (!normalizedCode) {
      setLookup({ kind: 'error', message: 'Saisissez un code d’adresse pour lancer la recherche.' })
      return
    }
    if (!isValidCode(normalizedCode)) {
      setLookup({ kind: 'error', message: 'Format attendu : ZONE-QUARTIER-CHIFFRES, par exemple ZIG-KBG-4271.' })
      return
    }
    setCode(normalizedCode)
    setLookup({ kind: 'loading' })
    try {
      setLookup({ kind: 'success', address: await getPublicAddress(normalizedCode) })
    } catch (error) {
      if (error instanceof ApiError && error.status === 410) {
        setLookup({ kind: 'gone' })
      } else if (error instanceof ApiError && error.status === 404) {
        setLookup({ kind: 'not-found' })
      } else if (error instanceof ApiError && error.status === 400) {
        setLookup({ kind: 'error', message: 'Ce format de code ne semble pas valide. Vérifiez les lettres et les chiffres.' })
      } else {
        setLookup({ kind: 'error', message: 'Le service est momentanément indisponible. Vérifiez votre connexion ou réessayez plus tard.' })
      }
    }
  }, [])

  useEffect(() => {
    if (autoSearch && initialCode && !autoRan.current) {
      autoRan.current = true
      void run(initialCode)
    }
  }, [autoSearch, initialCode, run])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void run(code)
  }

  return (
    <div className="lookup">
      <form className="lookup-form" aria-label="Recherche par code" onSubmit={handleSubmit}>
        <label htmlFor="address-code">Code SamaAdresse</label>
        <div className="lookup-form__controls">
          <div className="input-icon">
            <MapPin aria-hidden="true" />
            <input className="input" id="address-code" name="code" value={code} onChange={(event) => setCode(event.target.value)}
              placeholder="Ex. ZIG-KBG-4271" autoComplete="off" autoCapitalize="characters" />
          </div>
          <button className="button button-primary" type="submit" disabled={lookup.kind === 'loading'}>
            <Search aria-hidden="true" />{lookup.kind === 'loading' ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>
        <p className="field-hint">Format : zone, quartier puis 4 chiffres (ex. ZIG-KBG-4271, DKR-PLT-1024).</p>
      </form>
      {lookup.kind === 'success' && <LookupResult address={lookup.address} />}
      {lookup.kind === 'not-found' && <p className="alert" role="status">Aucune adresse active ne correspond à ce code.</p>}
      {lookup.kind === 'gone' && <p className="alert alert--warning" role="status">Cette adresse a été archivée ou suspendue et n’est plus accessible publiquement.</p>}
      {lookup.kind === 'error' && <p className="alert alert--error" role="alert">{lookup.message}</p>}
    </div>
  )
}

function LookupResult({ address }: { address: PublicAddress }) {
  return (
    <article className="lookup-result" aria-live="polite">
      <div className="lookup-result__head"><span>Résultat</span><span className="status-badge status-badge--active">Active</span></div>
      <Link className="lookup-result__body" to={`/a/${encodeURIComponent(address.publicCode)}`}>
        {address.photoUrl
          ? <img className="lookup-result__photo" src={apiUrl(address.photoUrl)} alt="" />
          : <span className="lookup-result__icon"><MapPin aria-hidden="true" /></span>}
        <span className="lookup-result__text">
          <h3>{address.publicCode}</h3>
          <p>{address.title} · {address.district}, {address.city}</p>
          <small>{PLACE_TYPE_LABELS[address.placeType]}{address.description ? ` — ${address.description}` : ''}</small>
        </span>
        <span className="lookup-result__go">Voir la fiche <ChevronRight aria-hidden="true" /></span>
      </Link>
    </article>
  )
}
