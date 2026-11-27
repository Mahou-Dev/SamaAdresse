import { latLng, type Marker as LeafletMarker } from 'leaflet'
import { useEffect } from 'react'
import { Circle, Marker, useMap, useMapEvents } from 'react-leaflet'
import { BaseMap } from './BaseMap'
import { pinIcon } from './pins'

interface LocationPickerProps {
  value: { lat: number; lng: number } | null
  onChange: (lat: number, lng: number) => void
  /** Incertitude du relevé GPS en mètres : dessinée en cercle autour du point. */
  accuracy?: number
}

function ClickToPlace({ onChange }: Pick<LocationPickerProps, 'onChange'>) {
  useMapEvents({ click: (event) => onChange(event.latlng.lat, event.latlng.lng) })
  return null
}

/**
 * Recentre la carte quand le point change. Dépend des nombres et non de l'objet : la page recrée
 * l'objet à chaque rendu, ce qui ramenait la carte sur le point dès que la personne la déplaçait.
 */
function FollowValue({ lat, lng, accuracy }: { lat?: number; lng?: number; accuracy?: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat === undefined || lng === undefined) return
    // Relevé imprécis : on montre toute la zone d'incertitude pour que la personne situe le vrai lieu.
    if (accuracy !== undefined && accuracy > 50) map.fitBounds(latLng(lat, lng).toBounds(accuracy * 2), { padding: [20, 20] })
    else map.setView([lat, lng], Math.max(map.getZoom(), 16))
  }, [map, lat, lng, accuracy])
  return null
}

/** Sélection du point : clic sur la carte ou déplacement du marqueur. */
export function LocationPicker({ value, onChange, accuracy }: LocationPickerProps) {
  return (
    <BaseMap label="Carte de sélection de la position" zoom={value ? 16 : 6} center={value ? [value.lat, value.lng] : undefined}>
      <ClickToPlace onChange={onChange} />
      <FollowValue lat={value?.lat} lng={value?.lng} accuracy={accuracy} />
      {value && accuracy !== undefined && (
        <Circle center={[value.lat, value.lng]} radius={accuracy} interactive={false}
          pathOptions={{ color: '#0b6cf0', weight: 1, fillOpacity: 0.12 }} />
      )}
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon('blue', true)}
          draggable
          title="Position de l’adresse (déplaçable)"
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = (event.target as LeafletMarker).getLatLng()
              onChange(lat, lng)
            },
          }}
        />
      )}
    </BaseMap>
  )
}
