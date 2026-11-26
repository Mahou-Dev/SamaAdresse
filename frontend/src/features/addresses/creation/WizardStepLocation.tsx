import React, { useMemo } from 'react';
import {
  Navigation,
  Loader2,
  Check,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { AddressMap } from '../../../components/AddressMap';
import { resolveQuartier, getZoneName, getCoveredZoneNames } from '../../../utils/geoGrid';
import { validateStep1Position } from '../../../utils/formValidation';
import { cn } from '../../../utils/cn';

export interface WizardStepLocationProps {
  latitude: string;
  longitude: string;
  onLatitudeChange: (val: string) => void;
  onLongitudeChange: (val: string) => void;
  onMapPositionChange: (lat: number, lng: number) => void;
  gpsAccuracy: number | null;
  loadingGps: boolean;
  gpsAcquired: boolean;
  gpsError: string | null;
  onCaptureGps: () => void;
  onNext: () => void;
}

export const WizardStepLocation: React.FC<WizardStepLocationProps> = ({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  onMapPositionChange,
  gpsAccuracy,
  loadingGps,
  gpsAcquired,
  gpsError,
  onCaptureGps,
  onNext,
}) => {
  const parsedLat = parseFloat(latitude);
  const parsedLng = parseFloat(longitude);
  const coordsValidation = validateStep1Position(parsedLat, parsedLng);

  const detectedArea = useMemo(() => {
    if (!coordsValidation.isValid) {
      return { status: 'invalid' as const };
    }
    try {
      const quartier = resolveQuartier(parsedLat, parsedLng);
      return {
        status: 'covered' as const,
        quartierName: quartier.name,
        quartierCode: quartier.code,
        zoneName: getZoneName(quartier.zoneCode),
        zoneCode: quartier.zoneCode,
      };
    } catch {
      return { status: 'outside' as const };
    }
  }, [coordsValidation.isValid, parsedLat, parsedLng]);

  const coveredZonesText = getCoveredZoneNames().join(', ');

  return (
    <section aria-labelledby="step1-title" className="space-y-5 sa-animate-fade-in">
      <div className="space-y-1.5">
        <h1
          id="step1-title"
          className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight"
        >
          Où se situe votre lieu ?
        </h1>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Capturez votre position GPS devant l'entrée du bâtiment ou déplacez le repère sur la carte pour définir le point exact de votre adresse permanente.
        </p>
      </div>

      {/* Barre d'action GPS & détection de quartier en temps réel */}
      <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCaptureGps}
            disabled={loadingGps}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-ink hover:bg-ink-secondary text-ink-inverse text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
          >
            {loadingGps ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-border" aria-hidden="true" />
                <span>Signal en cours d'acquisition…</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-brand-border" aria-hidden="true" />
                <span>Capturer ma position GPS</span>
              </>
            )}
          </button>

          {gpsAcquired && gpsAccuracy !== null && (
            <div
              className={cn(
                'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border',
                gpsAccuracy > 50
                  ? 'bg-warning-soft text-warning border-warning-border'
                  : 'bg-success-soft text-success border-success-border'
              )}
            >
              {gpsAccuracy > 50 ? (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>Précision : ± {Math.round(gpsAccuracy)} m</span>
            </div>
          )}
        </div>

        {/* Aperçu temps réel de la zone / quartier détecté */}
        {detectedArea.status === 'covered' ? (
          <div
            data-testid="detected-quartier-badge"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success-soft border border-success-border text-xs font-medium text-success"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              Zone détectée : <strong>{detectedArea.quartierName}</strong> ({detectedArea.zoneName})
            </span>
          </div>
        ) : detectedArea.status === 'outside' ? (
          <div
            data-testid="outside-zone-hint"
            className="flex items-start gap-2 px-3 py-2 rounded-xl bg-warning-soft border border-warning-border text-xs font-medium text-warning"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Ce point est hors des zones couvertes ({coveredZonesText}). Déplacez le repère vers une zone couverte.
            </span>
          </div>
        ) : null}
      </div>

      {/* Avertissement précision GPS faible (> 50m) */}
      {gpsAccuracy !== null && gpsAccuracy > 50 && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-warning-soft border border-warning-border text-xs text-warning flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Précision GPS faible (± {Math.round(gpsAccuracy)} m). Rapprochez-vous d'une zone dégagée ou affinez manuellement le repère sur la carte.
          </span>
        </div>
      )}

      {/* Erreur GPS explicite */}
      {gpsError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-danger-soft border border-danger-border text-xs sm:text-sm text-danger flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Carte interactive avec marqueur déplaçable */}
      <div className="space-y-2">
        <AddressMap
          latitude={coordsValidation.isValid ? parsedLat : null}
          longitude={coordsValidation.isValid ? parsedLng : null}
          draggable={true}
          onPositionChange={onMapPositionChange}
          accuracyRadiusMeters={gpsAccuracy}
          showDirections={false}
          heightClassName="h-72 sm:h-[360px]"
          description="Emplacement sélectionné"
        />
        <p className="text-xs text-ink-muted">
          Touchez la carte ou déplacez le repère Terracotta pour ajuster l'emplacement exact de l'entrée.
        </p>
      </div>

      {/* Saisie manuelle pliable (coordonnées exactes) */}
      <details className="group rounded-2xl border border-border bg-surface p-4 text-xs sm:text-sm">
        <summary className="font-semibold text-institution cursor-pointer hover:text-institution-hover list-none flex items-center justify-between gap-2 focus-visible:outline-2 focus-visible:outline-institution rounded-lg">
          <span>Saisir les coordonnées manuellement</span>
          <ChevronDown
            className="w-4 h-4 text-ink-muted group-open:rotate-180 transition-transform shrink-0"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-3.5 pt-3.5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label htmlFor="manual-lat" className="block text-xs font-semibold text-ink">
              Latitude (°N)
            </label>
            <input
              id="manual-lat"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => onLatitudeChange(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] border border-border-control rounded-xl text-sm bg-surface-elevated font-mono text-ink focus-visible:outline-none focus-visible:border-institution focus-visible:ring-3 focus-visible:ring-institution/20"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="manual-lng" className="block text-xs font-semibold text-ink">
              Longitude (°O)
            </label>
            <input
              id="manual-lng"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => onLongitudeChange(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] border border-border-control rounded-xl text-sm bg-surface-elevated font-mono text-ink focus-visible:outline-none focus-visible:border-institution focus-visible:ring-3 focus-visible:ring-institution/20"
            />
          </div>
        </div>
      </details>

      {/* Action Suivant */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-sm font-semibold transition-colors shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
        >
          <span>Continuer vers les détails</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
