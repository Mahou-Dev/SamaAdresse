import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OfflineDraftsQueue } from '../../my-addresses/OfflineDraftsQueue';
import { MyAddressCard } from '../../my-addresses/MyAddressCard';
import { MyAddressesTable } from '../../my-addresses/MyAddressesTable';
import { ReportDetailPanel } from '../ReportDetailPanel';
import { ModerationAuditTab } from '../ModerationAuditTab';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { NotFoundPage } from '../../../pages/NotFoundPage';
import * as authContext from '../../../context/AuthContext';
import type { AddressResponse, AdminReportResponse } from '../../../api/addressApi';
import type { OfflineDraft } from '../../../utils/offlineDb';

const BASE_ADDRESS: AddressResponse = {
  id: 'addr-1',
  code: 'ZIG-KBG-4271',
  latitude: 12.5783,
  longitude: -16.2719,
  zone: 'ZIG',
  quartier: 'KBG',
  description: 'Maison familiale au portail vert',
  photoUrl: '/uploads/facade.png',
  locationType: 'MAISON',
  status: 'ACTIVE',
  listed: true,
  showOwnerName: false,
  createdAt: '2026-10-15T10:00:00Z',
  owner: {
    id: 'u1',
    fullName: 'Mamadou Diallo',
    email: 'demo@samaadresse.sn',
    phoneNumber: '+221771234567',
    role: 'PROPRIETAIRE',
  },
};

const BASE_REPORT: AdminReportResponse = {
  id: 'rep-1',
  reason: 'POSITION_INCORRECTE',
  comment: 'Repère décalé de 80 mètres.',
  status: 'OPEN',
  createdAt: '2026-11-20T09:00:00Z',
  addressId: 'addr-1',
  addressCode: 'ZIG-KBG-4271',
  addressZone: 'ZIG',
  addressQuartier: 'KBG',
  addressLocationType: 'MAISON',
  addressDescription: 'Maison familiale au portail vert',
  addressPhotoUrl: '/uploads/facade.png',
  addressStatus: 'ACTIVE',
};

describe('P04 — Composants espaces connectés, modération et garde-fous', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('OfflineDraftsQueue rend les brouillons réservés et temporaires, et désactive la synchro hors ligne', () => {
    const drafts: OfflineDraft[] = [
      {
        id: 'd-1',
        clientRequestId: 'req-1',
        latitude: 12.575,
        longitude: -16.27,
        description: 'Atelier hors ligne',
        locationType: 'COMMERCE',
        zone: 'ZIG',
        quartier: 'KBG',
        photoBlob: null,
        reservedCode: 'ZIG-KBG-9001',
        createdAt: '2026-11-25T10:00:00Z',
        status: 'PENDING',
        attempts: 0,
      },
      {
        id: 'd-2',
        clientRequestId: 'req-2',
        latitude: 12.576,
        longitude: -16.271,
        description: 'Sans code réservé',
        locationType: 'MAISON',
        zone: 'ZIG',
        quartier: 'KBG',
        photoBlob: null,
        reservedCode: null,
        createdAt: '2026-11-25T11:00:00Z',
        status: 'FAILED',
        attempts: 1,
        lastError: 'Erreur réseau temporaire',
      },
    ];

    const html = renderToStaticMarkup(
      <OfflineDraftsQueue
        drafts={drafts}
        isOnline={false}
        isSyncing={false}
        onSyncNow={vi.fn()}
      />
    );

    expect(html).toContain('ZIG-KBG-9001');
    expect(html).toContain('ZIG-KBG-????');
    expect(html).toContain('whitespace-nowrap');
    expect(html).toContain('Erreur réseau temporaire');
    expect(html).toContain('disabled=""');
  });

  it('MyAddressCard adapte strictement les actions aux statuts ACTIVE, ARCHIVED et SUSPENDED', () => {
    const commonProps = {
      isOnline: true,
      photoFailed: false,
      isUploadingPhoto: false,
      isShareOpen: false,
      isMenuOpen: false,
      isRestoring: false,
      isTogglingVisibility: false,
      onPhotoError: vi.fn(),
      onToggleShare: vi.fn(),
      onToggleMenu: vi.fn(),
      onDownloadQrCode: vi.fn(),
      onOpenPhotoPicker: vi.fn(),
      onEdit: vi.fn(),
      onRequestArchive: vi.fn(),
      onRestore: vi.fn(),
      onRequestVisibilityToggle: vi.fn(),
    };

    const activeHtml = renderToStaticMarkup(
      <MemoryRouter>
        <MyAddressCard {...commonProps} address={BASE_ADDRESS} />
      </MemoryRouter>
    );
    expect(activeHtml).toContain('ZIG-KBG-4271');
    expect(activeHtml).toContain('Dans l&#x27;annuaire');
    expect(activeHtml).toContain('Actions pour ZIG-KBG-4271');

    const archivedHtml = renderToStaticMarkup(
      <MemoryRouter>
        <MyAddressCard
          {...commonProps}
          address={{ ...BASE_ADDRESS, status: 'ARCHIVED', listed: false }}
        />
      </MemoryRouter>
    );
    expect(archivedHtml).toContain('Restaurer');
    expect(archivedHtml).not.toContain('Partager');

    const suspendedHtml = renderToStaticMarkup(
      <MemoryRouter>
        <MyAddressCard
          {...commonProps}
          address={{
            ...BASE_ADDRESS,
            status: 'SUSPENDED',
            moderationNotice: 'Position incohérente',
          }}
        />
      </MemoryRouter>
    );
    expect(suspendedHtml).toContain('Suspendue par la modération');
    expect(suspendedHtml).toContain('Position incohérente');
    expect(suspendedHtml).not.toContain('Actions pour ZIG-KBG-4271');
  });

  it('MyAddressesTable affiche les colonnes métier et masque les actions interdites sur une adresse suspendue', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MyAddressesTable
          addresses={[
            BASE_ADDRESS,
            { ...BASE_ADDRESS, id: 'addr-2', code: 'ZIG-KBG-9991', status: 'SUSPENDED' },
          ]}
          isOnline={true}
          restoringId={null}
          togglingVisibilityId={null}
          onRequestArchive={vi.fn()}
          onRestore={vi.fn()}
          onRequestVisibilityToggle={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(html).toContain('data-testid="addresses-list-view"');
    expect(html).toContain('ZIG-KBG-4271');
    expect(html).toContain('ZIG-KBG-9991');
    expect(html).toContain('Suspendue par la modération');
    expect(html).toContain('Masquer');
  });

  it('ReportDetailPanel affiche les données de modération sans PII propriétaire et expose #suspend-reason-input', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ReportDetailPanel
          report={BASE_REPORT}
          isOpen={true}
          processing={false}
          inlineSuspendReason=""
          inlineSuspendError={null}
          onInlineSuspendReasonChange={vi.fn()}
          onInlineSuspendSubmit={vi.fn()}
          onClose={vi.fn()}
          onRequestDismiss={vi.fn()}
          onRequestResolve={vi.fn()}
          onRequestOpenSuspendModal={vi.fn()}
          onRequestOpenReinstateModal={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(html).toContain('ZIG-KBG-4271');
    expect(html).toContain('Position GPS incorrecte');
    expect(html).toContain('Repère décalé de 80 mètres.');
    expect(html).toContain('id="suspend-reason-input"');
    expect(html).toContain('Classer sans suite');
    expect(html).toContain('Marquer traité');
    expect(html).not.toContain('demo@samaadresse.sn');
    expect(html).not.toContain('+221771234567');
  });

  it('ModerationAuditTab rend état vide et journal des actions confirmées', () => {
    const emptyHtml = renderToStaticMarkup(<ModerationAuditTab logs={[]} />);
    expect(emptyHtml).toContain('Traçabilité des actions administratives');
    expect(emptyHtml).toContain('Aucune action enregistrée dans cette session');

    const filledHtml = renderToStaticMarkup(
      <ModerationAuditTab
        logs={[
          {
            id: 'a-1',
            actionType: 'SUSPEND',
            actionLabel: "Suspension d'adresse",
            addressCode: 'ZIG-KBG-4271',
            adminEmail: 'admin@samaadresse.sn',
            reason: 'Repère hors bâtiment',
            timestamp: '2026-11-26T12:00:00Z',
          },
        ]}
      />
    );
    expect(filledHtml).toContain('ZIG-KBG-4271');
    expect(filledHtml).toContain('Repère hors bâtiment');
  });

  it('ProtectedRoute bloque un PROPRIETAIRE sur une route ADMIN et NotFoundPage propose les liens Clarté', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'u1',
        fullName: 'Mamadou Diallo',
        email: 'demo@samaadresse.sn',
        phoneNumber: '+221771234567',
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

    const forbiddenHtml = renderToStaticMarkup(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <div>Secret admin</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(forbiddenHtml).toContain('Accès réservé');
    expect(forbiddenHtml).not.toContain('Secret admin');

    const notFoundHtml = renderToStaticMarkup(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(notFoundHtml).toContain('404');
    expect(notFoundHtml).toContain('Explorer l&#x27;annuaire');
  });
});
