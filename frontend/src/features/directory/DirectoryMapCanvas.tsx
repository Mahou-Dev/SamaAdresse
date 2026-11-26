import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle } from 'lucide-react';
import type { MappedDirectoryItem } from './types';

// Centre par défaut sur Ziguinchor si aucun point n'est encore résolu
const DEFAULT_CENTER: [number, number] = [12.5681, -16.2719];
const DEFAULT_ZOOM = 13;

function createDirectoryPinIcon(isSelected: boolean, code: string) {
  const fill = isSelected ? '#C2410C' : '#0369A1';
  const ring = isSelected ? '0 0 0 5px rgba(194, 65, 12, 0.22), 0 6px 14px rgba(15, 23, 42, 0.28)' : '0 3px 8px rgba(15, 23, 42, 0.24)';
  const scale = isSelected ? 'scale(1.12)' : 'scale(1)';

  return L.divIcon({
    className: 'sa-directory-pin touch-manipulation',
    html: `
      <div
        role="button"
        aria-label="Adresse ${code}"
        title="${code}"
        style="
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: ${scale};
          transition: transform 150ms ease;
        "
      >
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background-color: ${fill};
          border: 3px solid #FFFFFF;
          box-shadow: ${ring};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #FFFFFF;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 42],
  });
}

interface DirectoryMapControllerProps {
  items: MappedDirectoryItem[];
  selectedCode: string | null;
  onBackgroundClick: () => void;
}

const DirectoryMapController: React.FC<DirectoryMapControllerProps> = ({
  items,
  selectedCode,
  onBackgroundClick,
}) => {
  const map = useMap();
  const selectedCodeRef = useRef<string | null>(selectedCode);
  const boundsKey = useMemo(
    () => items.map((m) => `${m.item.code}:${m.latitude.toFixed(4)},${m.longitude.toFixed(4)}`).join('|'),
    [items]
  );

  // Synchroniser les dimensions et ajuster les bornes sur les résultats réels
  useEffect(() => {
    const syncBounds = () => {
      map.invalidateSize({ animate: false });
      if (selectedCodeRef.current) return;
      if (items.length === 1) {
        map.setView([items[0].latitude, items[0].longitude], 15, { animate: false });
      } else if (items.length > 1) {
        const bounds = L.latLngBounds(items.map((m) => [m.latitude, m.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: false });
      }
    };

    syncBounds();
    const timer = window.setTimeout(syncBounds, 150);

    const container = map.getContainer();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => {
        map.invalidateSize({ animate: false });
      });
      observer.observe(container);
    }

    return () => {
      window.clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [boundsKey, items, map]);

  // Centrer et zoomer modérément sur le repère sélectionné (sépare aussi les repères proches)
  useEffect(() => {
    selectedCodeRef.current = selectedCode;
    if (!selectedCode) return;
    const selected = items.find((m) => m.item.code === selectedCode);
    if (!selected) return;
    const targetZoom = Math.max(map.getZoom(), 14);
    map.setView([selected.latitude, selected.longitude], targetZoom, { animate: false });
  }, [selectedCode, items, map]);

  useMapEvents({
    click() {
      onBackgroundClick();
    },
  });

  return null;
};

export interface DirectoryMapCanvasProps {
  items: MappedDirectoryItem[];
  selectedCode: string | null;
  onSelectCode: (code: string | null) => void;
}

const DirectoryMapCanvas: React.FC<DirectoryMapCanvasProps> = ({
  items,
  selectedCode,
  onSelectCode,
}) => {
  const [hasTileError, setHasTileError] = useState(false);

  const tileUrl =
    import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution =
    import.meta.env.VITE_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const errorTileSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23F8FAFC"/><rect x="4" y="4" width="248" height="248" fill="none" stroke="%23CBD5E1" stroke-width="1.5" stroke-dasharray="6,6"/><text x="128" y="124" text-anchor="middle" font-family="Outfit, sans-serif" font-size="11" fill="%235B6B7F">Tuile indisponible</text></svg>`;

  const initialCenter: [number, number] =
    items.length > 0 ? [items[0].latitude, items[0].longitude] : DEFAULT_CENTER;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          url={tileUrl}
          attribution={tileAttribution}
          maxZoom={19}
          detectRetina={true}
          crossOrigin="anonymous"
          errorTileUrl={errorTileSvg}
          eventHandlers={{
            tileerror: () => {
              setHasTileError(true);
            },
          }}
        />

        <DirectoryMapController
          items={items}
          selectedCode={selectedCode}
          onBackgroundClick={() => onSelectCode(null)}
        />

        {items.map((entry) => {
          const isSelected = selectedCode === entry.item.code;
          return (
            <Marker
              key={entry.item.code}
              position={[entry.latitude, entry.longitude]}
              icon={createDirectoryPinIcon(isSelected, entry.item.code)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: (e) => {
                  if (e.originalEvent) {
                    L.DomEvent.stopPropagation(e.originalEvent);
                  }
                  onSelectCode(entry.item.code);
                },
              }}
            />
          );
        })}
      </MapContainer>

      {hasTileError && (
        <div
          role="status"
          className="absolute top-3 left-3 right-3 z-[400] max-w-md rounded-xl bg-warning-soft/95 backdrop-blur-xs border border-warning-border px-3.5 py-2 text-xs font-medium text-warning flex items-center gap-2 shadow-sm pointer-events-none"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Certaines tuiles de carte n'ont pas pu être chargées. Les repères restent interactifs.</span>
        </div>
      )}
    </div>
  );
};

export default DirectoryMapCanvas;
