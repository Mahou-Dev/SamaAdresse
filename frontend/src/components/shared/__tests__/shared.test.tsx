import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  AddressCard,
  AddressCode,
  AddressPlate,
  AddressStatusBadge,
  LocationBadge,
  MapPreview,
  NeighborhoodTag,
  OfflineStatusIndicator,
  SearchBar,
  SearchFilter,
  UserProfileMenu,
} from '../index';
import {
  PublicLayout,
  AuthenticatedLayout,
  AdminLayout,
  AuthLayout,
} from '../../../app/layouts';
import { ErrorBoundary } from '../../../app/boundaries/ErrorBoundary';

describe('Composants métier SamaAdresse 2.0 & Layouts (P01)', () => {
  it('rend AddressCode, LocationBadge, NeighborhoodTag, AddressStatusBadge et AddressPlate', () => {
    const codeHtml = renderToStaticMarkup(<AddressCode code="ZIG-KBG-4271" copyable />);
    expect(codeHtml).toContain('ZIG-KBG-4271');
    expect(codeHtml).toContain('aria-label="Copier le code ZIG-KBG-4271"');

    const locHtml = renderToStaticMarkup(<LocationBadge type="COMMERCE" />);
    expect(locHtml).toContain('Commerce');

    const tagHtml = renderToStaticMarkup(
      <NeighborhoodTag quartierCode="KBG" zoneCode="ZIG" showZone />
    );
    expect(tagHtml).toContain('Boucotte');
    expect(tagHtml).toContain('Ziguinchor');

    const statusHtml = renderToStaticMarkup(<AddressStatusBadge status="ACTIVE" />);
    expect(statusHtml).toContain('Active');

    const plateHtml = renderToStaticMarkup(
      <AddressPlate code="ZIG-KBG-4271" zone="ZIG" type="MAISON" showCopy />
    );
    expect(plateHtml).toContain('SAMAADRESSE');
    expect(plateHtml).toContain('ZIG-KBG-4271');
    expect(plateHtml).toContain('Copier le code');
  });

  it('rend AddressCard en mode vertical et horizontal avec les données réelles', () => {
    const address = {
      code: 'ZIG-KBG-4271',
      zone: 'ZIG',
      quartier: 'KBG',
      locationType: 'MAISON' as const,
      description: 'Maison familiale au portail vert face à la grande mosquée',
      photoUrl: '/uploads/demo.jpg',
      status: 'ACTIVE' as const,
      ownerName: 'Mamadou Diallo',
      createdAt: '2026-10-15T10:00:00Z',
    };

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AddressCard address={address} showStatus copyableCode />
      </MemoryRouter>
    );
    expect(html).toContain('ZIG-KBG-4271');
    expect(html).toContain('Maison familiale au portail vert');
    expect(html).toContain('Mamadou Diallo');
    expect(html).toContain('href="/a/ZIG-KBG-4271"');
    expect(html).toContain('Active');
    expect(html).toContain('Maison');
  });

  it('rend MapPreview (mode léger en ligne et hors ligne)', () => {
    const onlineHtml = renderToStaticMarkup(
      <MapPreview
        latitude={12.578333}
        longitude={-16.271944}
        code="ZIG-KBG-4271"
        zone="ZIG"
        quartier="KBG"
      />
    );
    expect(onlineHtml).toContain('12.578333');
    expect(onlineHtml).toContain('Itinéraire');

    const offlineHtml = renderToStaticMarkup(
      <MapPreview
        latitude={12.578333}
        longitude={-16.271944}
        isOffline
      />
    );
    expect(offlineHtml).toContain('Carte indisponible hors ligne');
  });

  it('rend SearchBar, SearchFilter, UserProfileMenu et OfflineStatusIndicator', () => {
    const searchHtml = renderToStaticMarkup(
      <SearchBar value="Boucotte" onChange={() => {}} onClear={() => {}} />
    );
    expect(searchHtml).toContain('role="search"');
    expect(searchHtml).toContain('value="Boucotte"');
    expect(searchHtml).toContain('Effacer la recherche');

    const filterHtml = renderToStaticMarkup(
      <SearchFilter
        label="Type de lieu"
        value="MAISON"
        onChange={() => {}}
        options={[
          { value: '', label: 'Tous' },
          { value: 'MAISON', label: 'Maison' },
          { value: 'COMMERCE', label: 'Commerce' },
        ]}
        showReset
        onReset={() => {}}
      />
    );
    expect(filterHtml).toContain('aria-pressed="true"');
    expect(filterHtml).toContain('Réinitialiser');

    const profileHtml = renderToStaticMarkup(
      <MemoryRouter>
        <UserProfileMenu
          isAuthenticated={true}
          user={{
            id: 'u1',
            fullName: 'Fatou Ndiaye',
            email: 'fatou@samaadresse.sn',
            phoneNumber: '+221771234567',
            role: 'PROPRIETAIRE',
            enabled: true,
            createdAt: '2026-01-01T00:00:00Z',
          }}
        />
      </MemoryRouter>
    );
    expect(profileHtml).toContain('aria-label="Ouvrir le menu du compte"');
    expect(profileHtml).toContain('FN');

    const offlineHtml = renderToStaticMarkup(
      <OfflineStatusIndicator isOnline={false} pendingCount={2} />
    );
    expect(offlineHtml).toContain('Hors ligne (2)');
  });

  it('rend les 4 layouts cibles et ErrorBoundary sans erreur', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ErrorBoundary>
          <PublicLayout>
            <div>Public</div>
          </PublicLayout>
          <AuthenticatedLayout header={{ title: 'Tableau de bord' }}>
            <div>Connecté</div>
          </AuthenticatedLayout>
          <AdminLayout header={{ title: 'Modération' }}>
            <div>Admin</div>
          </AdminLayout>
          <AuthLayout aside={<div>Illustration</div>}>
            <div>Connexion</div>
          </AuthLayout>
        </ErrorBoundary>
      </MemoryRouter>
    );
    expect(html).toContain('Public');
    expect(html).toContain('Tableau de bord');
    expect(html).toContain('Espace Administration');
    expect(html).toContain('Illustration');
  });
});
