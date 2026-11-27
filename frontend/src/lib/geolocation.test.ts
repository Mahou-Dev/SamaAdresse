import { afterEach, describe, expect, it, vi } from 'vitest'
import { accuracyLevel, formatDistance, GeolocationFailure, locateBestPosition, MAX_FIX_AGE_MS } from './geolocation'

const NOW = Date.UTC(2026, 9, 20, 9, 0, 0)

/** Faux capteur : rejoue des relevés SIMULÉS (aucune position réelle n'est lue dans ces tests). */
function fakeGeolocation(events: Array<{ lat: number; lng: number; accuracy: number; age?: number } | { error: number }>) {
  const clearWatch = vi.fn()
  const geo = {
    clearWatch,
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn((success: PositionCallback, failure: PositionErrorCallback, options: PositionOptions) => {
      geo.options = options
      queueMicrotask(() => {
        for (const event of events) {
          if ('error' in event) {
            failure({ code: event.error, message: 'test', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
          } else {
            success({
              coords: { latitude: event.lat, longitude: event.lng, accuracy: event.accuracy } as GeolocationCoordinates,
              timestamp: NOW - (event.age ?? 0),
            } as GeolocationPosition)
          }
        }
      })
      return 7
    }),
    options: undefined as PositionOptions | undefined,
  }
  return geo
}

const now = () => NOW

describe('locateBestPosition', () => {
  afterEach(() => vi.useRealTimers())

  it('demande une mesure fraîche et précise, sans position en cache', async () => {
    const geo = fakeGeolocation([{ lat: 14.6937, lng: -17.4441, accuracy: 8 }])
    await locateBestPosition(geo as unknown as Geolocation, { now })
    expect(geo.options).toMatchObject({ enableHighAccuracy: true, maximumAge: 0 })
    expect(geo.clearWatch).toHaveBeenCalledWith(7)
  })

  it('garde le relevé le plus précis et conserve l’ordre latitude/longitude', async () => {
    const progress: number[] = []
    const geo = fakeGeolocation([
      { lat: 14.70, lng: -17.40, accuracy: 1800 },
      { lat: 14.6936, lng: -17.4440, accuracy: 60 },
      { lat: 14.6937, lng: -17.4441, accuracy: 12 },
    ])
    const fix = await locateBestPosition(geo as unknown as Geolocation, { now, onProgress: (f) => progress.push(f.accuracy) })
    expect(fix).toEqual({ latitude: 14.6937, longitude: -17.4441, accuracy: 12, timestamp: NOW })
    expect(progress).toEqual([1800, 60, 12])
  })

  it('ignore une position mémorisée trop ancienne', async () => {
    const geo = fakeGeolocation([
      { lat: 48.85, lng: 2.35, accuracy: 5, age: MAX_FIX_AGE_MS + 1 },
      { lat: 14.6937, lng: -17.4441, accuracy: 15 },
    ])
    const fix = await locateBestPosition(geo as unknown as Geolocation, { now })
    expect(fix.latitude).toBe(14.6937)
  })

  it('rend la meilleure mesure, même imprécise, si le capteur s’arrête', async () => {
    const geo = fakeGeolocation([{ lat: 14.7, lng: -17.4, accuracy: 2500 }, { error: 3 }])
    const fix = await locateBestPosition(geo as unknown as Geolocation, { now })
    expect(fix.accuracy).toBe(2500)
    expect(accuracyLevel(fix.accuracy)).toBe('poor')
  })

  it('distingue refus, indisponibilité et délai dépassé', async () => {
    await expect(locateBestPosition(fakeGeolocation([{ error: 1 }]) as unknown as Geolocation, { now }))
      .rejects.toMatchObject({ kind: 'denied' })
    await expect(locateBestPosition(fakeGeolocation([{ error: 2 }]) as unknown as Geolocation, { now }))
      .rejects.toMatchObject({ kind: 'unavailable' })
    await expect(locateBestPosition(fakeGeolocation([{ error: 3 }]) as unknown as Geolocation, { now }))
      .rejects.toMatchObject({ kind: 'timeout' })
  })

  it('échoue après le délai maximal sans aucun relevé, sans inventer de position', async () => {
    vi.useFakeTimers()
    const geo = fakeGeolocation([])
    const promise = locateBestPosition(geo as unknown as Geolocation, { now, maxWaitMs: 1000 })
    vi.advanceTimersByTime(1000)
    await expect(promise).rejects.toBeInstanceOf(GeolocationFailure)
    await expect(promise).rejects.toMatchObject({ kind: 'timeout' })
    expect(geo.clearWatch).toHaveBeenCalled()
  })

  it('signale l’absence de géolocalisation et les pages non sécurisées', async () => {
    await expect(locateBestPosition(undefined, { now })).rejects.toMatchObject({ kind: 'unsupported' })
    const original = Object.getOwnPropertyDescriptor(window, 'isSecureContext')
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true })
    try {
      await expect(locateBestPosition(fakeGeolocation([]) as unknown as Geolocation, { now })).rejects.toMatchObject({ kind: 'insecure' })
    } finally {
      if (original) Object.defineProperty(window, 'isSecureContext', original)
      else delete (window as { isSecureContext?: boolean }).isSecureContext
    }
  })
})

describe('précision', () => {
  it('classe et formate la précision annoncée', () => {
    expect(accuracyLevel(25)).toBe('good')
    expect(accuracyLevel(80)).toBe('fair')
    expect(accuracyLevel(450)).toBe('poor')
    expect(formatDistance(42.4)).toBe('42 m')
    expect(formatDistance(3240)).toBe('3,2 km')
  })
})
