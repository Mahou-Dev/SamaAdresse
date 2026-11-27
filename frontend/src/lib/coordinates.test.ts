import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'
import { looksSwapped, parseCoordinate, parseCoordinatePair } from './coordinates'
import { isLocalOnlyUrl, publicAddressUrl } from './publicUrl'

describe('saisie des coordonnées', () => {
  it('accepte le point ou la virgule décimale', () => {
    expect(parseCoordinate('14.6937')).toBe(14.6937)
    expect(parseCoordinate(' 14,6937 ')).toBe(14.6937)
    expect(parseCoordinate('-17,4441')).toBe(-17.4441)
  })

  it('refuse les séparateurs mélangés ou multiples et le texte', () => {
    expect(parseCoordinate('14,693,7')).toBeNull()
    expect(parseCoordinate('14.693,7')).toBeNull()
    expect(parseCoordinate('14°41′N')).toBeNull()
    expect(parseCoordinate('')).toBeNull()
  })

  it('reconnaît une paire « latitude, longitude » collée', () => {
    expect(parseCoordinatePair('14.6937, -17.4441')).toEqual({ lat: 14.6937, lng: -17.4441 })
    expect(parseCoordinatePair('14,6937 -17,4441')).toEqual({ lat: 14.6937, lng: -17.4441 })
    expect(parseCoordinatePair('14,6937; -17,4441')).toEqual({ lat: 14.6937, lng: -17.4441 })
    expect(parseCoordinatePair('14,6937')).toBeNull()
  })

  it('détecte une inversion latitude/longitude au Sénégal', () => {
    expect(looksSwapped(-17.4441, 14.6937)).toBe(true)
    expect(looksSwapped(14.6937, -17.4441)).toBe(false)
    expect(looksSwapped(48.85, 2.35)).toBe(false)
  })
})

describe('lien public', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('construit /a/{code} sur l’origine de la page, code encodé', () => {
    expect(publicAddressUrl('DAK-PLA-9355')).toBe(`${window.location.origin}/a/DAK-PLA-9355`)
    expect(publicAddressUrl('A B/1')).toBe(`${window.location.origin}/a/A%20B%2F1`)
  })

  it('utilise VITE_PUBLIC_APP_URL sans doubler la barre oblique', () => {
    vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://samaadresse.sn/')
    expect(publicAddressUrl('DAK-PLA-9355')).toBe('https://samaadresse.sn/a/DAK-PLA-9355')
  })

  it('repère les liens qui ne s’ouvrent que sur cet ordinateur', () => {
    expect(isLocalOnlyUrl('http://localhost:5173/a/X')).toBe(true)
    expect(isLocalOnlyUrl('http://127.0.0.1:4173/a/X')).toBe(true)
    expect(isLocalOnlyUrl('http://192.168.1.20:5173/a/X')).toBe(false)
    expect(isLocalOnlyUrl('https://samaadresse.sn/a/X')).toBe(false)
    expect(isLocalOnlyUrl('pas une url')).toBe(false)
  })
})

describe('copie', () => {
  it('utilise l’API du presse-papiers quand elle existe', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    expect(await copyText('DAK-PLA-9355')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('DAK-PLA-9355')
    vi.unstubAllGlobals()
  })

  it('se rabat sur la copie classique sans API (page http non sécurisée)', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec
    expect(await copyText('DAK-PLA-9355')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
    exec.mockReturnValue(false)
    expect(await copyText('x')).toBe(false)
    vi.unstubAllGlobals()
  })
})
