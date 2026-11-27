import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jsQR from 'jsqr'
import QRCode from 'qrcode'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { SESSION_KEY } from '../auth/AuthProvider'
import type { OwnerAddress, PublicAddress } from '../lib/api'

const api = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createMyAddress: vi.fn(),
  getMyAddress: vi.fn(),
  getPublicAddress: vi.fn(),
  sendAddressSms: vi.fn(),
  getRoute: vi.fn(),
  reportAddress: vi.fn(),
}))

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api')>()
  return { ...original, ...api }
})

const user = {
  id: 'u1', email: 'demo@samaadresse.sn', displayName: 'Compte démo', phoneNumber: '+221771234567',
  role: 'PROPRIETAIRE' as const, enabled: true, createdAt: '2026-10-19T08:00:00Z',
}
const created: OwnerAddress = {
  id: 'a1', publicCode: 'DKR-PLT-1024', title: 'Lieu fictif', placeType: 'MAISON',
  zone: 'DKR', quartier: 'PLT', district: 'Dakar Plateau', city: 'Dakar',
  description: null, latitude: 14.668, longitude: -17.435, status: 'ACTIVE',
  listed: true, publicationConsent: true, publiclyAccessible: true,
  createdAt: '2026-10-20T08:00:00Z', updatedAt: null, moderatedAt: null,
  photoUrl: null, hasPhoto: false, ownerNamePublic: false, moderationNotice: null,
}
const publicAddress: PublicAddress = {
  publicCode: 'DKR-PLT-1024', title: 'Lieu fictif', placeType: 'MAISON',
  zone: 'DKR', quartier: 'PLT', district: 'Dakar Plateau', city: 'Dakar',
  description: null, latitude: 14.668, longitude: -17.435, photoUrl: null, ownerName: null,
}

type GeoEvent = { lat: number; lng: number; accuracy: number } | { error: number }

function installGeolocation(events: GeoEvent[]) {
  const geo = {
    getCurrentPosition: vi.fn(),
    clearWatch: vi.fn(),
    watchPosition: vi.fn((success: PositionCallback, failure: PositionErrorCallback) => {
      setTimeout(() => {
        for (const e of events) {
          if ('error' in e) failure({ code: e.error, message: 'test', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
          else success({ coords: { latitude: e.lat, longitude: e.lng, accuracy: e.accuracy } as GeolocationCoordinates, timestamp: Date.now() } as GeolocationPosition)
        }
      }, 0)
      return 1
    }),
  }
  Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true })
  return geo
}

function visit(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

type U = ReturnType<typeof userEvent.setup>

async function goToLocationStep(u: U) {
  visit('/mes-adresses/nouvelle')
  await u.selectOptions(await screen.findByLabelText('Type de lieu'), 'MAISON')
  await u.type(screen.getByLabelText('Nom du lieu'), 'Lieu fictif')
  await u.click(screen.getByRole('button', { name: /Suivant/ }))
  await screen.findByLabelText('Latitude')
}

describe('code, partage et géolocalisation', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'jeton', expiresAt: new Date(Date.now() + 3600_000).toISOString(), user }))
    api.getCurrentUser.mockResolvedValue(user)
  })
  afterEach(() => {
    cleanup()
    Reflect.deleteProperty(navigator, 'geolocation')
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('garde la mesure GPS la plus précise, envoie exactement ces coordonnées et affiche le code serveur', async () => {
    installGeolocation([{ lat: 14.68, lng: -17.44, accuracy: 1800 }, { lat: 14.668, lng: -17.435, accuracy: 12 }])
    api.createMyAddress.mockResolvedValue(created)
    api.getMyAddress.mockResolvedValue(created)
    const u = userEvent.setup()
    await goToLocationStep(u)

    await u.click(screen.getByRole('button', { name: 'Utiliser ma position actuelle' }))
    expect(await screen.findByText(/précise à environ 12 m/)).toBeInTheDocument()
    expect(screen.getByLabelText('Latitude')).toHaveValue('14.668000')
    expect(screen.getByLabelText('Longitude')).toHaveValue('-17.435000')

    await u.click(screen.getByRole('button', { name: /Suivant/ }))
    await u.click(await screen.findByRole('button', { name: /Suivant/ }))
    await u.click(await screen.findByLabelText('Oui, référencer cette adresse dans l’annuaire public'))
    await u.click(screen.getByRole('button', { name: /Enregistrer l’adresse/ }))

    expect(api.createMyAddress).toHaveBeenCalledWith('jeton', expect.objectContaining({ latitude: 14.668, longitude: -17.435 }))
    expect(await screen.findByRole('heading', { level: 1, name: 'DKR-PLT-1024' })).toBeInTheDocument()
  })

  it('accepte la virgule décimale et repère une inversion latitude/longitude', async () => {
    api.createMyAddress.mockResolvedValue(created)
    api.getMyAddress.mockResolvedValue(created)
    const u = userEvent.setup()
    await goToLocationStep(u)
    await u.type(screen.getByLabelText('Latitude'), '-17,435')
    await u.type(screen.getByLabelText('Longitude'), '14,668')
    await u.click(screen.getByRole('button', { name: /Suivant/ }))
    expect(screen.getAllByText(/semblent inversées/)[0]).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Inverser latitude et longitude' }))
    expect(screen.getByLabelText('Latitude')).toHaveValue('14,668')
    await u.click(screen.getByRole('button', { name: /Suivant/ }))
    await u.click(await screen.findByRole('button', { name: /Suivant/ }))
    await u.click(await screen.findByLabelText('Non, accessible uniquement aux personnes à qui je transmets le code'))
    await u.click(screen.getByRole('button', { name: /Enregistrer l’adresse/ }))
    expect(api.createMyAddress).toHaveBeenCalledWith('jeton', expect.objectContaining({ latitude: 14.668, longitude: -17.435, listed: false }))
  })

  it('génère le QR code depuis l’URL de la fiche publique et prévient si le lien est local', async () => {
    api.getPublicAddress.mockResolvedValue(publicAddress)
    const toString = vi.spyOn(QRCode, 'toString')
    visit('/a/DKR-PLT-1024/partage')
    const expected = `${window.location.origin}/a/DKR-PLT-1024`
    expect(await screen.findByLabelText('Lien public')).toHaveValue(expected)
    await waitFor(() => expect(toString).toHaveBeenCalledWith(expected, expect.objectContaining({ type: 'svg' })))
    expect(await screen.findByRole('img', { name: `QR code menant à ${expected}` })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/ne s’ouvrira que sur cet ordinateur/)
  })
})

describe('contenu réel du QR code', () => {
  it('se décode exactement en URL de la fiche publique', () => {
    const url = 'https://samaadresse.onrender.com/a/ZIG-KBG-4271'
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
    const scale = 4
    const margin = 4
    const size = (qr.modules.size + margin * 2) * scale
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255)
    for (let row = 0; row < qr.modules.size; row++) {
      for (let col = 0; col < qr.modules.size; col++) {
        if (!qr.modules.get(row, col)) continue
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const i = (((row + margin) * scale + dy) * size + (col + margin) * scale + dx) * 4
            pixels[i] = pixels[i + 1] = pixels[i + 2] = 0
          }
        }
      }
    }
    expect(jsQR(pixels, size, size)?.data).toBe(url)
  })
})
