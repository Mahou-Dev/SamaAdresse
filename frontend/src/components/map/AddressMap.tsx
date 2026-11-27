import { useEffect } from 'react'
import { Marker, Polyline, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import type { AddressStatus, PlaceType } from '../../lib/api'
import { PLACE_TYPE_LABELS } from '../../lib/labels'
import { BaseMap } from './BaseMap'
import { pinIcon, type PinColor } from './pins'

export interface MapAddress {
  key: string
  publicCode: string
  title: string
  placeType: PlaceType
  district: string
  latitude: number
  longitude: number
  status?: AddressStatus
  href?: string
}

const STATUS_COLOR: Record<AddressStatus, PinColor> = {
  ACTIVE: 'green',
  SIGNALED: 'amber',
  SUSPENDED: 'red',
  ARCHIVED: 'slate',
}

function FitView({ addresses, selected, zoom }: { addresses: MapAddress[]; selected?: MapAddress; zoom: number }) {
  const map = useMap()
  const signature = addresses.map((a) => `${a.key}:${a.latitude},${a.longitude}`).join('|')
  useEffect(() => {
    if (selected) {
      map.setView([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15))
    } else if (addresses.length > 1) {
      map.fitBounds(addresses.map((a) => [a.latitude, a.longitude] as [number, number]), { padding: [40, 40], maxZoom: 15 })
    } else if (addresses.length === 1) {
      const center = map.getCenter()
      const target = addresses[0]
      if (Math.abs(center.lat - target.latitude) > 1e-6 || Math.abs(center.lng - target.longitude) > 1e-6) {
        map.setView([target.latitude, target.longitude], zoom)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature, selected, zoom])
  return null
}

interface AddressMapProps {
  addresses: MapAddress[]
  label: string
  selectedKey?: string
  onSelect?: (key: string) => void
  interactive?: boolean
  zoom?: number
  route?: Array<[number, number]>
}

function FitRoute({ route }: { route: Array<[number, number]> }) {
  const map = useMap()
  const signature = route.length ? `${route[0]}|${route[route.length - 1]}|${route.length}` : ''
  useEffect(() => {
    if (route.length > 1) map.fitBounds(route, { padding: [30, 30] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature])
  return null
}

export function AddressMap({ addresses, label, selectedKey, onSelect, interactive = true, zoom, route }: AddressMapProps) {
  const selected = addresses.find((a) => a.key === selectedKey)
  const center: [number, number] | undefined = addresses.length === 1 ? [addresses[0].latitude, addresses[0].longitude] : undefined
  const initialZoom = zoom ?? (center ? 16 : 6)
  return (
    <BaseMap label={label} interactive={interactive} center={center} zoom={initialZoom}>
      {route && route.length > 1
        ? <><Polyline positions={route} pathOptions={{ color: '#0b6cf0', weight: 5, opacity: .85 }} /><FitRoute route={route} /></>
        : <FitView addresses={addresses} selected={selected} zoom={initialZoom} />}
      {addresses.map((a) => (
        <Marker
          key={a.key}
          position={[a.latitude, a.longitude]}
          icon={pinIcon(a.status ? STATUS_COLOR[a.status] : 'blue', a.key === selectedKey)}
          title={`${a.publicCode} — ${a.title}`}
          eventHandlers={onSelect ? { click: () => onSelect(a.key) } : undefined}
        >
          {interactive && (
            <Popup>
              <strong className="map-popup-code">{a.publicCode}</strong>
              <span className="map-popup-meta">{a.title} · {PLACE_TYPE_LABELS[a.placeType]} · {a.district}</span>
              {a.href && <Link className="map-popup-link" to={a.href}>Voir la fiche →</Link>}
            </Popup>
          )}
        </Marker>
      ))}
    </BaseMap>
  )
}
