/** Centre et emprise approximatifs du Sénégal, alignés sur la zone de service du backend. */
export const SENEGAL_CENTER: [number, number] = [14.45, -14.45]
export const SENEGAL_BOUNDS = { minLat: 12.0, maxLat: 16.8, minLng: -17.6, maxLng: -11.3 }

export function isInServiceArea(lat: number, lng: number) {
  return lat >= SENEGAL_BOUNDS.minLat && lat <= SENEGAL_BOUNDS.maxLat
    && lng >= SENEGAL_BOUNDS.minLng && lng <= SENEGAL_BOUNDS.maxLng
}

export function osmUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`
}

/** Itinéraire calculé par OpenStreetMap (service externe), destination seule. */
export function osmDirectionsUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/directions?route=%3B${lat}%2C${lng}`
}
