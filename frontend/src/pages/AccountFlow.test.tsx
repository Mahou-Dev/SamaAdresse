import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { SESSION_KEY } from '../auth/AuthProvider'
import { ApiError, type OwnerAddress } from '../lib/api'

const api = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  refreshSession: vi.fn(),
  logoutSession: vi.fn(),
  getCurrentUser: vi.fn(),
  listAllMyAddresses: vi.fn(),
  listMyAddresses: vi.fn(),
  createMyAddress: vi.fn(),
  getMyAddress: vi.fn(),
  uploadMyAddressPhoto: vi.fn(),
  searchDirectory: vi.fn(),
}))

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api')>()
  return { ...original, ...api }
})

const user = {
  id: 'u1',
  email: 'demo@samaadresse.sn',
  displayName: 'Fatou Diallo',
  phoneNumber: '+221771234567',
  role: 'PROPRIETAIRE' as const,
  enabled: true,
  createdAt: '2026-10-19T08:00:00Z',
}
const authResponse = {
  accessToken: 'jeton-test',
  tokenType: 'Bearer' as const,
  expiresIn: 900,
  expiresAt: new Date(Date.now() + 900_000).toISOString(),
  user,
}
const created: OwnerAddress = {
  id: 'a1',
  publicCode: 'ZIG-KBG-4271',
  title: 'Maison familiale',
  placeType: 'MAISON',
  zone: 'ZIG',
  quartier: 'KBG',
  district: 'Boucotte - Kangourou',
  city: 'Ziguinchor',
  description: null,
  latitude: 12.5738,
  longitude: -16.265,
  status: 'ACTIVE',
  listed: true,
  publicationConsent: true,
  publiclyAccessible: true,
  createdAt: '2026-10-19T08:00:00Z',
  updatedAt: null,
  moderatedAt: null,
  photoUrl: null,
  hasPhoto: false,
  ownerNamePublic: false,
  moderationNotice: null,
}
const page = (items: OwnerAddress[]) => ({ items, page: 0, size: 20, totalElements: items.length, totalPages: items.length ? 1 : 0 })

function visit(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

function signIn() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'jeton-test', expiresAt: authResponse.expiresAt, user }))
  api.getCurrentUser.mockResolvedValue(user)
}

type U = ReturnType<typeof userEvent.setup>

async function fillInformationStep(u: U, placeType = 'MAISON') {
  await u.selectOptions(await screen.findByLabelText('Type de lieu'), placeType)
  await u.type(screen.getByLabelText('Nom du lieu'), 'Maison familiale')
  await u.click(screen.getByRole('button', { name: /Suivant/ }))
  await screen.findByLabelText('Latitude')
}

describe('parcours compte et adresses', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.logoutSession.mockResolvedValue(undefined)
    api.refreshSession.mockRejectedValue(new ApiError('absent', 401))
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('redirige un visiteur anonyme vers la connexion', async () => {
    visit('/mes-adresses')
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(api.listMyAddresses).not.toHaveBeenCalled()
  })

  it('valide l’inscription (dont téléphone sénégalais et majuscule) côté client sans appeler l’API', async () => {
    const u = userEvent.setup()
    visit('/inscription')

    await u.type(screen.getByLabelText('Nom complet'), 'Fatou')
    await u.type(screen.getByLabelText('E-mail'), 'pas-un-email')
    await u.type(screen.getByLabelText('Téléphone'), '0612345678')
    await u.type(screen.getByLabelText('Mot de passe'), 'court')
    await u.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(screen.getByText('L’e-mail n’est pas valide.')).toBeInTheDocument()
    expect(screen.getByText(/format sénégalais/)).toBeInTheDocument()
    expect(screen.getByText(/au moins 8 caractères, une majuscule et un chiffre/)).toBeInTheDocument()
    expect(api.register).not.toHaveBeenCalled()
  })

  it('permet d’afficher le mot de passe saisi', async () => {
    const u = userEvent.setup()
    visit('/connexion')

    const input = screen.getByLabelText('Mot de passe')
    expect(input).toHaveAttribute('type', 'password')
    await u.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
    expect(input).toHaveAttribute('type', 'text')
  })

  it('connecte la personne puis affiche son tableau de bord avec des chiffres réels', async () => {
    api.login.mockResolvedValue(authResponse)
    api.listAllMyAddresses.mockResolvedValue([created, { ...created, id: 'a2', publicCode: 'ZIG-KBG-4272', status: 'ARCHIVED', publiclyAccessible: false }])
    const u = userEvent.setup()
    visit('/connexion')

    await u.type(screen.getByLabelText('E-mail'), 'demo@samaadresse.sn')
    await u.type(screen.getByLabelText('Mot de passe'), 'MotDePasse1')
    await u.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('heading', { name: 'Bonjour Fatou' })).toBeInTheDocument()
    const stats = await screen.findByText('Mes adresses', { selector: 'small' })
    expect(stats.parentElement).toHaveTextContent('2')
    expect(screen.getByText('Actives', { selector: 'small' }).parentElement).toHaveTextContent('1')
    expect(screen.getByText('marqueur ZIG-KBG-4271')).toBeInTheDocument()
  })

  it('refuse un point hors des zones couvertes dès l’étape de localisation', async () => {
    signIn()
    const u = userEvent.setup()
    visit('/mes-adresses/nouvelle')

    await fillInformationStep(u)
    await u.type(screen.getByLabelText('Latitude'), '48.85')
    await u.type(screen.getByLabelText('Longitude'), '2.35')
    await u.click(screen.getByRole('button', { name: /Suivant/ }))

    expect((await screen.findAllByText(/hors des zones couvertes/))[0]).toBeInTheDocument()
  })

  it('crée l’adresse avec résolution geo-grid, clientRequestId et active immédiatement le QR code', async () => {
    signIn()
    api.createMyAddress.mockResolvedValue(created)
    api.getMyAddress.mockResolvedValue(created)
    const u = userEvent.setup()
    visit('/mes-adresses/nouvelle')

    await fillInformationStep(u)
    await u.click(screen.getByRole('button', { name: 'Cliquer sur la carte (test)' }))
    expect(screen.getByLabelText('Latitude')).toHaveValue('12.573800')
    expect(screen.getByText(/Ziguinchor · Boucotte - Kangourou/)).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /Suivant/ }))
    await u.click(await screen.findByRole('button', { name: /Suivant/ }))

    await u.click(screen.getByRole('button', { name: /Enregistrer l’adresse/ }))
    expect(screen.getByText('Indiquez si cette adresse doit figurer dans l’annuaire public.')).toBeInTheDocument()
    expect(api.createMyAddress).not.toHaveBeenCalled()

    await u.click(screen.getByLabelText('Oui, référencer cette adresse dans l’annuaire public'))
    await u.click(screen.getByRole('button', { name: /Enregistrer l’adresse/ }))

    expect(api.createMyAddress).toHaveBeenCalledWith('jeton-test', expect.objectContaining({
      title: 'Maison familiale',
      placeType: 'MAISON',
      latitude: 12.5738,
      longitude: -16.265,
      listed: true,
      ownerNamePublic: false,
      clientRequestId: expect.any(String),
    }))
    expect(await screen.findByRole('heading', { name: 'ZIG-KBG-4271' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /QR code et partage/ })).toBeInTheDocument()
  })

  it('déconnecte la personne si le serveur refuse le jeton et que le refresh échoue', async () => {
    signIn()
    api.listMyAddresses.mockRejectedValue(new ApiError('Authentification requise.', 401))
    visit('/mes-adresses')

    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('ferme la session depuis la navigation latérale en appelant /api/auth/logout', async () => {
    signIn()
    api.listMyAddresses.mockResolvedValue(page([]))
    const u = userEvent.setup()
    visit('/mes-adresses')

    expect(await screen.findByText('Aucune adresse pour le moment')).toBeInTheDocument()
    await u.click(within(screen.getByRole('complementary')).getByRole('button', { name: 'Se déconnecter' }))

    expect(api.logoutSession).toHaveBeenCalled()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
    expect(await screen.findByRole('link', { name: 'Se connecter' })).toBeInTheDocument()
  })
})
