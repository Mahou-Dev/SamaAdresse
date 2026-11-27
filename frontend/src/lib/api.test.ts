import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError, createMyAddress, getCurrentUser, getPublicAddress, getRoute,
  listMyAddresses, login, normalizeSenegalPhone, reportAddress, searchDirectory, uploadMyAddressPhoto,
} from './api'

describe('getPublicAddress (Spring Boot /api/addresses/{code})', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('récupère et mappe une fiche publique avec les noms de zone/quartier de geo-grid.json', async () => {
    const backendPayload = {
      code: 'ZIG-KBG-4271',
      latitude: 12.5738,
      longitude: -16.265,
      zone: 'ZIG',
      quartier: 'KBG',
      description: 'Maison familiale — Portail bleu',
      locationType: 'MAISON',
      photoUrl: '/uploads/demo.jpg',
      createdAt: '2026-10-19T08:00:00Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendPayload), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getPublicAddress(' zig-kbg-4271 ')
    expect(result).toMatchObject({
      publicCode: 'ZIG-KBG-4271',
      title: 'Maison familiale',
      description: 'Portail bleu',
      placeType: 'MAISON',
      zone: 'ZIG',
      quartier: 'KBG',
      city: 'Ziguinchor',
      district: 'Boucotte - Kangourou',
      photoUrl: '/uploads/demo.jpg',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/addresses/ZIG-KBG-4271',
      { headers: { Accept: 'application/json' } },
    )
  })

  it('remonte 404 et 410 dans ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 410 })))

    await expect(getPublicAddress('ZIG-KBG-9999')).rejects.toMatchObject({ status: 404 })
    await expect(getPublicAddress('ZIG-KBG-0001')).rejects.toMatchObject({ status: 410 })
  })
})

describe('requêtes authentifiées et adaptateur backend', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envoie les identifiants en JSON avec credentials=include pour le cookie HttpOnly', async () => {
    const backendAuth = {
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: 'u1',
        fullName: 'Fatou Diallo',
        email: 'fatou@samaadresse.sn',
        phoneNumber: '+221771234567',
        role: 'PROPRIETAIRE',
        enabled: true,
        createdAt: '2026-10-19T08:00:00Z',
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(backendAuth), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await login({ email: 'fatou@samaadresse.sn', password: 'Password1' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(res.user.displayName).toBe('Fatou Diallo')
    expect(res.user.role).toBe('PROPRIETAIRE')
    expect(res.expiresIn).toBe(900)
  })

  it('interroge /api/addresses/mine avec Bearer token et emballe la liste en Page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        id: 'a1', code: 'ZIG-KBG-4271', latitude: 12.5738, longitude: -16.265,
        zone: 'ZIG', quartier: 'KBG', description: 'Maison', photoUrl: null,
        locationType: 'MAISON', status: 'ACTIVE', listed: true, showOwnerName: false,
        createdAt: '2026-10-19T08:00:00Z',
      },
    ]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const page = await listMyAddresses('jeton-abc')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/addresses/mine')
    expect(init.headers.Authorization).toBe('Bearer jeton-abc')
    expect(page.totalElements).toBe(1)
    expect(page.items[0].publicCode).toBe('ZIG-KBG-4271')
  })

  it('parse ErrorResponse Spring Boot (message + fieldErrors)', async () => {
    const backendErr = {
      status: 400,
      error: 'Bad Request',
      message: 'Erreur de validation des champs',
      fieldErrors: { latitude: 'Hors zone couverte.' },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(backendErr), { status: 400 })))

    const error = await createMyAddress('t', {
      title: 'Lieu', placeType: 'MAISON', description: null,
      latitude: 48.8, longitude: 2.3, listed: true,
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      message: 'Erreur de validation des champs',
      fieldErrors: { latitude: 'Hors zone couverte.' },
    })
  })

  it('envoie la photo sur POST /api/addresses/{id}/photo dans le champ multipart « file »', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'a1', code: 'ZIG-KBG-4271', latitude: 12.5738, longitude: -16.265,
      zone: 'ZIG', quartier: 'KBG', description: 'Maison', photoUrl: '/uploads/1.jpg',
      locationType: 'MAISON', status: 'ACTIVE', listed: true, showOwnerName: false,
      createdAt: '2026-10-19T08:00:00Z',
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const blob = new Blob(['jpeg'], { type: 'image/jpeg' })
    const res = await uploadMyAddressPhoto('tok', 'a1', blob)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/addresses/a1/photo')
    expect(init.method).toBe('POST')
    expect((init.body as FormData).has('file')).toBe(true)
    expect(res.hasPhoto).toBe(true)
  })

  it('inverse les coordonnées GeoJSON [lon, lat] vers Leaflet [lat, lng] sur /api/public/route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      distance: 1450,
      duration: 320,
      geometry: { type: 'LineString', coordinates: [[-16.27, 12.56], [-16.265, 12.5738]] },
      steps: [{ instruction: 'Tout droit', distance: 1450, duration: 320 }],
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const route = await getRoute({ lat: 12.56, lng: -16.27 }, 'ZIG-KBG-4271', 'foot-walking')
    expect(fetchMock.mock.calls[0][0]).toContain('/api/public/route?fromLat=12.56&fromLon=-16.27&code=ZIG-KBG-4271&profile=foot-walking')
    expect(route.coordinates).toEqual([[12.56, -16.27], [12.5738, -16.265]])
    expect(route.steps).toHaveLength(1)
  })

  it('adapte la pagination Spring sur /api/public/directory et le signalement anonyme', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        content: [{
          code: 'ZIG-KBG-4271', zone: 'ZIG', quartier: 'KBG', locationType: 'COMMERCE',
          description: 'Boutique Teranga', photoUrl: null, createdAt: '2026-10-19T08:00:00Z', ownerName: 'Mamadou',
        }],
        number: 0, size: 12, totalElements: 1, totalPages: 1,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ACCEPTED', message: 'Merci' }), { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    const dir = await searchDirectory({ quartier: 'KBG', type: 'COMMERCE' })
    expect(dir.items[0].district).toBe('Boucotte - Kangourou')
    expect(dir.items[0].ownerName).toBe('Mamadou')

    const rep = await reportAddress('ZIG-KBG-4271', 'POSITION_INCORRECTE', 'Décalé')
    expect(fetchMock.mock.calls[1][0]).toBe('/api/public/addresses/ZIG-KBG-4271/reports')
    expect(rep.status).toBe('ACCEPTED')
  })

  it('normalise les numéros sénégalais et signale une coupure réseau par status 0', async () => {
    expect(normalizeSenegalPhone('77 123 45 67')).toBe('+221771234567')
    expect(normalizeSenegalPhone('+221 78-000-11-22')).toBe('+221780001122')

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(getCurrentUser('t')).rejects.toMatchObject({ status: 0 })
  })
})
