import { describe, expect, it } from 'vitest'
import { formatOutOfZoneMessage, getAllZones, getQuartierName, getZoneName, resolveQuartier } from './geoGrid'

describe('geoGrid (miroir exact de GeoGridService.java)', () => {
  it('résout Ziguinchor / Boucotte-Kangourou, Dakar Plateau et Saint-Louis', () => {
    expect(resolveQuartier(12.5738, -16.265)).toMatchObject({ zoneCode: 'ZIG', code: 'KBG' })
    expect(resolveQuartier(14.668, -17.435)).toMatchObject({ zoneCode: 'DKR', code: 'PLT' })
    expect(resolveQuartier(16.025, -16.495)).toMatchObject({ zoneCode: 'SL', code: 'NDR' })
  })

  it('résout les noms lisibles de zones et quartiers', () => {
    expect(getZoneName('ZIG')).toBe('Ziguinchor')
    expect(getZoneName('DKR')).toBe('Dakar')
    expect(getQuartierName('KBG', 'ZIG')).toBe('Boucotte - Kangourou')
    expect(getAllZones()).toHaveLength(3)
  })

  it('rejette les coordonnées hors zones couvertes', () => {
    expect(() => resolveQuartier(48.8566, 2.3522)).toThrow()
    expect(() => resolveQuartier(14.5, -15.5)).toThrow(/hors zone couverte/i)
    expect(formatOutOfZoneMessage()).toContain('Ziguinchor')
  })
})
