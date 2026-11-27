/**
 * Lecture de la position de l'appareil, en gardant la mesure la plus précise.
 *
 * Le premier relevé d'un navigateur est souvent approximatif : sur un ordinateur sans GPS, il vient
 * du Wi-Fi ou de l'adresse IP et peut être faux de plusieurs kilomètres. On écoute donc les relevés
 * pendant quelques secondes (watchPosition) et l'on garde le meilleur, sans jamais réutiliser une
 * position en cache (maximumAge: 0) ni inventer de coordonnées.
 */

export interface PositionFix {
  latitude: number
  longitude: number
  /** Rayon d'incertitude annoncé par l'appareil, en mètres. */
  accuracy: number
  /** Date de la mesure (millisecondes depuis 1970). */
  timestamp: number
}

export type GeolocationFailureKind = 'unsupported' | 'insecure' | 'denied' | 'unavailable' | 'timeout'

export class GeolocationFailure extends Error {
  readonly kind: GeolocationFailureKind

  constructor(kind: GeolocationFailureKind) {
    super(GEOLOCATION_MESSAGES[kind])
    this.name = 'GeolocationFailure'
    this.kind = kind
  }
}

export const GEOLOCATION_MESSAGES: Record<GeolocationFailureKind, string> = {
  unsupported: 'Ce navigateur ne permet pas la géolocalisation. Placez le point sur la carte ou saisissez les coordonnées.',
  insecure: 'La géolocalisation exige une connexion sécurisée (https). Ouvrez le site en https, ou placez le point sur la carte.',
  denied: 'Accès à la position refusé. Autorisez la localisation dans le navigateur, ou placez le point sur la carte.',
  unavailable: 'Position indisponible (pas de signal GPS ni de réseau). Placez le point sur la carte ou saisissez les coordonnées.',
  timeout: 'La position n’a pas pu être déterminée à temps. Réessayez à l’extérieur, ou placez le point sur la carte.',
}

/** Un relevé plus ancien que cela est considéré comme une position mémorisée, donc ignoré. */
export const MAX_FIX_AGE_MS = 60_000

export interface LocateOptions {
  /** Précision jugée suffisante pour s'arrêter tout de suite (mètres). */
  targetAccuracy?: number
  /** Durée maximale d'écoute (millisecondes). */
  maxWaitMs?: number
  /** Appelé à chaque nouveau meilleur relevé, pour afficher la progression. */
  onProgress?: (fix: PositionFix) => void
  now?: () => number
}

export function locateBestPosition(
  geolocation: Geolocation | undefined = typeof navigator !== 'undefined' ? navigator.geolocation : undefined,
  { targetAccuracy = 20, maxWaitMs = 15_000, onProgress, now = Date.now }: LocateOptions = {},
): Promise<PositionFix> {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return Promise.reject(new GeolocationFailure('insecure'))
  }
  if (!geolocation) return Promise.reject(new GeolocationFailure('unsupported'))

  return new Promise<PositionFix>((resolve, reject) => {
    const startedAt = now()
    let best: PositionFix | null = null
    let finished = false
    let watchId: number | null = null

    function finish(result: PositionFix | GeolocationFailure) {
      if (finished) return
      finished = true
      clearTimeout(timer)
      if (watchId !== null) geolocation!.clearWatch(watchId)
      if (result instanceof GeolocationFailure) reject(result)
      else resolve(result)
    }

    const timer = setTimeout(() => finish(best ?? new GeolocationFailure('timeout')), maxWaitMs)

    watchId = geolocation.watchPosition(
      (position) => {
        // Position mémorisée d'une ancienne session : jamais présentée comme position actuelle.
        if (startedAt - position.timestamp > MAX_FIX_AGE_MS) return
        const fix: PositionFix = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
        }
        if (!best || fix.accuracy < best.accuracy) {
          best = fix
          onProgress?.(fix)
        }
        if (best.accuracy <= targetAccuracy) finish(best)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) finish(new GeolocationFailure('denied'))
        else if (best) finish(best)
        else finish(new GeolocationFailure(error.code === error.TIMEOUT ? 'timeout' : 'unavailable'))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs },
    )
  })
}

export type AccuracyLevel = 'good' | 'fair' | 'poor'

/** ≤ 30 m : précis (GPS) ; ≤ 100 m : à vérifier ; au-delà : approximatif (Wi-Fi, réseau, IP). */
export function accuracyLevel(accuracy: number): AccuracyLevel {
  if (accuracy <= 30) return 'good'
  if (accuracy <= 100) return 'fair'
  return 'poor'
}

/** « 25 m » ou « 3,2 km ». */
export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(meters / 1000)} km`
}
