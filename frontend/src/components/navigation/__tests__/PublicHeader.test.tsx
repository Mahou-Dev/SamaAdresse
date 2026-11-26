import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PublicHeader } from '../PublicHeader';
import * as authContext from '../../../context/AuthContext';
import * as onlineContext from '../../../context/OnlineStatusContext';
import * as toastModule from '../../Toast';

describe('P02 — Navigation publique unifiée (PublicHeader)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(onlineContext, 'useOnlineStatus').mockReturnValue({
      isOnline: true,
      setIsOnline: vi.fn(),
    });
    vi.spyOn(toastModule, 'useToast').mockReturnValue({
      showToast: vi.fn(),
    });
  });

  it('affiche les liens publics, marque la page active et limite la barre mobile à 4 destinations sans doublon', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isOfflineAuth: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/annuaire']}>
        <PublicHeader />
      </MemoryRouter>
    );

    expect(html).toContain('aria-label="Navigation principale"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Créer une adresse');
    expect(html).toContain('Se connecter');

    // Extraire uniquement le <nav aria-label="Navigation mobile">
    const mobileMatch = html.match(/<nav[^>]*aria-label="Navigation mobile"[^>]*>([\s\S]*?)<\/nav>/);
    expect(mobileMatch).not.toBeNull();
    const mobileHtml = mobileMatch![1];
    const mobileLinkCount = (mobileHtml.match(/<a /g) || []).length;
    expect(mobileLinkCount).toBe(4);
    expect(mobileHtml).not.toContain('Se connecter');
    expect(mobileHtml).not.toContain('Connexion');
  });

  it('n’affiche jamais Connexion dans <header> lorsque l’utilisateur est authentifié', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u-1',
        fullName: 'Mamadou Diallo',
        email: 'demo@samaadresse.sn',
        phoneNumber: '+221770000000',
        role: 'PROPRIETAIRE',
        enabled: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      accessToken: 'jwt',
      isAuthenticated: true,
      isOfflineAuth: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/']}>
        <PublicHeader />
      </MemoryRouter>
    );

    const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    expect(headerMatch).not.toBeNull();
    expect(headerMatch![1]).not.toMatch(/Connexion|Se connecter/i);
    expect(headerMatch![1]).toContain('Tableau de bord');
    expect(headerMatch![1]).toContain('Mes adresses');

    const mobileMatch = html.match(/<nav[^>]*aria-label="Navigation mobile"[^>]*>([\s\S]*?)<\/nav>/);
    expect(mobileMatch).not.toBeNull();
    expect((mobileMatch![1].match(/<a /g) || []).length).toBe(4);
  });

  it('se masque complètement sur /login et /register', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isOfflineAuth: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const loginHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/login']}>
        <PublicHeader />
      </MemoryRouter>
    );
    const registerHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/register']}>
        <PublicHeader />
      </MemoryRouter>
    );

    expect(loginHtml).toBe('');
    expect(registerHtml).toBe('');
  });
});
