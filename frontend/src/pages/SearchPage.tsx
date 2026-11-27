import { Building2, ChevronRight, Hash, MapPin, Search, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CodeLookup } from '../components/CodeLookup'
import { apiUrl, searchDirectory, type DirectoryItem, type DirectoryQuery, type Page, type PlaceType } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { getAllQuartiers, getZoneName } from '../lib/geoGrid'
import { PLACE_TYPE_LABELS } from '../lib/labels'
import { PLACE_TYPE_ICONS } from '../lib/placeIcons'

type Mode = 'code' | 'recherche' | 'quartier' | 'type'
const MODES: Array<{ id: Mode; label: string; icon: typeof Hash }> = [
  { id: 'code', label: 'Code', icon: Hash },
  { id: 'recherche', label: 'Mot-clé / Propriétaire', icon: UserRound },
  { id: 'quartier', label: 'Quartier', icon: MapPin },
  { id: 'type', label: 'Type de lieu', icon: Building2 },
]
const TYPES: PlaceType[] = ['MAISON', 'COMMERCE', 'INSTITUTION']
const QUARTIERS = getAllQuartiers()
const PAGE_SIZE = 12

/**
 * Annuaire public (GET /api/public/directory + GET /api/addresses/{code}) :
 * recherche par code, mot-clé/propriétaire, quartier ou type de lieu.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('par') as Mode | null
  const mode: Mode = MODES.some((m) => m.id === requested) ? requested as Mode : 'code'
  const code = params.get('code') ?? ''

  return (
    <main className="app-page app-page--narrow page-standalone">
      <div className="app-page__head">
        <div>
          <span className="kicker">Annuaire SamaAdresse</span>
          <h1>Recherche d’adresse</h1>
          <p className="muted">Retrouvez une adresse active par son code, un mot-clé, son quartier ou son type de lieu.</p>
        </div>
      </div>
      <section className="panel search-panel">
        <div className="search-tabs" role="tablist" aria-label="Critère de recherche">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={mode === id}
              onClick={() => setParams(id === 'code' ? {} : { par: id }, { replace: true })}>
              <Icon aria-hidden="true" />{label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
          {mode === 'code'
            ? <CodeLookup key={code} initialCode={code} autoSearch />
            : <DirectorySearch key={mode} mode={mode} />}
        </div>
      </section>
    </main>
  )
}

type ResultState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; query: DirectoryQuery; page: Page<DirectoryItem>; items: DirectoryItem[] }
  | { kind: 'error'; message: string }

function DirectorySearch({ mode }: { mode: Exclude<Mode, 'code'> }) {
  const [text, setText] = useState('')
  const [quartier, setQuartier] = useState('')
  const [type, setType] = useState<PlaceType>('MAISON')
  const [state, setState] = useState<ResultState>({ kind: 'idle' })
  const [validation, setValidation] = useState<string | null>(null)

  const load = useCallback(async (query: DirectoryQuery, pageNumber: number, previous: DirectoryItem[]) => {
    setState((s) => (pageNumber === 0 || s.kind !== 'ready' ? { kind: 'loading' } : s))
    try {
      const page = await searchDirectory(query, pageNumber, PAGE_SIZE)
      setState({ kind: 'ready', query, page, items: [...previous, ...page.items] })
    } catch (error) {
      setState({ kind: 'error', message: errorMessage(error) })
    }
  }, [])

  useEffect(() => {
    if (mode === 'type') void load({ type }, 0, [])
    if (mode === 'quartier' && quartier) void load({ quartier }, 0, [])
  }, [mode, type, quartier, load])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text.trim()
    if (mode === 'recherche' && value.length < 2) {
      setValidation('Saisissez au moins 2 caractères pour rechercher.')
      return
    }
    if (mode === 'quartier' && !quartier && value.length < 2) {
      setValidation('Choisissez un quartier ou saisissez au moins 2 lettres.')
      return
    }
    setValidation(null)
    const query: DirectoryQuery = mode === 'recherche'
      ? { q: value }
      : mode === 'quartier'
        ? { quartier: quartier || value }
        : { type, quartier: value || undefined }
    void load(query, 0, [])
  }

  const label = mode === 'recherche' ? 'Mot-clé, description ou nom du propriétaire' : mode === 'quartier' ? 'Code ou nom de quartier' : 'Quartier (facultatif)'
  return (
    <div className="directory">
      {mode === 'type' && (
        <div className="chip-row" role="group" aria-label="Type de lieu">
          {TYPES.map((t) => {
            const Icon = PLACE_TYPE_ICONS[t]
            return <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}><Icon aria-hidden="true" />{PLACE_TYPE_LABELS[t]}</button>
          })}
        </div>
      )}
      {mode === 'quartier' && (
        <div className="chip-row" role="group" aria-label="Quartiers couverts">
          {QUARTIERS.map((q) => (
            <button key={`${q.zoneCode}-${q.code}`} type="button" className="chip" aria-pressed={quartier === q.code}
              onClick={() => { setQuartier(q.code); setText('') }}>
              <MapPin aria-hidden="true" />{q.name} ({getZoneName(q.zoneCode)})
            </button>
          ))}
        </div>
      )}
      <form className="directory__form" onSubmit={submit} aria-label={`Recherche par ${label.toLowerCase()}`}>
        <div className="field">
          <label htmlFor="directory-text">{label}</label>
          <input id="directory-text" value={text} onChange={(e) => { setText(e.target.value); if (mode === 'quartier') setQuartier('') }} maxLength={80}
            placeholder={mode === 'recherche' ? 'Ex. Université, Boutique, Fatou…' : 'Ex. KBG, Kandé, Médina…'} aria-invalid={!!validation}
            aria-describedby={validation ? 'directory-error' : undefined} />
        </div>
        <button className="button button-primary" type="submit" disabled={state.kind === 'loading'}>
          <Search aria-hidden="true" />{state.kind === 'loading' ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>
      {validation && <p className="field-error" id="directory-error" role="alert">{validation}</p>}
      {mode === 'recherche' && <p className="field-hint">Seules les adresses actives référencées dans l’annuaire apparaissent ici (le nom du propriétaire uniquement s’il l’a autorisé).</p>}

      {state.kind === 'loading' && <p className="loading" role="status">Recherche dans l’annuaire…</p>}
      {state.kind === 'error' && <p className="alert alert--error" role="alert">{state.message}</p>}
      {state.kind === 'ready' && (
        <div className="directory__results" aria-live="polite">
          <div className="directory__results-head"><span>Résultats</span><span>{state.page.totalElements} adresse{state.page.totalElements > 1 ? 's' : ''}</span></div>
          {state.items.length === 0
            ? <p className="directory__empty" role="status">Aucune adresse publique ne correspond à cette recherche.</p>
            : (
              <ul className="directory__list">
                {state.items.map((a) => <li key={a.publicCode}><DirectoryResult address={a} /></li>)}
              </ul>
            )}
          {state.page.page + 1 < state.page.totalPages && (
            <button className="button button-secondary button-block" type="button"
              onClick={() => void load(state.query, state.page.page + 1, state.items)}>Afficher plus de résultats</button>
          )}
        </div>
      )}
    </div>
  )
}

function DirectoryResult({ address: a }: { address: DirectoryItem }) {
  const Icon = PLACE_TYPE_ICONS[a.placeType]
  return (
    <Link className="directory__item" to={`/a/${encodeURIComponent(a.publicCode)}`}>
      {a.photoUrl
        ? <img src={apiUrl(a.photoUrl)} alt="" loading="lazy" />
        : <span className={`address-row__thumb address-row__thumb--${a.placeType.toLowerCase()}`}><Icon aria-hidden="true" /></span>}
      <span className="directory__text">
        <strong>{a.publicCode}</strong>
        <span>{a.title}</span>
        <small>{PLACE_TYPE_LABELS[a.placeType]} · {a.district} · {a.city}{a.ownerName ? ` · ${a.ownerName}` : ''}</small>
      </span>
      <ChevronRight aria-hidden="true" />
    </Link>
  )
}
