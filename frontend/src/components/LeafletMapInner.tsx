import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle } from 'lucide-react';

// Marqueur principal aux couleurs SamaAdresse Clarté (Terracotta #C2410C, cible tactile >= 44x44 px)
const createMarkerIcon = (isDraggable: boolean) =>
  L.divIcon({
    className: 'custom-leaflet-marker touch-manipulation',
    html: `
      <div role="img" aria-label="Repère d'emplacement" title="Repère d'emplacement" style="
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: ${isDraggable ? 'grab' : 'pointer'};
        touch-action: none;
      ">
        <div style="
          background-color: #C2410C;
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 10px rgba(15,23,42,0.28);
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: #FFFFFF;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });

const createStartMarkerIcon = () =>
  L.divIcon({
    className: 'custom-leaflet-start-marker',
    html: `
      <div role="img" aria-label="Point de départ" title="Votre position de départ" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background-color: #0369A1;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(15,23,42,0.28);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

export interface LeafletMapInnerProps {
  latitude: number;
  longitude: number;
  code?: string;
  description?: string;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  accuracyRadiusMeters?: number | null;
  routeGeometry?: [number, number][];
  startPosition?: [number, number];
}

// Composant interne pour synchroniser le centre, les bornes et la taille du conteneur de la carte
const MapController: React.FC<{
  latitude: number;
  longitude: number;
  routeGeometry?: [number, number][];
  startPosition?: [number, number];
  onPositionChange?: (lat: number, lng: number) => void;
}> = ({ latitude, longitude, routeGeometry, startPosition, onPositionChange }) => {
  const map = useMap();

  useEffect(() => {
    const syncView = () => {
      map.invalidateSize({ animate: false });
      if (routeGeometry && routeGeometry.length > 1) {
        const points: [number, number][] = [...routeGeometry, [latitude, longitude]];
        if (startPosition) {
          points.push(startPosition);
        }
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [44, 44], animate: false });
        map.invalidateSize({ animate: false });
      } else {
        map.setView([latitude, longitude], map.getZoom(), { animate: false });
      }
    };

    syncView();
    const timer = window.setTimeout(syncView, 150);

    const container = map.getContainer();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => {
        syncView();
      });
      observer.observe(container);
    }

    return () => {
      window.clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [latitude, longitude, routeGeometry, startPosition, map]);

  useMapEvents({
    click(e) {
      if (onPositionChange) {
        onPositionChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    },
  });

  return null;
};

const LeafletMapInner: React.FC<LeafletMapInnerProps> = ({
  latitude,
  longitude,
  code = 'Position GPS',
  description,
  draggable = false,
  onPositionChange,
  accuracyRadiusMeters,
  routeGeometry,
  startPosition,
}) => {
  const markerRef = useRef<L.Marker>(null);
  const [hasTileError, setHasTileError] = useState(false);
  const icon = useMemo(() => createMarkerIcon(draggable), [draggable]);

  const tileAttribution =
    import.meta.env.VITE_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const tileUrl =
    import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null && onPositionChange) {
          const latlng = marker.getLatLng();
          onPositionChange(Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6)));
        }
      },
    }),
    [onPositionChange]
  );

  const offlineTileFallback = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23F8FAFC"/><rect x="4" y="4" width="248" height="248" fill="none" stroke="%23CBD5E1" stroke-width="1.5" stroke-dasharray="6,6"/><text x="128" y="118" text-anchor="middle" font-family="Outfit, sans-serif" font-size="11" font-weight="bold" fill="%230F172A">Tuile indisponible</text><text x="128" y="136" text-anchor="middle" font-family="Outfit, sans-serif" font-size="10" fill="%235B6B7F">pour cette zone</text></svg>`;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          maxZoom={19}
          detectRetina={true}
          crossOrigin="anonymous"
          errorTileUrl={offlineTileFallback}
          eventHandlers={{
            tileerror: () => {
              setHasTileError(true);
            },
          }}
        />
        <MapController
          latitude={latitude}
          longitude={longitude}
          routeGeometry={routeGeometry}
          startPosition={startPosition}
          onPositionChange={onPositionChange}
        />

        {/* Cercle d'imprécision GPS si disponible */}
        {accuracyRadiusMeters && accuracyRadiusMeters > 0 && (
          <Circle
            center={[latitude, longitude]}
            radius={accuracyRadiusMeters}
            pathOptions={{
              color: '#0369A1',
              fillColor: '#0369A1',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '4 4',
            }}
          />
        )}

        {/* Tracé de l'itinéraire OpenRouteService */}
        {routeGeometry && routeGeometry.length > 1 && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: '#0369A1',
              weight: 5,
              opacity: 0.88,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Marqueur de départ */}
        {startPosition && (
          <Marker position={startPosition} icon={createStartMarkerIcon()}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-center font-sans text-xs font-semibold text-institution">
                Votre position de départ
              </div>
            </Popup>
          </Marker>
        )}

        <Marker
          draggable={draggable}
          eventHandlers={eventHandlers}
          position={[latitude, longitude]}
          icon={icon}
          ref={markerRef}
        >
          {description && (
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-center font-sans space-y-1">
                <span className="font-mono font-bold text-institution text-xs block">{code}</span>
                <p className="text-[11px] text-ink leading-snug">{description}</p>
              </div>
            </Popup>
          )}
        </Marker>
      </MapContainer>

      {hasTileError && (
        <div
          role="status"
          className="absolute top-3 left-3 right-3 z-[400] max-w-md rounded-xl bg-warning-soft/95 backdrop-blur-xs border border-warning-border px-3.5 py-2 text-xs font-medium text-warning flex items-center gap-2 shadow-sm pointer-events-none"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Certaines tuiles de carte n'ont pas pu être chargées. Le repère reste exact.</span>
        </div>
      )}
    </div>
  );
};

export default LeafletMapInner;
