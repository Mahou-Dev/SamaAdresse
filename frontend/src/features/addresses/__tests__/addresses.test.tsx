import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  REPORT_REASONS,
  formatDistance,
  formatDuration,
  hasValidCoordinates,
  resolvePhotoSrc,
} from '../utils';
import { AddressMap } from '../../../components/AddressMap';
import { ShareAddress } from '../../../components/ShareAddress';
import { PublicAddressRoutePanel } from '../public/PublicAddressRoutePanel';
import { AddressReportModal } from '../public/AddressReportModal';
import { WizardStepper } from '../creation/WizardStepper';
import { WizardStepLocation } from '../creation/WizardStepLocation';
import { WizardStepDetails } from '../creation/WizardStepDetails';
import { WizardStepPhoto } from '../creation/WizardStepPhoto';
import { WizardStepResult } from '../creation/WizardStepResult';
import * as authContext from '../../../context/AuthContext';
import * as onlineContext from '../../../context/OnlineStatusContext';

describe('P03 — Utilitaires et composants Adresses & Création', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(onlineContext, 'useOnlineStatus').mockReturnValue({
      isOnline: true,
      setIsOnline: vi.fn(),
    });
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
  });

  it('valide les coordonnées géographiques et les helpers de formatage', () => {
    expect(hasValidCoordinates(12.5783, -16.2719)).toBe(true);
    expect(hasValidCoordinates(null, -16.2719)).toBe(false);
    expect(hasValidCoordinates(12.5783, undefined)).toBe(false);
    expect(hasValidCoordinates(Number.NaN, -16.2719)).toBe(false);
    expect(hasValidCoordinates(95, -16.2719)).toBe(false);
    expect(hasValidCoordinates(12.5783, -190)).toBe(false);

    expect(formatDistance(420)).toBe('420 m');
    expect(formatDistance(2450)).toBe('2,5 km');
    expect(formatDuration(30)).toBe('1 min');
    expect(formatDuration(3900)).toBe('1 h 5 min');

    expect(resolvePhotoSrc(null)).toBeNull();
    expect(resolvePhotoSrc('https://cdn.example.com/a.webp')).toBe('https://cdn.example.com/a.webp');
    expect(resolvePhotoSrc('/uploads/test.webp')).toContain('/uploads/test.webp');

    expect(REPORT_REASONS.map((r) => r.value)).toEqual([
      'POSITION_INCORRECTE',
      'CONTENU_INAPPROPRIE',
      'PHOTO_INAPPROPRIEE',
      'AUTRE',
    ]);
  });

  it('AddressMap affiche un état explicite si les coordonnées sont indisponibles et un repli hors ligne propre', () => {
    const missingHtml = renderToStaticMarkup(
      <AddressMap latitude={null} longitude={null} description="Sans GPS" />
    );
    expect(missingHtml).toContain('data-testid="map-missing-coords"');
    expect(missingHtml).toContain('Coordonnées géographiques indisponibles');

    vi.spyOn(onlineContext, 'useOnlineStatus').mockReturnValue({
      isOnline: false,
      setIsOnline: vi.fn(),
    });
    const offlineHtml = renderToStaticMarkup(
      <AddressMap latitude={12.578333} longitude={-16.271944} description="Hors ligne" />
    );
    expect(offlineHtml).toContain('Carte indisponible hors ligne');
    expect(offlineHtml).toContain('12.578333°N, -16.271944°O');
  });

  it('ShareAddress expose le lien, WhatsApp, le QR Code optionnel et le SMS selon l’état d’authentification', () => {
    const anonNoQr = renderToStaticMarkup(<ShareAddress code="ZIG-KBG-4271" showQrCode={false} />);
    expect(anonNoQr).toContain('id="share-copy-code-btn"');
    expect(anonNoQr).toContain('id="share-copy-link-btn"');
    expect(anonNoQr).toContain('id="share-whatsapp-btn"');
    expect(anonNoQr).toContain('sms:?&amp;body=');
    expect(anonNoQr).not.toContain('/qrcode');

    const anonWithQr = renderToStaticMarkup(<ShareAddress code="ZIG-KBG-4271" showQrCode={true} />);
    expect(anonWithQr).toContain('/api/addresses/ZIG-KBG-4271/qrcode');
    expect(anonWithQr).toContain('Télécharger le QR');

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
    const authHtml = renderToStaticMarkup(<ShareAddress code="ZIG-KBG-4271" />);
    expect(authHtml).toContain('id="share-sms-toggle-btn"');
    expect(authHtml).toContain('Envoyer par SMS');
  });

  it('PublicAddressRoutePanel rend les contrôles ORS, le résumé réel et les mentions obligatoires', () => {
    const html = renderToStaticMarkup(
      <PublicAddressRoutePanel
        latitude={12.5783}
        longitude={-16.2719}
        hasCoords={true}
        isOnline={true}
        routeLoading={false}
        routeData={{
          distance: 1450,
          duration: 300,
          profile: 'driving-car',
          geometry: { type: 'LineString', coordinates: [[-16.27, 12.58], [-16.2719, 12.5783]] },
          steps: [{ instruction: 'Tourner à droite', distance: 450, duration: 90, name: 'Avenue' }],
        }}
        routeProfile="driving-car"
        routeError={null}
        stepsOpen={true}
        onToggleSteps={vi.fn()}
        onCalculateRoute={vi.fn()}
        onSwitchProfile={vi.fn()}
        onResetRoute={vi.fn()}
      />
    );

    expect(html).toContain('Itinéraire vers ce lieu');
    expect(html).toContain('Voiture');
    expect(html).toContain('À pied');
    expect(html).toContain('5 min');
    expect(html).toContain('(1,4 km)');
    expect(html).toContain('Tourner à droite');
    expect(html).toContain('Votre position n&#x27;est pas enregistrée.');
    expect(html).toContain('Ouvrir dans Google Maps');
  });

  it('AddressReportModal affiche le titre, les 4 motifs backend réels et le champ commentaire', () => {
    const html = renderToStaticMarkup(
      <AddressReportModal isOpen={true} code="ZIG-KBG-4271" onClose={vi.fn()} />
    );

    expect(html).toContain('id="report-modal-title"');
    expect(html).toContain('id="report-comment"');
    expect(html).toContain('value="POSITION_INCORRECTE"');
    expect(html).toContain('value="CONTENU_INAPPROPRIE"');
    expect(html).toContain('value="PHOTO_INAPPROPRIEE"');
    expect(html).toContain('value="AUTRE"');
    expect(html).toContain('Envoyer le signalement');
  });

  it('Les étapes du wizard de création affichent progression, détection de quartier, visibilité conditionnelle et distinction en ligne / hors ligne', () => {
    const stepperHtml = renderToStaticMarkup(
      <WizardStepper currentStep={2} headingRef={{ current: null }} onStepSelect={vi.fn()} />
    );
    expect(stepperHtml).toContain('Étape 2 sur 4 : Informations du lieu');
    expect(stepperHtml).toContain('role="progressbar"');
    expect(stepperHtml).toContain('aria-valuenow="2"');

    const step1Covered = renderToStaticMarkup(
      <WizardStepLocation
        latitude="12.578333"
        longitude="-16.271944"
        onLatitudeChange={vi.fn()}
        onLongitudeChange={vi.fn()}
        onMapPositionChange={vi.fn()}
        gpsAccuracy={15}
        loadingGps={false}
        gpsAcquired={true}
        gpsError={null}
        onCaptureGps={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(step1Covered).toContain('data-testid="detected-quartier-badge"');
    expect(step1Covered).toContain('Boucotte');
    expect(step1Covered).toContain('Précision : ± 15 m');

    const step1Outside = renderToStaticMarkup(
      <WizardStepLocation
        latitude="13.7700"
        longitude="-13.6700"
        onLatitudeChange={vi.fn()}
        onLongitudeChange={vi.fn()}
        onMapPositionChange={vi.fn()}
        gpsAccuracy={null}
        loadingGps={false}
        gpsAcquired={false}
        gpsError={null}
        onCaptureGps={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(step1Outside).toContain('data-testid="outside-zone-hint"');

    const step2Private = renderToStaticMarkup(
      <WizardStepDetails
        locationType="MAISON"
        onLocationTypeChange={vi.fn()}
        description="Portail bleu"
        onDescriptionChange={vi.fn()}
        listed={false}
        onListedChange={vi.fn()}
        showOwnerName={false}
        onShowOwnerNameChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(step2Private).toContain('id="address-desc"');
    expect(step2Private).toContain('id="directory-listed"');
    expect(step2Private).not.toContain('id="directory-show-owner"');

    const step3Html = renderToStaticMarkup(
      <WizardStepPhoto
        fileInputRef={{ current: null }}
        photoFile={null}
        photoPreview={null}
        compressing={false}
        compressionStats={null}
        photoError={null}
        submitting={false}
        summaryQuartierLabel="Boucotte - Kangourou · Ziguinchor"
        locationType="COMMERCE"
        onPhotoSelect={vi.fn()}
        onRemovePhoto={vi.fn()}
        onBack={vi.fn()}
        onSubmitWithoutPhoto={vi.fn()}
        onSubmitWithPhoto={vi.fn()}
      />
    );
    expect(step3Html).toContain('Passer cette étape');
    expect(step3Html).toContain('Valider et créer l&#x27;adresse');

    const baseAddr = {
      id: 'id-1',
      code: 'ZIG-KBG-9001',
      latitude: 12.5783,
      longitude: -16.2719,
      zone: 'ZIG',
      quartier: 'KBG',
      description: 'Boutique test',
      locationType: 'COMMERCE' as const,
      status: 'ACTIVE' as const,
      createdAt: '2026-10-15T10:00:00Z',
      owner: {
        id: 'u1',
        fullName: 'Mamadou',
        email: 'demo@samaadresse.sn',
        phoneNumber: '+221771234567',
        role: 'PROPRIETAIRE',
      },
    };

    const step4Online = renderToStaticMarkup(
      <MemoryRouter>
        <WizardStepResult
          createdAddress={baseAddr}
          isOfflineCreated={false}
          hasTemporaryCode={false}
          onDownloadQrCode={vi.fn()}
          onReset={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(step4Online).toContain('Adresse créée et enregistrée');
    expect(step4Online).toContain('/api/addresses/ZIG-KBG-9001/qrcode');
    expect(step4Online).toContain('href="/a/ZIG-KBG-9001"');

    const step4Offline = renderToStaticMarkup(
      <MemoryRouter>
        <WizardStepResult
          createdAddress={{ ...baseAddr, code: 'ZIG-KBG-????' }}
          isOfflineCreated={true}
          hasTemporaryCode={true}
          onDownloadQrCode={vi.fn()}
          onReset={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(step4Offline).toContain('Enregistrée sur cet appareil · en attente d&#x27;envoi');
    expect(step4Offline).toContain('Code temporaire attribué hors ligne');
    expect(step4Offline).not.toContain('/qrcode');
    expect(step4Offline).toContain('href="/addresses/mine"');
  });
});
