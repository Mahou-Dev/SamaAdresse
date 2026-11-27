import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pinIcon } from '../components/map/pins'
import {
  ApiError,
  changePassword,
  getPublicAddress,
  getRoute,
  listAdminActions,
  listAdminAddresses,
  listReservedCodes,
  logoutSession,
  searchDirectory,
  topUpReservedCodes,
  type ReservedCodeItem,
} from './api'
import { getReservedCodes, storeReservedCodes, takeReservedCode } from './drafts'
import { errorMessage } from './errors'
import { getAllQuartiers, getQuartierName, getZoneName, resolveQuartier, resolveQuartierCode } from './geoGrid'
import { initials } from './labels'

function mockJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('geoGrid — résolution quartiers et noms humains (P1-01)', () => {
  it('résout les noms humains de quartiers (avec ou sans accents) vers leurs codes', () => {
    expect(resolveQuartierCode('Boucotte')).toBe('KBG')
    expect(resolveQuartierCode('Kandé')).toBe('KND')
    expect(resolveQuartierCode('kande')).toBe('KND')
    expect(resolveQuartierCode('Médina')).toBe('MED')
    expect(resolveQuartierCode('medina')).toBe('MED')
    expect(resolveQuartierCode('KBG')).toBe('KBG')
    expect(resolveQuartierCode('   ')).toBeNull()
    expect(resolveQuartierCode('QuartierInconnuXYZ')).toBeNull()
  })

  it('retourne tous les quartiers couverts et gère les codes inconnus avec repli lisible', () => {
    expect(getAllQuartiers().length).toBeGreaterThanOrEqual(8)
    expect(getZoneName('SL')).toBe('Saint-Louis')
    expect(getZoneName('XXX')).toBe('XXX')
    expect(getQuartierName('XXX', 'ZIG')).toBe('XXX')
    // Coordonnées dans une zone couverte mais entre deux polygones -> repli vers le quartier le plus proche
    const nearZig = resolveQuartier(12.551, -16.299)
    expect(nearZig.zoneCode).toBe('ZIG')
  })
})

describe('drafts — réserve locale de codes serveur (P1-02)', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
      clear: () => { store.clear() },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stocke, filtre les codes expirés/utilisés et consomme un code sans doublon', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const past = new Date(Date.now() - 86_400_000).toISOString()
    const items: ReservedCodeItem[] = [
      { id: '1', code: 'ZIG-KBG-1111', zone: 'ZIG', quartier: 'KBG', status: 'RESERVED', expiresAt: future },
      { id: '2', code: 'ZIG-KBG-2222', zone: 'ZIG', quartier: 'KBG', status: 'RESERVED', expiresAt: future },
      { id: '3', code: 'ZIG-KBG-3333', zone: 'ZIG', quartier: 'KBG', status: 'USED', expiresAt: future },
      { id: '4', code: 'ZIG-KBG-4444', zone: 'ZIG', quartier: 'KBG', status: 'RESERVED', expiresAt: past },
    ]
    storeReservedCodes('user-1', items)
    expect(getReservedCodes('user-1')).toHaveLength(2)

    expect(takeReservedCode('user-1', 'ZIG', 'KBG')).toBe('ZIG-KBG-1111')
    expect(takeReservedCode('user-1', 'ZIG', 'KBG')).toBe('ZIG-KBG-2222')
    expect(takeReservedCode('user-1', 'ZIG', 'KBG')).toBeNull()
    expect(takeReservedCode('user-1', 'SL', 'NDR')).toBeNull()
  })
})

describe('api — nouveaux endpoints de remédiation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('changePassword, logoutSession, reservedCodes et admin endpoints envoient les bons contrats HTTP', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ message: 'Mot de passe mis à jour.' }))
      .mockResolvedValueOnce(mockJsonResponse({ message: 'Déconnexion effectuée.' }))
      .mockResolvedValueOnce(mockJsonResponse([{ id: 'r1', code: 'SL-NDR-1001', zone: 'SL', quartier: 'NDR', status: 'RESERVED', expiresAt: '2027-01-01T00:00:00Z' }]))
      .mockResolvedValueOnce(mockJsonResponse([{ id: 'r1', code: 'SL-NDR-1001', zone: 'SL', quartier: 'NDR', status: 'RESERVED', expiresAt: '2027-01-01T00:00:00Z' }]))
      .mockResolvedValueOnce(mockJsonResponse({ content: [{ id: 'a1', adminId: 'u1', adminEmail: 'admin@samaadresse.sn', action: 'SUSPEND', addressId: 'addr1', addressCode: 'ZIG-KBG-4271', reportId: null, reason: 'Motif', createdAt: '2026-10-20T10:00:00Z' }], number: 0, size: 20, totalElements: 1, totalPages: 1 }))
      .mockResolvedValueOnce(mockJsonResponse({ content: [{ id: 'addr1', code: 'ZIG-KBG-4271', latitude: 12.57, longitude: -16.26, zone: 'ZIG', quartier: 'KBG', description: 'Maison', photoUrl: null, locationType: 'MAISON', status: 'ACTIVE', listed: false, showOwnerName: false, createdAt: '2026-10-20T10:00:00Z' }], number: 0, size: 50, totalElements: 1, totalPages: 1 }))

    const pwd = await changePassword('tok', 'OldPass123!', 'NewPass456!')
    expect(pwd.message).toContain('mis à jour')
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/change-password')

    await logoutSession('tok')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/auth/logout')
    expect((fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>)?.Authorization).toBe('Bearer tok')

    const list = await listReservedCodes('tok')
    expect(list).toHaveLength(1)
    const topped = await topUpReservedCodes('tok', 'sl')
    expect(topped[0]?.code).toBe('SL-NDR-1001')
    expect(fetchMock.mock.calls[3]?.[0]).toBe('/api/address-codes/reservations?zone=SL')

    const actions = await listAdminActions('tok', 0, 20)
    expect(actions.items[0]?.action).toBe('SUSPEND')
    const addrs = await listAdminAddresses('tok', 'ACTIVE', 'ZIG', 0, 50)
    expect(addrs.items[0]?.listed).toBe(false)
    expect(fetchMock.mock.calls[5]?.[0]).toContain('/api/admin/addresses?status=ACTIVE&q=ZIG')
  })

  it('mappe latitude/longitude de searchDirectory, ownerName de getPublicAddress et approximateFallback de getRoute', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        content: [{
          code: 'ZIG-KBG-4271', zone: 'ZIG', quartier: 'KBG', locationType: 'COMMERCE',
          description: 'Boutique — Portail bleu', photoUrl: null, createdAt: '2026-10-20T10:00:00Z',
          latitude: 12.5738, longitude: -16.265, ownerName: 'Aminata Diop',
        }],
        number: 0, size: 12, totalElements: 1, totalPages: 1,
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        code: 'ZIG-KBG-4271', zone: 'ZIG', quartier: 'KBG', locationType: 'COMMERCE',
        description: 'Boutique — Portail bleu', photoUrl: null, latitude: 12.5738, longitude: -16.265,
        ownerName: 'Aminata Diop',
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        distance: 840, duration: 600, approximateFallback: true,
        geometry: { type: 'LineString', coordinates: [[-16.27, 12.57], [-16.265, 12.5738]] },
        steps: [{ instruction: 'Distance directe approximative vers ZIG-KBG-4271', distance: 840, duration: 600 }],
      }))

    const dir = await searchDirectory({ q: 'Boutique' }, 0, 12)
    expect(dir.items[0]?.latitude).toBe(12.5738)
    expect(dir.items[0]?.longitude).toBe(-16.265)

    const pub = await getPublicAddress('ZIG-KBG-4271')
    expect(pub.ownerName).toBe('Aminata Diop')

    const route = await getRoute({ lat: 12.57, lng: -16.27 }, 'ZIG-KBG-4271', 'foot-walking')
    expect(route.approximateFallback).toBe(true)
    expect(route.coordinates).toEqual([[12.57, -16.27], [12.5738, -16.265]])
  })
})

describe('utilitaires UI (pins, errors, labels)', () => {
  it('construit et met en cache les icônes SVG de marqueurs Leaflet et formate les libellés', () => {
    const icon1 = pinIcon('blue', false)
    const icon2 = pinIcon('blue', false)
    const iconSelected = pinIcon('red', true)
    expect(icon1).toBe(icon2)
    expect(iconSelected).not.toBe(icon1)
    expect(errorMessage(new ApiError('Message API', 400))).toBe('Message API')
    expect(errorMessage(new Error('Boom'))).toBe('Une erreur inattendue est survenue.')
    expect(errorMessage('inconnu')).toBe('Une erreur inattendue est survenue.')
    expect(initials('Awa Diallo')).toBe('AD')
    expect(initials('Single')).toBe('S')
  })
})
