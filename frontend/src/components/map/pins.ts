import L from 'leaflet'

export const PIN_COLORS = {
  blue: '#0b6cf0',
  green: '#13b07f',
  amber: '#f2a33a',
  red: '#e5484d',
  slate: '#7b8ca1',
} as const

export type PinColor = keyof typeof PIN_COLORS

const cache = new Map<string, L.DivIcon>()

/** Marqueur SVG inline : pas de fichier image à résoudre par le bundler, couleur selon le statut. */
export function pinIcon(color: PinColor, selected = false): L.DivIcon {
  const key = `${color}-${selected}`
  const cached = cache.get(key)
  if (cached) return cached
  const size = selected ? 44 : 34
  const icon = L.divIcon({
    className: 'map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2C9.9 2 5 6.8 5 12.8 5 21 16 30 16 30s11-9 11-17.2C27 6.8 22.1 2 16 2Z" fill="${PIN_COLORS[color]}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="12.6" r="4.4" fill="#fff"/></svg>`,
  })
  cache.set(key, icon)
  return icon
}
