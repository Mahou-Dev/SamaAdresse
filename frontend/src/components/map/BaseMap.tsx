import 'leaflet/dist/leaflet.css'
import { useState, type ReactNode } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { SENEGAL_CENTER } from '../../lib/geo'

const TILE_URL =
  import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  import.meta.env.VITE_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>'

interface BaseMapProps {
  center?: [number, number]
  zoom?: number
  interactive?: boolean
  label: string
  children?: ReactNode
}

/**
 * Carte Leaflet avec tuiles configurables via VITE_TILE_URL / VITE_TILE_ATTRIBUTION
 * (OpenStreetMap par défaut) et détection explicite des erreurs de chargement de tuiles.
 */
export function BaseMap({ center = SENEGAL_CENTER, zoom = 6, interactive = true, label, children }: BaseMapProps) {
  const [tileError, setTileError] = useState(false)

  return (
    <div className="map-canvas" role="region" aria-label={label}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        zoomControl={interactive}
        keyboard={interactive}
        className="map-canvas__leaflet"
      >
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        {children}
      </MapContainer>
      {tileError && (
        <p className="map-tile-notice" role="status">
          Fond de carte partiellement indisponible (connexion lente ou hors ligne) ; les marqueurs restent exacts.
        </p>
      )}
    </div>
  )
}
