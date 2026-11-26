import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Button, Checkbox, RadioGroup, Tabs } from '../../ui';
import {
  AddressCard,
  MapPreview,
  OfflineStatusIndicator,
  SearchBar,
  UserProfileMenu,
} from '../index';
import {
  PublicLayout,
  AuthenticatedLayout,
  AdminLayout,
  AuthLayout,
} from '../../../app/layouts';
import { ErrorBoundary } from '../../../app/boundaries/ErrorBoundary';
import { getPublicAddress } from '../../../api/addressApi';

describe('P01 — Vérification complémentaire des comportements critiques', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Accessibilité et sécurité des primitives UI corrigées', () => {
    it('Button transmet data-testid/aria-label aux liens et bloque la navigation si disabled', () => {
      const linkHtml = renderToStaticMarkup(
        <MemoryRouter>
          <Button
            to="/annuaire"
            data-testid="btn-annuaire"
            aria-label="Explorer l'annuaire"
          >
            Annuaire
          </Button>
        </MemoryRouter>
      );
      expect(linkHtml).toContain('href="/annuaire"');
      expect(linkHtml).toContain('data-testid="btn-annuaire"');
      expect(linkHtml).toContain('aria-label="Explorer l&#x27;annuaire"');

      const disabledLinkHtml = renderToStaticMarkup(
        <MemoryRouter>
          <Button to="/annuaire" disabled>
            Indisponible
          </Button>
        </MemoryRouter>
      );
      expect(disabledLinkHtml).not.toContain('<a ');
      expect(disabledLinkHtml).toContain('disabled=""');

      const externalHtml = renderToStaticMarkup(
        <Button href="https://samaadresse.sn" target="_blank">
          Site
        </Button>
      );
      expect(externalHtml).toContain('rel="noopener noreferrer"');
    });

    it('Checkbox expose aria-checked="mixed" lorsque indeterminate=true', () => {
      const html = renderToStaticMarkup(
        <Checkbox label="Tout sélectionner" indeterminate checked={false} onChange={() => {}} />
      );
      expect(html).toContain('aria-checked="mixed"');
    });

    it('RadioGroup conserve un point d’entrée clavier tabIndex="0" même sans valeur sélectionnée', () => {
      const html = renderToStaticMarkup(
        <RadioGroup
          label="Type"
          value=""
          onChange={() => {}}
          options={[
            { value: 'DISABLED', label: 'Inactif', disabled: true },
            { value: 'MAISON', label: 'Maison' },
            { value: 'COMMERCE', label: 'Commerce' },
          ]}
        />
      );
      expect(html).toContain('tabindex="0"');
      expect((html.match(/tabindex="0"/g) || []).length).toBe(1);
    });

    it('Tabs conserve un point d’entrée clavier tabIndex="0" si activeTab ne correspond à aucun onglet actif', () => {
      const html = renderToStaticMarkup(
        <Tabs
          activeTab="inconnu"
          onChange={() => {}}
          tabs={[
            { id: 'disabled', label: 'Inactif', disabled: true },
            { id: 'profil', label: 'Profil' },
            { id: 'aide', label: 'Aide' },
          ]}
        />
      );
      expect((html.match(/tabindex="0"/g) || []).length).toBe(1);
    });

    it('SearchBar expose un nom accessible sur le bouton submit même lorsque le texte est masqué sur mobile', () => {
      const html = renderToStaticMarkup(
        <SearchBar value="KBG" onChange={() => {}} submitLabel="Rechercher" />
      );
      expect(html).toContain('type="submit"');
      expect(html).toContain('aria-label="Rechercher"');
    });
  });

  describe('Layouts, rôles et absence de conflits sémantiques HTML', () => {
    it('aucun layout P01 ne crée de balise <main> ou <header> imbriquée conflictuelle avec App.tsx', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <PublicLayout>
            <div>Contenu public</div>
          </PublicLayout>
          <AuthenticatedLayout header={{ title: 'Espace propriétaire' }}>
            <div>Contenu connecté</div>
          </AuthenticatedLayout>
          <AdminLayout header={{ title: 'Modération' }}>
            <div>Contenu admin</div>
          </AdminLayout>
          <AuthLayout aside={<div>Visuel</div>}>
            <div>Formulaire</div>
          </AuthLayout>
        </MemoryRouter>
      );
      expect(html).not.toContain('<main');
      expect(html).not.toContain('<header');
    });

    it('ErrorBoundary dérive un état d’erreur exploitable sans effondrement', () => {
      const state = ErrorBoundary.getDerivedStateFromError(new Error('Crash carte Leaflet'));
      expect(state).toEqual({
        hasError: true,
        errorMessage: 'Crash carte Leaflet',
      });
    });

    it('UserProfileMenu différencie correctement visiteur anonyme, PROPRIETAIRE et ADMIN', () => {
      const anonHtml = renderToStaticMarkup(
        <MemoryRouter>
          <UserProfileMenu user={null} isAuthenticated={false} />
        </MemoryRouter>
      );
      expect(anonHtml).toContain('Ouvrir le menu de connexion');

      const ownerHtml = renderToStaticMarkup(
        <MemoryRouter>
          <UserProfileMenu
            isAuthenticated={true}
            user={{
              id: 'u-prop',
              fullName: 'Fatou Ndiaye',
              email: 'fatou@samaadresse.sn',
              phoneNumber: '+221770000001',
              role: 'PROPRIETAIRE',
              enabled: true,
              createdAt: '2026-01-01T00:00:00Z',
            }}
          />
        </MemoryRouter>
      );
      expect(ownerHtml).toContain('Ouvrir le menu du compte');
      expect(ownerHtml).toContain('FN');

      const adminHtml = renderToStaticMarkup(
        <MemoryRouter>
          <UserProfileMenu
            isAuthenticated={true}
            user={{
              id: 'u-admin',
              fullName: 'Admin Ziguinchor',
              email: 'admin@samaadresse.sn',
              phoneNumber: '+221770000002',
              role: 'ADMIN',
              enabled: true,
              createdAt: '2026-01-01T00:00:00Z',
            }}
          />
        </MemoryRouter>
      );
      expect(adminHtml).toContain('AZ');
    });
  });

  describe('Préservation des états hors ligne et de repli', () => {
    it('AddressCard sans photo affiche un état de repli propre sans image cassée', () => {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <AddressCard
            address={{
              code: 'ZIG-ESC-1001',
              zone: 'ZIG',
              quartier: 'ESC',
              locationType: 'INSTITUTION',
              description: 'École primaire Escale',
              photoUrl: null,
            }}
          />
        </MemoryRouter>
      );
      expect(html).toContain('Aucune photo de façade');
      expect(html).toContain('Institution');
      expect(html).not.toContain('<img');
    });

    it('OfflineStatusIndicator reflète fidèlement les 4 états (en ligne, hors ligne, en attente, synchro)', () => {
      expect(renderToStaticMarkup(<OfflineStatusIndicator isOnline={true} />)).toContain('En ligne');
      expect(
        renderToStaticMarkup(<OfflineStatusIndicator isOnline={false} pendingCount={3} />)
      ).toContain('Hors ligne (3)');
      expect(
        renderToStaticMarkup(
          <OfflineStatusIndicator isOnline={true} pendingCount={2} onSyncClick={() => {}} />
        )
      ).toContain('2 en attente');
      expect(
        renderToStaticMarkup(<OfflineStatusIndicator isOnline={true} isSyncing={true} />)
      ).toContain('Synchronisation…');
    });

    it('MapPreview hors ligne masque le lien itinéraire externe et conserve les coordonnées locales', () => {
      const html = renderToStaticMarkup(
        <MapPreview latitude={12.578333} longitude={-16.271944} isOffline={true} showDirections={true} />
      );
      expect(html).toContain('12.578333°N, -16.271944°O');
      expect(html).toContain('Carte indisponible hors ligne');
      expect(html).not.toContain('google.com/maps');
    });

    it('getPublicAddress retombe sur localStorage lorsque le réseau échoue (fiche mise en cache)', async () => {
      const cachedAddress = {
        code: 'ZIG-KBG-4271',
        latitude: 12.578333,
        longitude: -16.271944,
        zone: 'ZIG',
        quartier: 'KBG',
        description: 'Maison familiale test hors ligne',
        locationType: 'MAISON',
        createdAt: '2026-10-15T10:00:00Z',
      };

      const storageMap = new Map<string, string>([
        ['cached_addr_ZIG-KBG-4271', JSON.stringify(cachedAddress)],
      ]);

      vi.stubGlobal('localStorage', {
        getItem: (key: string) => storageMap.get(key) ?? null,
        setItem: (key: string, val: string) => storageMap.set(key, val),
        removeItem: (key: string) => storageMap.delete(key),
      });
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      const result = await getPublicAddress('ZIG-KBG-4271');
      expect(result).toEqual(cachedAddress);

      vi.unstubAllGlobals();
    });
  });
});
