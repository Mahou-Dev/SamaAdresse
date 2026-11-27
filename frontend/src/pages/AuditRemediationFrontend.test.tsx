import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { SESSION_KEY } from '../auth/AuthProvider'
import type { AdminActionItem, DirectoryItem, OwnerAddress, PublicAddress } from '../lib/api'

const api = vi.hoisted(() => ({
  login: vi.fn(),
  logoutSession: vi.fn(),
  refreshSession: vi.fn(),
  changePassword: vi.fn(),
  getCurrentUser: vi.fn(),
  getPublicAddress: vi.fn(),
  searchDirectory: vi.fn(),
  listAllMyAddresses: vi.fn(),
  listReservedCodes: vi.fn(),
  getRoute: vi.fn(),
  listReports: vi.fn(),
  listAdminActions: vi.fn(),
  listAdminAddresses: vi.fn(),
  suspendAdminAddress: vi.fn(),
  reinstateAdminAddress: vi.fn(),
}))

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api')>()
  return { ...original, ...api }
})

const ownerUser = {
  id: 'u-owner', email: 'owner@samaadresse.sn', displayName: 'Fatou Ndiaye',
  phoneNumber: '+221771112233', role: 'PROPRIETAIRE' as const, enabled: true, createdAt: '2026-10-19T08:00:00Z',
}

const adminUser = {
  id: 'u-admin', email: 'admin@samaadresse.sn', displayName: 'Admin SamaAdresse',
  phoneNumber: '+221770000001', role: 'ADMIN' as const, enabled: true, createdAt: '2026-10-19T08:00:00Z',
}

const directoryItem: DirectoryItem = {
  publicCode: 'ZIG-KBG-4271',
  title: 'Boutique Teranga',
  placeType: 'COMMERCE',
  zone: 'ZIG',
  quartier: 'KBG',
  district: 'Boucotte - Kangourou',
  city: 'Ziguinchor',
  description: 'Portail bleu',
  photoUrl: null,
  latitude: 12.5738,
  longitude: -16.265,
  ownerName: 'Fatou Ndiaye',
  createdAt: '2026-10-19T10:00:00Z',
}

const ownerAddress: OwnerAddress = {
  id: 'addr-uuid-1',
  publicCode: 'ZIG-KBG-4271',
  title: 'Boutique Teranga',
  placeType: 'COMMERCE',
  zone: 'ZIG',
  quartier: 'KBG',
  district: 'Boucotte - Kangourou',
  city: 'Ziguinchor',
  description: 'Portail bleu',
  latitude: 12.5738,
  longitude: -16.265,
  status: 'ACTIVE',
  listed: false,
  publicationConsent: false,
  publiclyAccessible: true,
  createdAt: '2026-10-19T10:00:00Z',
  updatedAt: null,
  moderatedAt: null,
  photoUrl: null,
  hasPhoto: false,
  ownerNamePublic: false,
  moderationNotice: null,
}

const publicWithOwner: PublicAddress = {
  publicCode: 'ZIG-KBG-4271',
  title: 'Boutique Teranga',
  placeType: 'COMMERCE',
  zone: 'ZIG',
  quartier: 'KBG',
  district: 'Boucotte - Kangourou',
  city: 'Ziguinchor',
  description: 'Portail bleu',
  latitude: 12.5738,
  longitude: -16.265,
  photoUrl: null,
  ownerName: 'Fatou Ndiaye',
}

function visit(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

function seedSession(user: typeof ownerUser | typeof adminUser) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    token: 'jeton-test',
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    user,
  }))
  api.getCurrentUser.mockResolvedValue(user)
  api.listReservedCodes.mockResolvedValue([])
}

describe('remédiation frontend — pages publiques, carte, compte et administration', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    sessionStorage.clear()
    api.listReservedCodes.mockResolvedValue([])
    api.logoutSession.mockResolvedValue(undefined)
  })
  afterEach(() => cleanup())

  it('ne persiste pas le JWT brut dans sessionStorage après connexion (SEC-03)', async () => {
    api.login.mockResolvedValue({
      accessToken: 'eyJ-secret-jwt-memory-only',
      tokenType: 'Bearer',
      expiresIn: 900,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: ownerUser,
    })
    api.listAllMyAddresses.mockResolvedValue([])
    const u = userEvent.setup()
    visit('/connexion')

    await u.type(await screen.findByLabelText(/E-mail/i), 'owner@samaadresse.sn')
    await u.type(screen.getByLabelText('Mot de passe'), 'MotDePasse123!')
    await u.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('heading', { name: /Bonjour/ })).toBeInTheDocument()
    const persisted = sessionStorage.getItem(SESSION_KEY) ?? ''
    expect(persisted).not.toContain('eyJ-secret-jwt-memory-only')
    expect(persisted).toContain('owner@samaadresse.sn')
  })

  it('SearchPage résout les noms humains de quartier et supporte les filtres combinés (P1-01)', async () => {
    api.searchDirectory.mockResolvedValue({
      items: [directoryItem], page: 0, size: 12, totalElements: 1, totalPages: 1,
    })
    const u = userEvent.setup()
    visit('/recherche?par=quartier')

    await u.type(await screen.findByLabelText('Code ou nom de quartier'), 'Boucotte')
    await u.click(screen.getByRole('button', { name: 'Rechercher' }))
    expect(api.searchDirectory).toHaveBeenCalledWith({ quartier: 'KBG' }, 0, 12)
    expect(await screen.findByText('Boutique Teranga')).toBeInTheDocument()

    // Passe à l'onglet mot-clé + filtres combinés quartier + type
    await u.click(screen.getByRole('tab', { name: /Mot-clé/ }))
    await u.type(await screen.findByLabelText(/Mot-clé, description/), 'Boutique')
    await u.selectOptions(screen.getByLabelText('Quartier (facultatif)'), 'KBG')
    await u.selectOptions(screen.getByLabelText('Type de lieu (facultatif)'), 'COMMERCE')
    await u.click(screen.getByRole('button', { name: 'Rechercher' }))
    expect(api.searchDirectory).toHaveBeenCalledWith({ q: 'Boutique', quartier: 'KBG', type: 'COMMERCE' }, 0, 12)
  })

  it('MapPage affiche l’annuaire public en 1 seule requête HTTP sans N+1 (P2-01)', async () => {
    api.searchDirectory.mockResolvedValue({
      items: [directoryItem], page: 0, size: 50, totalElements: 1, totalPages: 1,
    })
    const u = userEvent.setup()
    visit('/carte')

    expect(await screen.findByText('marqueur ZIG-KBG-4271')).toBeInTheDocument()
    expect(api.searchDirectory).toHaveBeenCalledTimes(1)
    expect(api.searchDirectory).toHaveBeenCalledWith({}, 0, 50)
    expect(api.getPublicAddress).not.toHaveBeenCalled()

    // Filtre par type de lieu et sélection dans la liste
    await u.click(screen.getByRole('button', { name: /Boutique Teranga/ }))
    expect(screen.getByRole('link', { name: 'Ouvrir la fiche' })).toHaveAttribute('href', '/a/ZIG-KBG-4271')
    await u.click(screen.getByRole('button', { name: 'Institution' }))
    expect(screen.getByText('Aucune adresse ne correspond à ce filtre.')).toBeInTheDocument()
  })

  it('AccountPage permet de changer le mot de passe via POST /api/auth/change-password et de se déconnecter (P2-03)', async () => {
    seedSession(ownerUser)
    api.changePassword.mockResolvedValue({ message: 'Mot de passe mis à jour avec succès.' })
    const u = userEvent.setup()
    visit('/compte')

    expect(await screen.findByRole('heading', { name: 'Fatou Ndiaye' })).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Modifier' }))

    await u.type(screen.getByLabelText('Mot de passe actuel'), 'AncienPass123!')
    await u.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauPass456!')
    await u.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'DifferentPass!')
    await u.click(screen.getByRole('button', { name: 'Enregistrer le nouveau mot de passe' }))
    expect(await screen.findByText(/confirmation ne correspond pas/i)).toBeInTheDocument()

    await u.clear(screen.getByLabelText('Confirmer le nouveau mot de passe'))
    await u.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'NouveauPass456!')
    await u.click(screen.getByRole('button', { name: 'Enregistrer le nouveau mot de passe' }))
    expect(api.changePassword).toHaveBeenCalledWith('jeton-test', 'AncienPass123!', 'NouveauPass456!')
    expect(await screen.findByText(/Mot de passe mis à jour/)).toBeInTheDocument()

    await u.click(within(screen.getByRole('main')).getByRole('button', { name: 'Se déconnecter' }))
    expect(api.logoutSession).toHaveBeenCalledWith('jeton-test')
  })

  it('AdminAddressesPage charge le registre complet (/api/admin/addresses) et suspend/réactive directement (P2-03)', async () => {
    seedSession(adminUser)
    api.listReports.mockResolvedValue({ items: [], page: 0, size: 1, totalElements: 0, totalPages: 0 })
    api.listAdminAddresses.mockResolvedValue({
      items: [ownerAddress], page: 0, size: 50, totalElements: 1, totalPages: 1,
    })
    api.suspendAdminAddress.mockResolvedValue({ ...ownerAddress, status: 'SUSPENDED' })
    const u = userEvent.setup()
    visit('/admin/adresses')

    expect(await screen.findByText('Lien direct')).toBeInTheDocument()
    expect(api.listAdminAddresses).toHaveBeenCalledWith('jeton-test', undefined, undefined, 0, 50)
    await u.click(screen.getByRole('button', { name: 'Suspendre' }))
    expect(api.suspendAdminAddress).toHaveBeenCalledWith('jeton-test', 'addr-uuid-1', expect.stringContaining('Suspension'))
  })

  it('AdminReportsPage affiche le journal d’audit immuable (/api/admin/actions) et AdminUsersPage reste accessible (P2-03)', async () => {
    seedSession(adminUser)
    api.listReports.mockResolvedValue({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })
    const actionItem: AdminActionItem = {
      id: 'act-1',
      adminId: 'u-admin',
      adminEmail: 'admin@samaadresse.sn',
      action: 'SUSPEND',
      addressId: 'addr-uuid-1',
      addressCode: 'ZIG-KBG-4271',
      reportId: null,
      reason: 'Doublon confirmé',
      createdAt: '2026-10-20T12:00:00Z',
    }
    api.listAdminActions.mockResolvedValue({
      items: [actionItem], page: 0, size: 20, totalElements: 1, totalPages: 1,
    })
    const u = userEvent.setup()
    visit('/admin/signalements')

    await u.click(await screen.findByRole('button', { name: 'Journal d’audit' }))
    expect(await screen.findByText('Suspension d’adresse')).toBeInTheDocument()
    expect(screen.getByText('Doublon confirmé')).toBeInTheDocument()
    expect(api.listAdminActions).toHaveBeenCalledWith('jeton-test', 0, 20)

    cleanup()
    visit('/admin/utilisateurs')
    expect(await screen.findByRole('heading', { name: /Gestion des comptes/ })).toBeInTheDocument()
  })

  it('PublicAddressPage affiche ownerName opt-in et RouteControls indique honnêtement un itinéraire approximatif (P0-02)', async () => {
    api.getPublicAddress.mockResolvedValue(publicWithOwner)
    api.getRoute.mockResolvedValue({
      profile: 'foot-walking',
      distanceMeters: 650,
      durationSeconds: 470,
      coordinates: [[12.57, -16.27], [12.5738, -16.265]],
      steps: [{ instruction: 'Distance directe approximative vers ZIG-KBG-4271 (itinéraire routier indisponible)', distance: 650, duration: 470 }],
      approximateFallback: true,
    })
    const getCurrentPosition = vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 12.57, longitude: -16.27 } } as GeolocationPosition))
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })

    const u = userEvent.setup()
    visit('/a/ZIG-KBG-4271')

    expect(await screen.findByText('Adresse enregistrée par Fatou Ndiaye.')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'À pied' }))
    expect(await screen.findByText(/Distance directe approximative/)).toBeInTheDocument()
  })

  it('affiche la page 404 pour une route inconnue', async () => {
    visit('/cette-route-nexiste-pas')
    expect(await screen.findByRole('heading', { name: /Page introuvable/i })).toBeInTheDocument()
  })
})
