import React, { lazy, Suspense, useState } from 'react';
import { Navigation, MapPin, ExternalLink, Loader2 } from 'lucide-react';

const LazyLeafletMapInner = lazy(() => import('./LeafletMapInner'));

interface AddressMapProps {
  latitude: number;
  longitude: number;
  code?: string;
  description: string;
  locationType?: string;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  accuracyRadiusMeters?: number | null;
  showDirections?: boolean;
  routeGeometry?: [number, number][];
  startPosition?: [number, number];
}

// Squelette de chargement ayant la hauteur exacte de la carte
const MapSkeleton: React.FC = () => (
  <div className="w-full h-full bg-[#F2ECE1] flex flex-col items-center justify-center gap-2 text-[#5C4D44] animate-pulse">
    <MapPin className="w-6 h-6 text-[#1D528F] animate-bounce" />
    <span className="text-xs font-medium">Chargement de la carte...</span>
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
}) => {
  const [loadingGps, setLoadingGps] = useState<boolean>(false);

  const handleOpenDirections = () => {
    if (navigator.geolocation) {
      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingGps(false);
          const originLat = position.coords.latitude;
          const originLon = position.coords.longitude;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${latitude},${longitude}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        () => {
          setLoadingGps(false);
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        { timeout: 5000 }
      );
    } else {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-3">
      {/* Cadre de carte émaillé et sobre */}
      <div className="relative rounded-xl overflow-hidden border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.08)] h-64 sm:h-80 bg-[#F2ECE1] z-0">
        <Suspense fallback={<MapSkeleton />}>
          <LazyLeafletMapInner
            latitude={latitude}
            longitude={longitude}
            code={code}
            description={description}
            draggable={draggable}
            onPositionChange={onPositionChange}
            accuracyRadiusMeters={accuracyRadiusMeters}
            routeGeometry={routeGeometry}
            startPosition={startPosition}
          />
        </Suspense>
      </div>

      {showDirections && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-[#5C4D44] font-mono flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#B84A24] shrink-0" />
            <span>{latitude.toFixed(6)}°N, {longitude.toFixed(6)}°O</span>
          </div>

          <button
            type="button"
            onClick={handleOpenDirections}
            disabled={loadingGps}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs font-semibold transition shadow-[0_1px_0_rgba(35,26,21,0.06)] cursor-pointer disabled:opacity-50 touch-target"
          >
            {loadingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>Itinéraire</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </button>
        </div>
      )}
    </div>
  );
};
