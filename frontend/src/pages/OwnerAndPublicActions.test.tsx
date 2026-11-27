import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { SESSION_KEY } from '../auth/AuthProvider'
import { ApiError, type OwnerAddress, type PublicAddress } from '../lib/api'

const api = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getMyAddress: vi.fn(),
  updateMyAddress: vi.fn(),
  archiveMyAddress: vi.fn(),
  restoreMyAddress: vi.fn(),
  sendAddressSms: vi.fn(),
  getPublicAddress: vi.fn(),
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
const activeAddress: OwnerAddress = {
  id: 'a1', publicCode: 'ZIG-KBG-4271', title: 'Maison Diop', placeType: 'MAISON',
  zone: 'ZIG', quartier: 'KBG', district: 'Boucotte - Kangourou', city: 'Ziguinchor',
  description: null, latitude: 12.5738, longitude: -16.265, status: 'ACTIVE',
  listed: true, publicationConsent: true, publiclyAccessible: true,
  createdAt: '2026-10-19T08:00:00Z', updatedAt: null, moderatedAt: null,
  photoUrl: null, hasPhoto: false, ownerNamePublic: false, moderationNotice: null,
}
const publicAddress: PublicAddress = {
  publicCode: 'ZIG-KBG-4271', title: 'Maison Diop', placeType: 'MAISON',
  zone: 'ZIG', quartier: 'KBG', district: 'Boucotte - Kangourou', city: 'Ziguinchor',
  description: null, latitude: 12.5738, longitude: -16.265, photoUrl: null, ownerName: null,
}

function signIn() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'jeton', expiresAt: new Date(Date.now() + 3600_000).toISOString(), user }))
  api.getCurrentUser.mockResolvedValue(user)
}

function visit(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('gestion par le propriétaire', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
    signIn()
    api.getMyAddress.mockResolvedValue(activeAddress)
  })
  afterEach(() => cleanup())

  it('met à jour le libellé et la visibilité via PATCH /api/addresses/{id}', async () => {
    api.updateMyAddress.mockResolvedValue({ ...activeAddress, title: 'Maison Diop Boucotte' })
    const u = userEvent.setup()
    visit('/mes-adresses/a1')

    const title = await screen.findByLabelText('Nom du lieu')
    await u.clear(title)
    await u.type(title, 'Maison Diop Boucotte')
    await u.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(api.updateMyAddress).toHaveBeenCalledWith('jeton', 'a1', expect.objectContaining({ title: 'Maison Diop Boucotte', listed: true }))
    expect(await screen.findByText('Modifications enregistrées.')).toBeInTheDocument()
  })

  it('normalise et envoie le lien par SMS sur POST /api/addresses/{code}/share/sms', async () => {
    api.sendAddressSms.mockResolvedValueOnce({ status: 'SENT', maskedPhone: '+221 77 *** ** 67' })
    api.sendAddressSms.mockRejectedValueOnce(new ApiError('Le service SMS est momentanément indisponible.', 502))
    const u = userEvent.setup()
    visit('/mes-adresses/a1')

    await u.type(await screen.findByLabelText('Numéro du destinataire'), '77 123 45 67')
    await u.click(screen.getByRole('button', { name: 'Envoyer' }))
    expect(api.sendAddressSms).toHaveBeenCalledWith('jeton', 'ZIG-KBG-4271', '+221771234567')
    expect(await screen.findByText(/SMS envoyé au \+221 77 \*\*\* \*\* 67/)).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Envoyer' }))
    expect(await screen.findByText(/indisponible/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ouvrir ma messagerie/ }).getAttribute('href')).toMatch(/^sms:/)
  })

  it('archive après confirmation puis permet la restauration', async () => {
    const archived = { ...activeAddress, status: 'ARCHIVED' as const, publiclyAccessible: false }
    api.archiveMyAddress.mockResolvedValue(archived)
    api.restoreMyAddress.mockResolvedValue(activeAddress)
    const u = userEvent.setup()
    visit('/mes-adresses/a1')

    await u.click(await screen.findByRole('button', { name: 'Archiver l’adresse' }))
    expect(api.archiveMyAddress).not.toHaveBeenCalled()
    await u.click(screen.getByRole('button', { name: 'Confirmer l’archivage' }))
    expect(api.archiveMyAddress).toHaveBeenCalledWith('jeton', 'a1')

    await u.click(await screen.findByRole('button', { name: /Restaurer l’adresse/ }))
    expect(api.restoreMyAddress).toHaveBeenCalledWith('jeton', 'a1')
  })
})

describe('fiche publique', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
  })
  afterEach(() => cleanup())

  it('garde la fiche utilisable si l’itinéraire est indisponible (503) et permet le signalement anonyme', async () => {
    api.getPublicAddress.mockResolvedValue(publicAddress)
    api.getRoute.mockRejectedValue(new ApiError('Service d’itinéraire temporairement indisponible.', 503))
    api.reportAddress.mockResolvedValue({ status: 'ACCEPTED', message: 'Merci, votre signalement a été transmis.' })
    const getCurrentPosition = vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 12.56, longitude: -16.27 } } as GeolocationPosition))
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
    const u = userEvent.setup()
    visit('/a/ZIG-KBG-4271')

    await u.click(await screen.findByRole('button', { name: 'À pied' }))
    expect(api.getRoute).toHaveBeenCalledWith({ lat: 12.56, lng: -16.27 }, 'ZIG-KBG-4271', 'foot-walking')
    expect(await screen.findByText(/temporairement indisponible/)).toBeInTheDocument()

    // Signalement anonyme sans connexion requise (contrat backend PublicReportController).
    await u.click(screen.getByRole('button', { name: 'Signaler un problème' }))
    await u.click(screen.getByLabelText('Position GPS incorrecte'))
    await u.type(screen.getByLabelText(/Précisions/), 'Portail déplacé')
    await u.click(screen.getByRole('button', { name: 'Envoyer le signalement' }))
    expect(api.reportAddress).toHaveBeenCalledWith('ZIG-KBG-4271', 'POSITION_INCORRECTE', 'Portail déplacé')
    expect(await screen.findByText(/votre signalement a été transmis/)).toBeInTheDocument()
  })

  it('signale la copie hors ligne et une adresse archivée/suspendue (410)', async () => {
    api.getPublicAddress.mockResolvedValueOnce({ ...publicAddress, offlineCopyAt: '2026-10-19T10:00:00Z' })
    visit('/a/ZIG-KBG-4271')
    expect(await screen.findByText(/Hors ligne : copie de cette fiche enregistrée sur l’appareil/)).toBeInTheDocument()
    cleanup()

    api.getPublicAddress.mockRejectedValueOnce(new ApiError('Indisponible', 410))
    visit('/a/ZIG-KBG-0001')
    expect(await screen.findByRole('heading', { name: 'Adresse indisponible' })).toBeInTheDocument()
  })
})
