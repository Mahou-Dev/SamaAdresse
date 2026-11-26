import { useState, useEffect, useMemo } from 'react';
import { getPublicAddress } from '../../api/addressApi';
import type { DirectoryItemResponse } from '../../api/addressApi';
import { ApiError } from '../../api/apiClient';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import type { MappedDirectoryItem, ResolvedCoordinates } from './types';

const MAX_CONCURRENCY = 4;

// Cache mémoire léger partagé entre les bascules de vue (Grille / Liste / Carte)
const coordinatesMemoryCache = new Map<string, ResolvedCoordinates>();

export function clearDirectoryCoordinatesCache(): void {
  coordinatesMemoryCache.clear();
}

function isValidCoordinate(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function readLocalStorageCoordinates(code: string): ResolvedCoordinates | null {
  try {
    const raw = localStorage.getItem(`cached_addr_${code}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { latitude?: unknown; longitude?: unknown };
    if (isValidCoordinate(parsed.latitude, parsed.longitude)) {
      return {
        latitude: parsed.latitude as number,
        longitude: parsed.longitude as number,
      };
    }
  } catch {
    // Ignorer un JSON corrompu ou un accès localStorage bloqué
  }
  return null;
}

export interface DirectoryCoordinatesState {
  mappedItems: MappedDirectoryItem[];
  unmappedItems: DirectoryItemResponse[];
  isLoadingCoords: boolean;
  resolvedCount: number;
  totalCount: number;
  rateLimitedCoords: boolean;
}

/**
 * Hydrate à la demande les coordonnées GPS réelles des résultats de l'annuaire
 * uniquement lorsque la vue Carte est active, via cache mémoire -> localStorage
 * -> GET /api/addresses/{code} (concurrence bornée, aucune coordonnée fictive).
 */
export function useDirectoryCoordinates(
  items: DirectoryItemResponse[],
  enabled: boolean
): DirectoryCoordinatesState {
  const { isOnline } = useOnlineStatus();
  const [revision, setRevision] = useState(0);
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [rateLimitedCoords, setRateLimitedCoords] = useState(false);

  const itemCodesKey = useMemo(() => items.map((item) => item.code).join('|'), [items]);

  useEffect(() => {
    if (!enabled || items.length === 0) {
      return;
    }

    let cancelled = false;
    let cacheUpdatedFromStorage = false;

    const missingCodes: string[] = [];
    for (const item of items) {
      if (coordinatesMemoryCache.has(item.code)) {
        continue;
      }
      const cached = readLocalStorageCoordinates(item.code);
      if (cached) {
        coordinatesMemoryCache.set(item.code, cached);
        cacheUpdatedFromStorage = true;
      } else {
        missingCodes.push(item.code);
      }
    }

    const hydrate = async () => {
      if (cacheUpdatedFromStorage && !cancelled) {
        setRevision((r) => r + 1);
      }

      if (missingCodes.length === 0 || !isOnline) {
        if (!cancelled) {
          setIsLoadingCoords(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoadingCoords(true);
        setRateLimitedCoords(false);
      }

      let cursor = 0;
      let hitRateLimit = false;

      const worker = async () => {
        while (!cancelled && !hitRateLimit) {
          const idx = cursor++;
          if (idx >= missingCodes.length) break;
          const code = missingCodes[idx];
          try {
            const detail = await getPublicAddress(code);
            if (cancelled) return;
            if (isValidCoordinate(detail.latitude, detail.longitude)) {
              coordinatesMemoryCache.set(code, {
                latitude: detail.latitude,
                longitude: detail.longitude,
              });
              setRevision((r) => r + 1);
            }
          } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 429) {
              hitRateLimit = true;
              if (!cancelled) {
                setRateLimitedCoords(true);
              }
              return;
            }
            // Les autres échecs (404/410/réseau) laissent simplement l'adresse dans unmappedItems
          }
        }
      };

      const workerCount = Math.min(MAX_CONCURRENCY, missingCodes.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      if (!cancelled) {
        setIsLoadingCoords(false);
      }
    };

    const timer = window.setTimeout(() => {
      void hydrate();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, itemCodesKey, items, isOnline]);

  const { mappedItems, unmappedItems } = useMemo(() => {
    // `revision` est lu pour recalculer à chaque lot de coordonnées hydratées
    void revision;
    const mapped: MappedDirectoryItem[] = [];
    const unmapped: DirectoryItemResponse[] = [];

    for (const item of items) {
      const coords =
        coordinatesMemoryCache.get(item.code) ?? readLocalStorageCoordinates(item.code);
      if (coords) {
        mapped.push({
          item,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      } else {
        unmapped.push(item);
      }
    }

    return { mappedItems: mapped, unmappedItems: unmapped };
  }, [items, revision]);

  return {
    mappedItems,
    unmappedItems,
    isLoadingCoords: enabled && isOnline ? isLoadingCoords : false,
    resolvedCount: mappedItems.length,
    totalCount: items.length,
    rateLimitedCoords: enabled ? rateLimitedCoords : false,
  };
}
