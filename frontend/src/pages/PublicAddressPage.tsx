import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  Navigation,
  Share2,
  Image as ImageIcon,
  ExternalLink,
  Flag,
  WifiOff,
  Compass,
} from 'lucide-react';
import { PublicLayout } from '../app/layouts/PublicLayout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { ErrorState } from '../components/ui/ErrorState';
import { AddressPlate } from '../components/AddressPlate';
import { AddressMap } from '../components/AddressMap';
import { ShareAddress } from '../components/ShareAddress';
import { LocationBadge } from '../components/shared/LocationBadge';
import { NeighborhoodTag } from '../components/shared/NeighborhoodTag';
import { getQuartierName, getZoneName } from '../utils/geoGrid';
import { usePublicAddress } from '../features/addresses/public/usePublicAddress';
import { useAddressRoute } from '../features/addresses/public/useAddressRoute';
import { PublicAddressRoutePanel } from '../features/addresses/public/PublicAddressRoutePanel';
import { AddressReportModal } from '../features/addresses/public/AddressReportModal';
import {
  hasValidCoordinates,
  resolvePhotoSrc,
} from '../features/addresses/utils';

// Ré-exports maintenus pour compatibilité stricte des tests unitaires existants (lot4.test.ts, lot6.test.ts)
export {
  REPORT_REASONS,
  formatDistance,
  formatDuration,
} from '../features/addresses/utils';

export const PublicAddressPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const {
    address,
    loading,
    errorMsg,
    errorStatus,
    isOnline,
    cachedDate,
    visitedCodes,
    reload,
  } = usePublicAddress(code);

  const route = useAddressRoute(address, isOnline);

  const [photoErrorUrl, setPhotoErrorUrl] = useState<string | null>(null);
  const [photoLoadedUrl, setPhotoLoadedUrl] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const photoSrc = resolvePhotoSrc(address?.photoUrl);
  const hasPhoto = Boolean(photoSrc) && photoErrorUrl !== photoSrc;
  const photoLoaded = Boolean(photoSrc) && photoLoadedUrl === photoSrc;
  const coordsValid = address ? hasValidCoordinates(address.latitude, address.longitude) : false;

  const zoneDisplayName = address ? getZoneName(address.zone) : '';
  const quartierDisplayName = address ? getQuartierName(address.quartier, address.zone) : '';

  const handleOpenExternalDirections = () => {
    if (!address || !coordsValid) return;
    const destLat = address.latitude;
    const destLng = address.longitude;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingGps(false);
          const originLat = position.coords.latitude;
          const originLon = position.coords.longitude;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLng}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        () => {
          setLoadingGps(false);
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        { timeout: 5000 }
      );
    } else {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <PublicLayout maxWidth="wide" surface="canvas">
      <div className="space-y-6 pb-8">
        {/* Fil d'Ariane clair */}
        <Breadcrumb
          items={[
            { label: 'Accueil', to: '/' },
            { label: 'Annuaire', to: '/annuaire' },
            { label: address?.code || code || 'Fiche adresse' },
          ]}
        />

        {/* 1. État de chargement (squelette dimensionné CLS < 0.1) */}
        {loading ? (
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 animate-pulse"
            aria-label="Chargement de la fiche publique"
          >
            <div className="lg:col-span-5 space-y-5">
              <div className="h-64 rounded-3xl bg-surface border border-border" />
              <div className="h-36 rounded-2xl bg-surface border border-border" />
            </div>
            <div className="lg:col-span-7 space-y-5">
              <div className="h-64 sm:h-80 rounded-2xl bg-surface border border-border" />
              <div className="h-80 rounded-2xl bg-surface border border-border" />
            </div>
          </div>
        ) : errorStatus === 410 ? (
          /* 2. Adresse archivée ou suspendue (410 Gone) : aucune plaque ni donnée privée */
          <div className="max-w-lg mx-auto p-8 sm:p-10 text-center rounded-3xl bg-surface border border-border shadow-xs space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border text-ink-muted flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-ink tracking-tight">
                Cette adresse n'est plus disponible.
              </h1>
              <p className="text-sm text-ink-muted leading-relaxed">
                La fiche demandée a été archivée ou retirée et ne peut plus être consultée.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link
                to="/annuaire"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse font-semibold text-sm transition-colors shadow-xs"
              >
                <Compass className="w-4 h-4" aria-hidden="true" />
                <span>Explorer l'annuaire</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface-hover text-ink font-semibold text-sm transition-colors"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        ) : !isOnline && !address ? (
          /* 3. Repli sobre hors ligne pour fiche jamais visitée */
          <div className="max-w-lg mx-auto p-8 sm:p-10 text-center rounded-3xl bg-surface border border-border shadow-xs space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-warning-soft border border-warning-border text-warning flex items-center justify-center mx-auto">
              <WifiOff className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-ink tracking-tight">
                Cette page n'est pas disponible hors ligne
              </h1>
              <p className="text-sm text-ink-muted leading-relaxed">
                Cette adresse n'a pas encore été consultée sur cet appareil ou n'est pas conservée en mémoire.
              </p>
            </div>

            {visitedCodes.length > 0 && (
              <div className="p-4 rounded-2xl bg-surface-elevated border border-border text-left space-y-2.5">
                <span className="text-xs font-semibold text-ink-secondary block">
                  Fiches déjà enregistrées hors ligne :
                </span>
                <div className="flex flex-wrap gap-2">
                  {visitedCodes.map((vCode) => (
                    <Link
                      key={vCode}
                      to={`/a/${vCode}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface border border-border text-institution font-mono text-xs font-bold hover:border-institution transition-colors"
                    >
                      {vCode}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-1">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse font-semibold text-sm transition-colors shadow-xs"
              >
                <span>Retour à l'accueil</span>
              </Link>
            </div>
          </div>
        ) : errorMsg ? (
          /* 4. Erreur 404 ou erreur réseau / serveur */
          <div className="max-w-lg mx-auto">
            <ErrorState
              errorCode={errorStatus ?? undefined}
              title={errorStatus === 404 ? 'Adresse introuvable' : 'Impossible de charger cette adresse'}
              description={errorMsg}
              onRetry={errorStatus !== 404 && isOnline ? reload : undefined}
              homeTo="/"
              homeLabel="Retour à l'accueil"
            />
          </div>
        ) : (
          address && (
            <article className="space-y-6">
              {/* Badge version hors ligne enregistrée */}
              {!isOnline && cachedDate && (
                <div
                  role="status"
                  className="p-3.5 rounded-2xl bg-warning-soft border border-warning-border text-warning text-xs sm:text-sm font-medium flex items-center gap-2.5"
                >
                  <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Version enregistrée le {cachedDate}</span>
                </div>
              )}

              {/* Grille principale 2 colonnes sur desktop (Identité & actions à gauche, Visuel & carte à droite) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* COLONNE GAUCHE : Plaque, actions principales, partage, repère visuel */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Carte identité et plaque centrale */}
                  <section
                    aria-labelledby="public-address-heading"
                    className="p-5 sm:p-6 rounded-3xl bg-surface-secondary border border-border shadow-sm space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <LocationBadge type={address.locationType} size="md" />
                      <NeighborhoodTag
                        quartierCode={address.quartier}
                        zoneCode={address.zone}
                        showZone={true}
                      />
                    </div>

                    <h1 id="public-address-heading" className="sr-only">
                      Fiche d'adresse {address.code} — {quartierDisplayName} ({zoneDisplayName})
                    </h1>

                    {/* Plaque SamaAdresse centrale */}
                    <AddressPlate
                      code={address.code}
                      zone={address.zone}
                      type={address.locationType}
                      size="lg"
                      showCopy={true}
                      className="w-full"
                    />

                    {/* Actions principales */}
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleOpenExternalDirections}
                        disabled={loadingGps || !coordsValid}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
                      >
                        {loadingGps ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Navigation className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>Itinéraire depuis ma position</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShareOpen((v) => !v)}
                        aria-expanded={shareOpen}
                        aria-controls="public-share-panel"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-institution text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
                      >
                        <Share2 className="w-4 h-4" aria-hidden="true" />
                        <span>{shareOpen ? 'Masquer le partage' : 'Partager'}</span>
                      </button>
                    </div>
                  </section>

                  {/* Panneau de partage dépliable (contient QR code, lien, WhatsApp, SMS) */}
                  {shareOpen && (
                    <div id="public-share-panel" className="sa-animate-scale-in">
                      <ShareAddress
                        code={address.code}
                        description={address.description}
                        showQrCode={true}
                      />
                    </div>
                  )}

                  {/* Repère visuel & informations géographiques */}
                  <section
                    aria-labelledby="landmark-heading"
                    className="p-5 sm:p-6 rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-4"
                  >
                    <div className="space-y-1.5">
                      <h2
                        id="landmark-heading"
                        className="text-xs font-bold uppercase tracking-wider text-ink-muted"
                      >
                        Repère visuel
                      </h2>
                      <p className="text-sm sm:text-base text-ink font-medium leading-relaxed">
                        {address.description}
                      </p>
                    </div>

                    <dl className="pt-3.5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <dt className="text-ink-muted font-medium">Quartier</dt>
                        <dd className="text-ink font-semibold">
                          {quartierDisplayName} ({address.quartier})
                        </dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className="text-ink-muted font-medium">Zone / Ville</dt>
                        <dd className="text-ink font-semibold">
                          {zoneDisplayName} ({address.zone})
                        </dd>
                      </div>
                      <div className="space-y-0.5 sm:col-span-2">
                        <dt className="text-ink-muted font-medium">Coordonnées GPS</dt>
                        <dd className="font-mono text-ink-secondary font-medium">
                          {coordsValid
                            ? `${address.latitude.toFixed(6)}°N, ${address.longitude.toFixed(6)}°O`
                            : 'Indisponibles'}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>

                {/* COLONNE DROITE : Photographie de façade, Carte interactive et Itinéraire ORS */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Photographie de façade (sans galerie artificielle) */}
                  <section aria-label="Photographie de façade">
                    {hasPhoto && photoSrc ? (
                      <div className="relative rounded-2xl overflow-hidden border border-border shadow-xs h-64 sm:h-80 w-full bg-surface-secondary">
                        {!photoLoaded && (
                          <div className="absolute inset-0 bg-surface-secondary animate-pulse flex items-center justify-center text-xs font-medium text-ink-muted">
                            Chargement de la photo…
                          </div>
                        )}
                        <img
                          src={photoSrc}
                          alt={`Photo de façade ${address.code}`}
                          width={800}
                          height={450}
                          fetchPriority="high"
                          decoding="async"
                          onLoad={() => setPhotoLoadedUrl(photoSrc)}
                          onError={() => setPhotoErrorUrl(photoSrc)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-surface border border-border text-center flex flex-col items-center justify-center gap-2 min-h-[132px]">
                        <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-ink-muted">
                          <ImageIcon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-ink-muted">
                          Pas de photo pour ce lieu
                        </span>
                      </div>
                    )}
                  </section>

                  {/* Carte interactive & itinéraire ORS */}
                  <section aria-labelledby="map-section-heading" className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <h2
                        id="map-section-heading"
                        className="text-base font-bold text-ink flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-institution" aria-hidden="true" />
                        <span>Localisation sur la carte</span>
                      </h2>
                      {coordsValid && (
                        <span className="font-mono text-xs text-ink-muted hidden sm:inline">
                          {address.latitude.toFixed(5)}, {address.longitude.toFixed(5)}
                        </span>
                      )}
                    </div>

                    <AddressMap
                      latitude={address.latitude}
                      longitude={address.longitude}
                      code={address.code}
                      description={address.description}
                      showDirections={false}
                      heightClassName="h-72 sm:h-[360px]"
                      routeGeometry={
                        route.routeData
                          ? (route.routeData.geometry.coordinates.map(([lon, lat]) => [
                              lat,
                              lon,
                            ]) as [number, number][])
                          : undefined
                      }
                      startPosition={
                        route.userCoords
                          ? [route.userCoords.lat, route.userCoords.lon]
                          : undefined
                      }
                    />

                    <PublicAddressRoutePanel
                      latitude={address.latitude}
                      longitude={address.longitude}
                      hasCoords={coordsValid}
                      isOnline={isOnline}
                      routeLoading={route.routeLoading}
                      routeData={route.routeData}
                      routeProfile={route.routeProfile}
                      routeError={route.routeError}
                      stepsOpen={route.stepsOpen}
                      onToggleSteps={() => route.setStepsOpen((v) => !v)}
                      onCalculateRoute={() => {
                        void route.calculateRoute();
                      }}
                      onSwitchProfile={route.switchProfile}
                      onResetRoute={route.resetRoute}
                    />
                  </section>
                </div>
              </div>

              {/* Barre de métadonnées & signalement */}
              <footer className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Créée le {new Date(address.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-institution">{zoneDisplayName}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-danger underline underline-offset-2 transition-colors cursor-pointer py-1.5 px-2 rounded-lg focus-visible:outline-2 focus-visible:outline-institution"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Signaler un problème</span>
                </button>
              </footer>
            </article>
          )
        )}

        {/* Modale accessible de signalement */}
        {code && (
          <AddressReportModal
            isOpen={reportOpen}
            code={code}
            onClose={() => setReportOpen(false)}
          />
        )}
      </div>
    </PublicLayout>
  );
};
