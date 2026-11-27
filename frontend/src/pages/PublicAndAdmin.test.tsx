import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { SESSION_KEY } from '../auth/AuthProvider'
import { ApiError, type AdminReport, type PublicAddress } from '../lib/api'

const api = vi.hoisted(() => ({
  getPublicAddress: vi.fn(),
  getCurrentUser: vi.fn(),
  searchDirectory: vi.fn(),
  listReports: vi.fn(),
  updateReportStatus: vi.fn(),
  suspendAdminAddress: vi.fn(),
  reinstateAdminAddress: vi.fn(),
}))

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api')>()
  return { ...original, ...api }
})

const publicAddress: PublicAddress = {
  publicCode: 'ZIG-KBG-4271',
  title: 'Boutique Teranga',
  placeType: 'COMMERCE',
  zone: 'ZIG',
  quartier: 'KBG',
  district: 'Boucotte - Kangourou',
  city: 'Ziguinchor',
  description: 'Portail bleu.',
  latitude: 12.5738,
  longitude: -16.265,
  photoUrl: null,
  ownerName: null,
}

function visit(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

function signInAs(role: 'PROPRIETAIRE' | 'ADMIN') {
  const user = {
    id: 'u1', email: 'admin@samaadresse.sn', displayName: 'Admin Démo',
    phoneNumber: '+221770000001', role, enabled: true, createdAt: '2026-10-19T08:00:00Z',
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'jeton', expiresAt: new Date(Date.now() + 3600_000).toISOString(), user }))
  api.getCurrentUser.mockResolvedValue(user)
}

const emptyPage = { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }

const openReport: AdminReport = {
  id: 'r1',
  reason: 'POSITION_INCORRECTE',
  comment: 'Mauvaise rue',
  status: 'OPEN',
  createdAt: new Date().toISOString(),
  resolvedAt: null,
  addressId: 'addr-uuid-1',
  publicCode: 'ZIG-KBG-4271',
  addressTitle: 'Boutique Teranga',
  zone: 'ZIG',
  quartier: 'KBG',
  district: 'Boucotte - Kangourou',
  city: 'Ziguinchor',
  locationType: 'COMMERCE',
  photoUrl: null,
  addressStatus: 'ACTIVE',
}

describe('pages publiques', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
  })
  afterEach(() => cleanup())

  it('affiche la fiche publique sans aucune donnée de compte', async () => {
    api.getPublicAddress.mockResolvedValue(publicAddress)
    visit('/a/ZIG-KBG-4271')

    expect(await screen.findByRole('heading', { name: 'ZIG-KBG-4271' })).toBeInTheDocument()
    expect(screen.getByText('Portail bleu.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /QR code/ })).toHaveAttribute('href', '/a/ZIG-KBG-4271/partage')
  })

  it('indique honnêtement une adresse introuvable (404)', async () => {
    api.getPublicAddress.mockRejectedValue(new ApiError('absente', 404))
    visit('/a/ZIG-KBG-0000')

    expect(await screen.findByRole('heading', { name: 'Adresse introuvable' })).toBeInTheDocument()
  })

  it('lance la recherche transmise dans l’URL (?code=…)', async () => {
    api.getPublicAddress.mockResolvedValue(publicAddress)
    visit('/recherche?code=zig-kbg-4271')

    expect(await screen.findByRole('heading', { name: 'ZIG-KBG-4271' })).toBeInTheDocument()
    expect(api.getPublicAddress).toHaveBeenCalledWith('ZIG-KBG-4271')
  })
})

describe('administration (AdminModerationController)', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
  })
  afterEach(() => cleanup())

  it('refuse l’affichage à un compte PROPRIETAIRE', async () => {
    signInAs('PROPRIETAIRE')
    visit('/admin')

    expect(await screen.findByRole('heading', { name: 'Accès réservé aux administrateurs' })).toBeInTheDocument()
  })

  it('affiche les KPIs réels depuis /api/admin/reports et /api/public/directory', async () => {
    signInAs('ADMIN')
    api.listReports.mockImplementation((_t: string, st?: string) => {
      if (st === 'OPEN') return Promise.resolve({ ...emptyPage, items: [openReport], totalElements: 3, totalPages: 1 })
      if (st === 'RESOLVED') return Promise.resolve({ ...emptyPage, totalElements: 2 })
      return Promise.resolve({ ...emptyPage, totalElements: 1 })
    })
    api.searchDirectory.mockResolvedValue({
      items: [{
        publicCode: 'ZIG-KBG-4271', title: 'Boutique Teranga', placeType: 'COMMERCE',
        zone: 'ZIG', quartier: 'KBG', district: 'Boucotte - Kangourou', city: 'Ziguinchor',
        description: null, photoUrl: null, ownerName: null, createdAt: new Date().toISOString(),
      }],
      page: 0, size: 50, totalElements: 1, totalPages: 1,
    })
    visit('/admin')

    expect(await screen.findByText('Signalements à traiter', { selector: 'small' })).toBeInTheDocument()
    expect(screen.getByText('Signalements à traiter', { selector: 'small' }).parentElement).toHaveTextContent('3')
    expect(screen.getByText('Position GPS incorrecte')).toBeInTheDocument()
    expect(await screen.findByLabelText('3 signalements ouverts')).toBeInTheDocument()
  })

  it('écarte un signalement via PATCH /api/admin/reports/{id} et suspend avec motif obligatoire', async () => {
    signInAs('ADMIN')
    api.listReports.mockResolvedValue({ ...emptyPage, items: [openReport], totalElements: 1, totalPages: 1 })
    api.updateReportStatus.mockResolvedValue({ ...openReport, status: 'DISMISSED' })
    api.suspendAdminAddress.mockResolvedValue({ id: 'addr-uuid-1', publicCode: 'ZIG-KBG-4271', status: 'SUSPENDED' })
    const u = userEvent.setup()
    visit('/admin/signalements')

    await u.click(await screen.findByRole('button', { name: 'Écarter le signalement sur ZIG-KBG-4271' }))
    await u.click(screen.getByRole('button', { name: 'Confirmer : écarter' }))
    expect(api.updateReportStatus).toHaveBeenCalledWith('jeton', 'r1', 'DISMISSED', undefined)

    await u.click(await screen.findByRole('button', { name: 'Suspendre l’adresse ZIG-KBG-4271' }))
    await u.type(screen.getByLabelText(/Motif de suspension/), 'Adresse fictive confirmée')
    await u.click(screen.getByRole('button', { name: 'Confirmer la suspension' }))
    expect(api.suspendAdminAddress).toHaveBeenCalledWith('jeton', 'addr-uuid-1', 'Adresse fictive confirmée')
  })
})
