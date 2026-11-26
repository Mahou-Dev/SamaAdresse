import React from 'react';
import { MapPin, Navigation, ExternalLink, WifiOff } from 'lucide-react';
import { AddressMap } from '../AddressMap';
import { getQuartierName, getZoneName } from '../../utils/geoGrid';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

export interface MapPreviewProps {
  latitude: number;
  longitude: number;
  code?: string;
  zone?: string;
  quartier?: string;
  description?: string;
  /** Si true, affiche la carte interactive Leaflet (chargée en différé). Sinon, aperçu léger des coordonnées. */
  interactive?: boolean;
  isOffline?: boolean;
  showDirections?: boolean;
  className?: string;
}

export const MapPreview: React.FC<MapPreviewProps> = ({
  latitude,
  longitude,
  code,
  zone,
  quartier,
  description = 'Emplacement géolocalisé',
  interactive = false,
  isOffline = false,
  showDirections = true,
  className,
}) => {
  const quartierName = quartier ? getQuartierName(quartier, zone) : '';
  const zoneName = zone ? getZoneName(zone) : '';
  const locationLabel = [quartierName, zoneName].filter(Boolean).join(', ');
  const formattedCoords = `${latitude.toFixed(6)}°N, ${longitude.toFixed(6)}°O`;
  const externalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  if (interactive) {
    return (
      <div className={cn('w-full', className)}>
        <AddressMap
          latitude={latitude}
          longitude={longitude}
          code={code}
          description={description}
          showDirections={showDirections}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface overflow-hidden shadow-xs',
        className
      )}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-institution-soft border border-institution-border text-institution flex items-center justify-center shrink-0">
            {isOffline ? (
              <WifiOff className="w-5 h-5 text-warning" aria-hidden="true" />
            ) : (
              <MapPin className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-ink truncate">
              {locationLabel || code || 'Coordonnées GPS vérifiées'}
            </p>
            <p className="text-xs font-mono text-ink-muted">{formattedCoords}</p>
            {isOffline && (
              <p className="text-xs text-warning font-medium pt-0.5">
                Carte indisponible hors ligne — coordonnées locales conservées.
              </p>
            )}
          </div>
        </div>

        {showDirections && !isOffline && (
          <Button
            variant="outline"
            size="sm"
            href={externalDirectionsUrl}
            target="_blank"
            leftIcon={Navigation}
            rightIcon={ExternalLink}
            className="shrink-0"
          >
            Itinéraire
          </Button>
        )}
      </div>
    </div>
  );
};
