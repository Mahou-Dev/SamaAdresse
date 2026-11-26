import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomeHero } from '../HomeHero';
import { HomeDiscoverySection } from '../HomeDiscoverySection';
import { HomeHowItWorks } from '../HomeHowItWorks';
import { HomeCtaSection } from '../HomeCtaSection';
import { HomeConnectedView } from '../HomeConnectedView';
import type { HomeDiscoveryState } from '../useHomeDiscovery';
import type { DirectoryItemResponse } from '../../../api/addressApi';

const mockItems: DirectoryItemResponse[] = [
  {
    code: 'ZIG-KBG-4271',
    zone: 'ZIG',
    quartier: 'KBG',
    locationType: 'MAISON',
    description: 'Maison familiale près de la grande mosquée de Boucotte',
    createdAt: '2026-10-15T10:00:00Z',
    ownerName: 'Mamadou Diallo',
  },
  {
    code: 'ZIG-ESC-1042',
    zone: 'ZIG',
    quartier: 'ESC',
    locationType: 'COMMERCE',
    description: 'Boutique artisanale Escale Center',
    createdAt: '2026-10-16T10:00:00Z',
  },
];

describe('P02 — Composants de la page d’accueil (Home)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('HomeHero affiche le H1, la SearchBar centrale, la plaque ZIG-KBG-4271, l’image hero LCP et les zones geo-grid', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomeHero demoCode="ZIG-KBG-8454" />
      </MemoryRouter>
    );

    expect(html).toContain('Trouvez et partagez chaque adresse');
    expect(html).toContain('ZIG-KBG-4271');
    expect(html).toContain('Ziguinchor · Dakar · Saint-Louis');
    expect(html).toContain('role="search"');
    expect(html).toContain('/images/hero-accueil-800w.webp');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain('href="/annuaire?quartier=KBG"');
    expect(html).toContain('href="/annuaire?view=map"');
    expect(html).toContain('href="/a/ZIG-KBG-8454"');
  });

  it('HomeDiscoverySection affiche les 3 catégories réelles, les 8 quartiers geo-grid et les adresses publiées', () => {
    const discovery: HomeDiscoveryState = {
      items: mockItems,
      totalElements: 2,
      loading: false,
      error: null,
      isOnline: true,
      visitedCodes: [],
      reload: vi.fn(),
    };

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomeDiscoverySection discovery={discovery} />
      </MemoryRouter>
    );

    // Catégories backend réelles
    expect(html).toContain('href="/annuaire?type=MAISON"');
    expect(html).toContain('href="/annuaire?type=COMMERCE"');
    expect(html).toContain('href="/annuaire?type=INSTITUTION"');

    // Zones et quartiers réels de geo-grid.json
    expect(html).toContain('Ziguinchor');
    expect(html).toContain('Dakar');
    expect(html).toContain('Saint-Louis');
    expect(html).toContain('href="/annuaire?quartier=KBG"');
    expect(html).toContain('href="/annuaire?quartier=PLT"');
    expect(html).toContain('href="/annuaire?quartier=NDR"');

    // Adresses réelles
    expect(html).toContain('ZIG-KBG-4271');
    expect(html).toContain('ZIG-ESC-1042');
    expect(html).toContain('2 adresses publiques');
  });

  it('HomeDiscoverySection gère les états chargement, hors ligne (avec fiches visitées), erreur et vide', () => {
    const offlineHtml = renderToStaticMarkup(
      <MemoryRouter>
        <HomeDiscoverySection
          discovery={{
            items: [],
            totalElements: 0,
            loading: false,
            error: null,
            isOnline: false,
            visitedCodes: ['ZIG-KBG-4271'],
            reload: vi.fn(),
          }}
        />
      </MemoryRouter>
    );
    expect(offlineHtml).toContain('indisponible hors ligne');
    expect(offlineHtml).toContain('href="/a/ZIG-KBG-4271"');

    const errorHtml = renderToStaticMarkup(
      <MemoryRouter>
        <HomeDiscoverySection
          discovery={{
            items: [],
            totalElements: 0,
            loading: false,
            error: 'Erreur réseau',
            isOnline: true,
            visitedCodes: [],
            reload: vi.fn(),
          }}
        />
      </MemoryRouter>
    );
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain('Réessayer');

    const emptyHtml = renderToStaticMarkup(
      <MemoryRouter>
        <HomeDiscoverySection
          discovery={{
            items: [],
            totalElements: 0,
            loading: false,
            error: null,
            isOnline: true,
            visitedCodes: [],
            reload: vi.fn(),
          }}
        />
      </MemoryRouter>
    );
    expect(emptyHtml).toContain('Aucune adresse publique');
  });

  it('HomeHowItWorks et HomeCtaSection affichent les visuels optimisés, l’anatomie du code et les CTA réels', () => {
    const howHtml = renderToStaticMarkup(
      <MemoryRouter>
        <HomeHowItWorks />
      </MemoryRouter>
    );
    expect(howHtml).toContain('/images/etape-1-localiser-480w.webp');
    expect(howHtml).toContain('/images/etape-2-plaque-480w.webp');
    expect(howHtml).toContain('/images/etape-3-partager-480w.webp');
    expect(howHtml).toContain('ZIG');
    expect(howHtml).toContain('KBG');
    expect(howHtml).toContain('4271');

    const ctaHtml = renderToStaticMarkup(
      <MemoryRouter>
        <HomeCtaSection />
      </MemoryRouter>
    );
    expect(ctaHtml).toContain('href="/addresses/new"');
    expect(ctaHtml).toContain('href="/annuaire"');
    expect(ctaHtml).toContain('href="/login"');
  });

  it('HomeConnectedView affiche un accueil connecté sobre avec recherche annuaire et liens espace personnel', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomeConnectedView
          user={{
            id: 'u-1',
            fullName: 'Awa Ndiaye',
            email: 'awa@samaadresse.sn',
            phoneNumber: '+221770000000',
            role: 'PROPRIETAIRE',
            enabled: true,
            createdAt: '2026-01-01T00:00:00Z',
          }}
        />
      </MemoryRouter>
    );

    expect(html).toContain('Bonjour Awa');
    expect(html).toContain('href="/tableau-de-bord"');
    expect(html).toContain('href="/addresses/new"');
    expect(html).toContain('href="/addresses/mine"');
    expect(html).toContain('href="/annuaire?view=map"');
  });
});
