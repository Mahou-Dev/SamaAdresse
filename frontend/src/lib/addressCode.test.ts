import { describe, expect, it } from 'vitest'
import { codePrefix, codeSegment, gridCell, isValidCode, normalizeCode, provisionalCode } from './addressCode'

describe('code public SamaAdresse', () => {
  it('normalise et reconnaît les formats acceptés par le serveur', () => {
    expect(normalizeCode('  zig-kbg-4271 ')).toBe('ZIG-KBG-4271')
    expect(isValidCode('zig-kbg-4271')).toBe(true)
    expect(isValidCode('SN-12345678')).toBe(true)
    expect(isValidCode('ZIG-KBG-427')).toBe(false)
    expect(isValidCode('ZIG KBG 4271')).toBe(false)
    expect(isValidCode('')).toBe(false)
  })

  it('calcule le préfixe comme le serveur (accents retirés, repli SN)', () => {
    expect(codeSegment('Ziguinchor')).toBe('ZIG')
    expect(codeSegment('Kandé')).toBe('KAN')
    expect(codeSegment("Thiès-Est")).toBe('THI')
    expect(codeSegment('é')).toBe('SN')
    expect(codePrefix('Saint-Louis', 'Ndar Toute')).toBe('SAI-NDA')
  })

  it('calcule hors connexion la même case de grille que le serveur', () => {
    // Valeurs vérifiées par les tests Java (AddressCodeGeneratorTest).
    expect(gridCell(12.561235, -16.2731)).toBe('6126')
    expect(provisionalCode('Ziguinchor', 'Kandé', 12.5681, -16.2733)).toBe('ZIG-KAN-6826')
    expect(gridCell(14.6937, -17.4441)).toBe(gridCell(14.693999, -17.444001))
    expect(gridCell(14.694, -17.4441)).not.toBe(gridCell(14.6937, -17.4441))
    expect(isValidCode(provisionalCode('Dakar', 'Plateau', 14.67, -17.43))).toBe(true)
  })
})
