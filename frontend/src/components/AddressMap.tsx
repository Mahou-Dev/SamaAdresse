import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Navigation, MapPin, ExternalLink, Loader2, WifiOff, MapPinOff } from 'lucide-react';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { hasValidCoordinates } from '../features/addresses/utils';
import { cn } from '../utils/cn';

const LazyLeafletMapInner = lazy(() => import('./LeafletMapInner'));

export interface AddressMapProps {
  latitude?: number | null;
  longitude?: number | null;
  code?: string;
  description: string;
  locationType?: string;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  accuracyRadiusMeters?: number | null;
  showDirections?: boolean;
  routeGeometry?: [number, number][];
  startPosition?: [number, number];
  heightClassName?: string;
}

const MapSkeleton: React.FC = () => (
  <div className="w-full h-full bg-surface flex flex-col items-center justify-center gap-2.5 text-ink-muted animate-pulse">
    <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-institution shadow-xs">
      <MapPin className="w-5 h-5" aria-hidden="true" />
    </div>
    <span className="text-xs font-medium">Chargement de la carte…</span>
  </div>
);

export const AddressMap: React.FC<AddressMapProps> = ({
  latitude,
  longitude,
  code = 'Position GPS',
  description,
  draggable = false,
  onPositionChange,
  accuracyRadiusMeters,
  showDirections = true,
  routeGeometry,
  startPosition,
  heightClassName = 'h-64 sm:h-80',
}) => {
  const { isOnline } = useOnlineStatus();
  const [loadingGps, setLoadingGps] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const coordsValid = hasValidCoordinates(latitude, longitude);

  useEffect(() => {
    const timer = window.setTimeout(() => setMapReady(true), 60);
    return () => window.clearTimeout(timer);
  }, []);

  const handleOpenDirections = () => {
    if (!coordsValid) return;
    const destLat = latitude as number;
    const destLon = longitude as number;

    if (navigator.geolocation) {
      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingGps(false);
          const originLat = position.coords.latitude;
          const originLon = position.coords.longitude;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        () => {
          setLoadingGps(false);
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        { timeout: 5000 }
      );
    } else {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-3">
      {/* Cadre cartographique Clarté */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden border border-border shadow-xs bg-surface z-0',
          heightClassName
        )}
      >
        {!coordsValid ? (
          <div
            data-testid="map-missing-coords"
            className="w-full h-full bg-surface flex flex-col items-center justify-center gap-2.5 text-ink-muted p-6 text-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-ink-muted">
              <MapPinOff className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-ink">
              Coordonnées géographiques indisponibles
            </span>
            <p className="text-xs text-ink-muted max-w-xs leading-relaxed">
              Aucun repère cartographique ne peut être affiché tant que les coordonnées GPS ne sont pas disponibles.
            </p>
          </div>
        ) : !isOnline ? (
          <div className="leaflet-container w-full h-full bg-surface flex flex-col items-center justify-center gap-2.5 text-ink-muted p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-warning-soft border border-warning-border flex items-center justify-center text-warning">
              <WifiOff className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-ink">Carte indisponible hors ligne</span>
            <p className="text-xs text-ink-muted max-w-xs leading-relaxed">
              Les tuiles cartographiques ne peuvent pas être chargées sans connexion réseau. Les coordonnées restent enregistrées ci-dessous.
            </p>
            <span className="font-mono text-xs font-semibold text-institution bg-surface-elevated border border-border px-3 py-1 rounded-full">
              {(latitude as number).toFixed(6)}°N, {(longitude as number).toFixed(6)}°O
            </span>
          </div>
        ) : mapReady ? (
          <Suspense fallback={<MapSkeleton />}>
            <LazyLeafletMapInner
              latitude={latitude as number}
              longitude={longitude as number}
              code={code}
              description={description}
              draggable={draggable}
              onPositionChange={onPositionChange}
              accuracyRadiusMeters={accuracyRadiusMeters}
              routeGeometry={routeGeometry}
              startPosition={startPosition}
            />
          </Suspense>
        ) : (
          <MapSkeleton />
        )}
      </div>

      {showDirections && coordsValid && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-ink-muted font-mono flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden="true" />
            <span>
              {(latitude as number).toFixed(6)}°N, {(longitude as number).toFixed(6)}°O
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenDirections}
            disabled={loadingGps}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-institution text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px] focus-visible:outline-2 focus-visible:outline-institution"
          >
            {loadingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>Itinéraire</span>
            <ExternalLink className="w-3 h-3 opacity-80" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
