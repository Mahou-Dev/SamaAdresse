import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Marqueur personnalisé aux couleurs Terre & Enseigne (Cible tactile >= 44x44 px)
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
          background-color: #B84A24;
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #FBF7EF;
          box-shadow: 0 3px 6px rgba(35,26,21,0.3);
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: #FBF7EF;
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
          background-color: #1D528F;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid #FBF7EF;
          box-shadow: 0 2px 5px rgba(35,26,21,0.3);
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
    const timer = setTimeout(syncView, 150);

    const container = map.getContainer();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => {
        syncView();
      });
      observer.observe(container);
    }

    return () => {
      clearTimeout(timer);
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

  const offlineTileFallback = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23FBF7EF"/><rect x="4" y="4" width="248" height="248" fill="none" stroke="%23766B5B" stroke-width="2" stroke-dasharray="6,6"/><text x="128" y="115" text-anchor="middle" font-family="Outfit, sans-serif" font-size="11" font-weight="bold" fill="%23231A15">Carte indisponible</text><text x="128" y="135" text-anchor="middle" font-family="Outfit, sans-serif" font-size="10" fill="%235C4D44">hors ligne pour cette zone</text></svg>`;

  return (
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
            color: '#1D528F',
            fillColor: '#1D528F',
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
            color: '#1D528F',
            weight: 5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* Marqueur de départ */}
      {startPosition && (
        <Marker position={startPosition} icon={createStartMarkerIcon()}>
          <Popup className="custom-leaflet-popup">
            <div className="p-1 text-center font-sans text-xs font-semibold text-[#1D528F]">
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
              <span className="font-mono font-bold text-[#1D528F] text-xs block">{code}</span>
              <p className="text-[11px] text-[#231A15] leading-snug">{description}</p>
            </div>
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
};

export default LeafletMapInner;
