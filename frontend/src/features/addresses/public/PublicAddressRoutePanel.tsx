import React from 'react';
import {
  Navigation,
  Car,
  Footprints,
  Loader2,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import type { RouteResponse } from '../../../api/addressApi';
import { formatDistance, formatDuration } from '../utils';
import type { RouteProfile } from './useAddressRoute';
import { cn } from '../../../utils/cn';

export interface PublicAddressRoutePanelProps {
  latitude?: number | null;
  longitude?: number | null;
  hasCoords: boolean;
  isOnline: boolean;
  routeLoading: boolean;
  routeData: RouteResponse | null;
  routeProfile: RouteProfile;
  routeError: string | null;
  stepsOpen: boolean;
  onToggleSteps: () => void;
  onCalculateRoute: () => void;
  onSwitchProfile: (profile: RouteProfile) => void;
  onResetRoute: () => void;
}

export const PublicAddressRoutePanel: React.FC<PublicAddressRoutePanelProps> = ({
  latitude,
  longitude,
  hasCoords,
  isOnline,
  routeLoading,
  routeData,
  routeProfile,
  routeError,
  stepsOpen,
  onToggleSteps,
  onCalculateRoute,
  onSwitchProfile,
  onResetRoute,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-institution-soft border border-institution-border text-institution flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink leading-snug">Itinéraire vers ce lieu</h3>
            <p className="text-xs text-ink-muted">Calcul routier ou piéton via OpenRouteService</p>
          </div>
        </div>

        {/* Bascule Voiture / À pied */}
        <div
          role="group"
          aria-label="Mode de déplacement"
          className="inline-flex rounded-full border border-border p-1 bg-surface text-xs"
        >
          <button
            type="button"
            aria-pressed={routeProfile === 'driving-car'}
            onClick={() => onSwitchProfile('driving-car')}
            disabled={!hasCoords}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full font-semibold transition-colors cursor-pointer disabled:opacity-50',
              'focus-visible:outline-2 focus-visible:outline-institution',
              routeProfile === 'driving-car'
                ? 'bg-institution text-ink-inverse shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            )}
          >
            <Car className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Voiture</span>
          </button>
          <button
            type="button"
            aria-pressed={routeProfile === 'foot-walking'}
            onClick={() => onSwitchProfile('foot-walking')}
            disabled={!hasCoords}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full font-semibold transition-colors cursor-pointer disabled:opacity-50',
              'focus-visible:outline-2 focus-visible:outline-institution',
              routeProfile === 'foot-walking'
                ? 'bg-institution text-ink-inverse shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            )}
          >
            <Footprints className="w-3.5 h-3.5" aria-hidden="true" />
            <span>À pied</span>
          </button>
        </div>
      </div>

      {/* Bouton de déclenchement ORS */}
      {!routeData && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onCalculateRoute}
            disabled={routeLoading || !isOnline || !hasCoords}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-institution hover:bg-institution-hover text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
          >
            {routeLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Calcul de l'itinéraire en cours…</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" aria-hidden="true" />
                <span>Itinéraire depuis ma position</span>
              </>
            )}
          </button>

          {!isOnline && (
            <p className="text-xs text-warning font-medium">
              Itinéraire indisponible hors ligne.
            </p>
          )}
          {!hasCoords && isOnline && (
            <p className="text-xs text-ink-muted">
              Calcul d'itinéraire indisponible sans coordonnées géographiques.
            </p>
          )}
        </div>
      )}

      {/* Erreur itinéraire */}
      {routeError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-danger-soft border border-danger-border text-danger text-xs sm:text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{routeError}</span>
        </div>
      )}

      {/* Résumé réel de l'itinéraire calculé */}
      {routeData && (
        <div className="space-y-3" data-testid="ors-route-summary">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-institution-soft border border-institution-border">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-lg font-extrabold text-institution">
                {formatDuration(routeData.duration)}
              </span>
              <span className="text-xs sm:text-sm text-ink-secondary font-mono font-semibold">
                ({formatDistance(routeData.distance)})
              </span>
              {routeLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-institution" aria-hidden="true" />
              )}
            </div>

            <div className="flex items-center gap-2">
              {routeData.steps.length > 0 && (
                <button
                  type="button"
                  onClick={onToggleSteps}
                  aria-expanded={stepsOpen}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-institution hover:text-institution-hover cursor-pointer px-2 py-1.5 rounded-lg hover:bg-canvas/70 transition-colors"
                >
                  <span>
                    {stepsOpen
                      ? 'Masquer les étapes'
                      : `Voir les ${routeData.steps.length} étapes`}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform',
                      stepsOpen && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </button>
              )}

              <button
                type="button"
                onClick={onResetRoute}
                aria-label="Effacer l'itinéraire"
                title="Effacer l'itinéraire"
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas/70 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {stepsOpen && routeData.steps.length > 0 && (
            <ol className="p-3.5 bg-surface rounded-xl border border-border divide-y divide-border text-xs space-y-1 max-h-64 overflow-y-auto">
              {routeData.steps.map((st, idx) => (
                <li key={idx} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <span className="text-ink leading-snug">
                    <span className="font-mono text-ink-muted mr-1.5">{idx + 1}.</span>
                    {st.instruction}
                  </span>
                  <span className="text-ink-muted font-mono text-[11px] shrink-0">
                    {formatDistance(st.distance)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Mention confidentialité & repli Google Maps */}
      <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>Votre position n'est pas enregistrée.</span>
        {hasCoords && typeof latitude === 'number' && typeof longitude === 'number' && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-institution hover:text-institution-hover hover:underline"
          >
            <span>Ouvrir dans Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
};
