import 'leaflet/dist/leaflet.css'
import type { ReactNode } from 'react'
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
 * (OpenStreetMap par défaut).
 */
export function BaseMap({ center = SENEGAL_CENTER, zoom = 6, interactive = true, label, children }: BaseMapProps) {
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
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
        />
        {children}
      </MapContainer>
    </div>
  )
}
