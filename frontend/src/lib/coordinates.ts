import { isInServiceArea } from './geo'

/**
 * Convertit une coordonnée saisie (« 14.6937 » ou « 14,6937 ») en nombre.
 * Une seule virgule décimale est acceptée : « 14,693,7 » ou « 14.693,7 » sont refusés.
 */
export function parseCoordinate(value: string): number | null {
  const trimmed = value.trim()
  if ((trimmed.match(/[.,]/g) ?? []).length > 1) return null
  const normalized = trimmed.replace(',', '.')
  if (!/^-?\d{1,3}(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

/**
 * Reconnaît une paire collée dans un seul champ, dans l'ordre latitude, longitude
 * (format de Google Maps et d'OpenStreetMap) : « 14.6937, -17.4441 » ou « 14,6937 -17,4441 ».
 */
export function parseCoordinatePair(value: string): { lat: number; lng: number } | null {
  const text = value.trim()
  // Séparateur : point-virgule, ou virgule suivie d'un espace, ou espaces seuls.
  const parts = text.includes(';') ? text.split(';')
    : /,\s/.test(text) ? text.split(/,\s+/)
      : text.split(/\s+/)
  if (parts.length !== 2) return null
  const lat = parseCoordinate(parts[0])
  const lng = parseCoordinate(parts[1])
  return lat === null || lng === null ? null : { lat, lng }
}

/**
 * Vrai si le point est hors du Sénégal mais y tomberait en inversant latitude et longitude :
 * erreur fréquente lors d'une saisie manuelle (la longitude du Sénégal est négative, vers -17).
 */
export function looksSwapped(lat: number, lng: number) {
  return !isInServiceArea(lat, lng) && isInServiceArea(lng, lat)
}
