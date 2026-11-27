import { ChevronRight, CirclePlus, Globe, LocateFixed, MapPinned, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { AddressMap, type MapAddress } from '../components/map/AddressMap'
import { StatusBadge } from '../components/StatusBadge'
import { apiUrl, listAllMyAddresses, searchDirectory, type AddressStatus, type DirectoryItem, type PlaceType } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { getAllQuartiers, getAllZones } from '../lib/geoGrid'
import { PLACE_TYPE_LABELS } from '../lib/labels'
import { PLACE_TYPE_ICONS } from '../lib/placeIcons'

type Filter = 'ALL' | PlaceType
type Source = 'public' | 'mine'
const FILTERS: Filter[] = ['ALL', 'MAISON', 'COMMERCE', 'INSTITUTION']

interface MapItem extends MapAddress {
  city: string
  href: string
  photoUrl: string | null
}

type LoadState = { kind: 'loading' } | { kind: 'ready'; items: MapItem[]; truncated: boolean } | { kind: 'error'; message: string }

function fallbackCoords(item: DirectoryItem): { latitude: number; longitude: number } | null {
  const quartier = getAllQuartiers().find(
    (q) => q.code.toUpperCase() === item.quartier.toUpperCase() && q.zoneCode.toUpperCase() === item.zone.toUpperCase(),
  )
  if (quartier) {
    return {
      latitude: (quartier.latMin + quartier.latMax) / 2,
      longitude: (quartier.lonMin + quartier.lonMax) / 2,
    }
  }
  const zone = getAllZones().find((z) => z.code.toUpperCase() === item.zone.toUpperCase())
  if (zone) {
    return {
      latitude: (zone.latMin + zone.latMax) / 2,
      longitude: (zone.lonMin + zone.lonMax) / 2,
    }
  }
  return null
}

function mapDirectoryToMapItems(items: DirectoryItem[]): MapItem[] {
  // P2-01 : latitude/longitude sont directement renvoyées par /api/public/directory (0 requête N+1).
  return items
    .map((item): MapItem | null => {
      const coords =
        typeof item.latitude === 'number' && typeof item.longitude === 'number'
          ? { latitude: item.latitude, longitude: item.longitude }
          : fallbackCoords(item)
      if (!coords) return null
      return {
        key: item.publicCode,
        publicCode: item.publicCode,
        title: item.title,
        placeType: item.placeType,
        district: item.district,
        city: item.city,
        latitude: coords.latitude,
        longitude: coords.longitude,
        href: `/a/${encodeURIComponent(item.publicCode)}`,
        photoUrl: item.photoUrl,
      }
    })
    .filter((x): x is MapItem => x !== null)
}

export function MapPage() {
  const { status: authStatus, token } = useAuth()
  const signedIn = authStatus === 'authenticated'
  const [source, setSource] = useState<Source>('public')
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [filter, setFilter] = useState<Filter>('ALL')
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>()
  const [position, setPosition] = useState<MapAddress | null>(null)
  const [geoMessage, setGeoMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    setSelectedKey(undefined)
    const load = source === 'mine' && token
      ? listAllMyAddresses(token).then((list) => ({
        truncated: false,
        items: list.map((a): MapItem => ({
          key: a.id,
          publicCode: a.publicCode,
          title: a.title,
          placeType: a.placeType,
          district: a.district,
          city: a.city,
          latitude: a.latitude,
          longitude: a.longitude,
          status: a.status,
          href: `/mes-adresses/${a.id}`,
          photoUrl: a.photoUrl,
        })),
      }))
      : searchDirectory({}, 0, 50).then((page) => ({
        truncated: page.totalElements > 50,
        items: mapDirectoryToMapItems(page.items),
      }))
    load
      .then((r) => { if (!cancelled) setState({ kind: 'ready', ...r }) })
      .catch((error: unknown) => { if (!cancelled) setState({ kind: 'error', message: errorMessage(error) }) })
    return () => { cancelled = true }
  }, [source, token])

  const all = useMemo(() => (state.kind === 'ready' ? state.items : []), [state])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((a) => (filter === 'ALL' || a.placeType === filter)
      && (!q || [a.publicCode, a.title, a.district, a.city].some((v) => v.toLowerCase().includes(q))))
  }, [all, filter, query])
  const markers = useMemo<MapAddress[]>(() => (position ? [...visible, position] : visible), [visible, position])
  const selected = visible.find((a) => a.key === selectedKey)

  function centerOnMe() {
    if (!('geolocation' in navigator)) {
      setGeoMessage('Votre navigateur ne permet pas la géolocalisation.')
      return
    }
    setGeoMessage('Localisation…')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoMessage(null)
        setPosition({
          key: 'ma-position',
          publicCode: 'Ma position',
          title: 'Position actuelle',
          placeType: 'MAISON',
          district: '—',
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        })
        setSelectedKey(undefined)
      },
      () => setGeoMessage('Position indisponible ou accès refusé.'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <main className={signedIn ? 'app-page map-page' : 'app-page map-page page-standalone'}>
      <div className="app-page__head">
        <div>
          <h1>Carte des adresses</h1>
          <p className="muted">{source === 'public' ? 'Adresses actives référencées dans l’annuaire SamaAdresse.' : 'Vert : active · Orange : signalée · Rouge : suspendue · Gris : archivée.'}</p>
        </div>
        {signedIn && <Link className="button button-primary" to="/mes-adresses/nouvelle"><CirclePlus aria-hidden="true" />Créer une adresse</Link>}
      </div>

      <div className="map-page__toolbar">
        {signedIn && (
          <div className="search-tabs search-tabs--two" role="tablist" aria-label="Adresses affichées">
            <button type="button" role="tab" aria-selected={source === 'public'} onClick={() => setSource('public')}><Globe aria-hidden="true" />Annuaire public</button>
            <button type="button" role="tab" aria-selected={source === 'mine'} onClick={() => setSource('mine')}><MapPinned aria-hidden="true" />Mes adresses</button>
          </div>
        )}
        <div className="input-icon map-page__search">
          <Search aria-hidden="true" />
          <label className="visually-hidden" htmlFor="map-search">Filtrer les adresses de la carte</label>
          <input className="input" id="map-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une adresse, un quartier…" />
        </div>
        <div className="chip-row" role="group" aria-label="Type de lieu">
          {FILTERS.map((f) => {
            const Icon = f === 'ALL' ? null : PLACE_TYPE_ICONS[f]
            return (
              <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {Icon && <Icon aria-hidden="true" />}{f === 'ALL' ? 'Tous' : PLACE_TYPE_LABELS[f]}
              </button>
            )
          })}
        </div>
      </div>

      {state.kind === 'loading' && <p className="loading" role="status">Chargement de la carte…</p>}
      {state.kind === 'error' && <p className="alert alert--error" role="alert">{state.message}</p>}
      {state.kind === 'ready' && (
        <div className="map-page__body">
          <div className="map-frame map-page__map">
            <AddressMap addresses={markers} label="Carte des adresses" selectedKey={selectedKey ?? position?.key} onSelect={(key) => key !== 'ma-position' && setSelectedKey(key)} />
            <button className="map-floating-button" type="button" onClick={centerOnMe}><LocateFixed aria-hidden="true" />Centrer sur ma position</button>
          </div>
          <aside className="map-page__panel" aria-label="Résultats">
            {geoMessage && <p className="alert" role="status">{geoMessage}</p>}
            {state.truncated && <p className="alert alert--warning">Les 50 adresses publiques les plus récentes sont affichées sur la carte. Utilisez la recherche pour filtrer tout l’annuaire.</p>}
            {selected && (
              <div className="map-selected">
                {selected.photoUrl && <img className="map-selected__photo" src={apiUrl(selected.photoUrl)} alt={`Façade : ${selected.title}`} />}
                <span className="kicker">Adresse sélectionnée</span>
                <h2>{selected.publicCode}</h2>
                <p>{selected.title} · {selected.district}, {selected.city}</p>
                {selected.status && <StatusBadge status={selected.status as AddressStatus} />}
                <Link className="button button-primary button-block" to={selected.href}>Ouvrir la fiche</Link>
              </div>
            )}
            <p className="list-count">{visible.length} adresse{visible.length > 1 ? 's' : ''} affichée{visible.length > 1 ? 's' : ''}</p>
            {visible.length === 0 && <p className="muted">{all.length === 0 ? (source === 'public' ? 'Aucune adresse publique pour le moment.' : 'Vous n’avez encore aucune adresse.') : 'Aucune adresse ne correspond à ce filtre.'}</p>}
            <ul className="map-page__list">
              {visible.map((a) => (
                <li key={a.key}>
                  <button type="button" className={a.key === selectedKey ? 'map-item map-item--active' : 'map-item'} onClick={() => setSelectedKey(a.key)}>
                    <span><strong>{a.publicCode}</strong><small>{a.title} · {a.district}</small></span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </main>
  )
}
