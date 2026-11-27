import { ExternalLink, FileText, House, ImageOff, MapPin, Navigation, Building2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { osmDirectionsUrl, osmUrl } from '../lib/geo'
import type { PlaceType } from '../lib/api'
import { PLACE_TYPE_LABELS } from '../lib/labels'
import { AddressMap } from './map/AddressMap'

interface DetailsAddress {
  publicCode: string
  title: string
  placeType: PlaceType
  district: string
  city: string
  description: string | null
  latitude: number
  longitude: number
  photoUrl?: string | null
}

/**
 * Corps commun des fiches (propriétaire et publique) : bannière, informations, mini-carte.
 * `badge` et `actions` sont fournis par la page selon le contexte.
 */
export function AddressDetails({ address, badge, actions, route, routeControls }: {
  address: DetailsAddress
  badge: ReactNode
  actions: ReactNode
  /** Itinéraire à tracer sur la mini-carte. */
  route?: Array<[number, number]>
  /** Commandes d'itinéraire propres à la page ; à défaut, lien vers l'itinéraire OpenStreetMap. */
  routeControls?: ReactNode
}) {
  const a = address
  // Photo indisponible (réseau, suppression) : on revient à l'emplacement « aucune photo ».
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)
  const photo = a.photoUrl && a.photoUrl !== brokenUrl ? a.photoUrl : null
  return (
    <article className="address-sheet">
      <div className="address-sheet__banner">
        {photo
          ? <img src={photo} alt={`Façade : ${a.title}`} onError={() => setBrokenUrl(photo)} />
          : <div className="address-sheet__no-photo"><ImageOff aria-hidden="true" /><span>Aucune photo publiée</span></div>}
      </div>
      <header className="address-sheet__head">
        <div>
          <h1 className="address-sheet__code" id="address-code">{a.publicCode}</h1>
          <p className="address-sheet__meta">{a.title} · {PLACE_TYPE_LABELS[a.placeType]} · {a.district} · {a.city}</p>
        </div>
        {badge}
      </header>
      <div className="address-sheet__body">
        <section className="address-sheet__info" aria-labelledby="info-title">
          <h2 className="panel-title" id="info-title">Informations</h2>
          <dl className="info-list">
            <div><span className="info-icon"><House aria-hidden="true" /></span><span><dt>Type de lieu</dt><dd>{PLACE_TYPE_LABELS[a.placeType]}</dd></span></div>
            <div><span className="info-icon"><Building2 aria-hidden="true" /></span><span><dt>Quartier · Ville</dt><dd>{a.district}, {a.city}</dd></span></div>
            <div><span className="info-icon"><MapPin aria-hidden="true" /></span><span><dt>Coordonnées GPS</dt><dd>{a.latitude.toFixed(6)}, {a.longitude.toFixed(6)}</dd></span></div>
            {a.description && <div><span className="info-icon"><FileText aria-hidden="true" /></span><span><dt>Repères</dt><dd>{a.description}</dd></span></div>}
          </dl>
        </section>
        <section className="address-sheet__map" aria-label="Position sur la carte">
          <div className="map-frame address-sheet__map-frame">
            <AddressMap addresses={[{ key: a.publicCode, ...a }]} label={`Position de ${a.publicCode}`} zoom={16} route={route} />
          </div>
          <a className="button button-secondary button-block" href={osmUrl(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" />Voir sur OpenStreetMap
          </a>
          {routeControls ?? (
            <a className="button button-primary button-block" href={osmDirectionsUrl(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer">
              <Navigation aria-hidden="true" />Itinéraire (OpenStreetMap)
            </a>
          )}
        </section>
      </div>
      <footer className="address-sheet__actions">{actions}</footer>
    </article>
  )
}
