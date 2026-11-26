import { useState, useCallback, useRef } from 'react';
import { getRoute } from '../../../api/addressApi';
import type { PublicAddressResponse, RouteResponse } from '../../../api/addressApi';
import { ApiError } from '../../../api/apiClient';
import { hasValidCoordinates } from '../utils';

export type RouteProfile = 'driving-car' | 'foot-walking';

export function useAddressRoute(address: PublicAddressResponse | null, isOnline: boolean) {
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('driving-car');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const requestSeqRef = useRef(0);

  // Réinitialiser l'itinéraire lorsqu'on change de fiche adresse
  const currentCode = address?.code ?? null;
  const [trackedCode, setTrackedCode] = useState<string | null>(currentCode);
  if (currentCode !== trackedCode) {
    setTrackedCode(currentCode);
    setRouteData(null);
    setRouteError(null);
    setStepsOpen(false);
    setRouteLoading(false);
  }

  const fetchRouteForCoords = useCallback(
    async (
      targetCode: string,
      fromLat: number,
      fromLon: number,
      profileToUse: RouteProfile
    ) => {
      const seq = ++requestSeqRef.current;
      try {
        const data = await getRoute({
          fromLat,
          fromLon,
          code: targetCode,
          profile: profileToUse,
        });
        if (seq !== requestSeqRef.current) return;
        setRouteData(data);
        setRouteError(null);
      } catch (err: unknown) {
        if (seq !== requestSeqRef.current) return;
        if (err instanceof ApiError) {
          if (err.status === 422) {
            setRouteError("Aucun itinéraire routier trouvé jusqu'à cette adresse.");
          } else if (err.status === 400) {
            setRouteError("L'itinéraire est disponible uniquement au Sénégal.");
          } else if (err.status === 429) {
            setRouteError("Trop de demandes d'itinéraire. Réessayez dans un instant.");
          } else if (err.status === 503) {
            setRouteError("Service d'itinéraire momentanément indisponible.");
          } else {
            setRouteError(err.message || "Impossible de calculer l'itinéraire.");
          }
        } else {
          setRouteError("Erreur réseau lors du calcul de l'itinéraire.");
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setRouteLoading(false);
        }
      }
    },
    []
  );

  const calculateRoute = useCallback(
    async (profileOverride?: RouteProfile) => {
      const profileToUse = profileOverride ?? routeProfile;
      if (!address) return;

      if (!hasValidCoordinates(address.latitude, address.longitude)) {
        setRouteError("Les coordonnées de cette adresse sont indisponibles pour le calcul d'itinéraire.");
        return;
      }

      if (!isOnline) {
        setRouteError("L'itinéraire n'est pas disponible hors ligne.");
        return;
      }

      setRouteLoading(true);
      setRouteError(null);

      if (userCoords) {
        await fetchRouteForCoords(address.code, userCoords.lat, userCoords.lon, profileToUse);
        return;
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setRouteError("La géolocalisation n'est pas supportée par votre navigateur.");
        setRouteLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserCoords(coords);
          void fetchRouteForCoords(address.code, coords.lat, coords.lon, profileToUse);
        },
        (err) => {
          setRouteLoading(false);
          if (err.code === 1) {
            setRouteError('Autorisation de géolocalisation refusée.');
          } else if (err.code === 3) {
            setRouteError('Délai dépassé lors de la détection de votre position GPS.');
          } else {
            setRouteError('Position GPS indisponible.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    },
    [address, isOnline, routeProfile, userCoords, fetchRouteForCoords]
  );

  const switchProfile = useCallback(
    (newProfile: RouteProfile) => {
      setRouteProfile(newProfile);
      if (userCoords && isOnline) {
        void calculateRoute(newProfile);
      }
    },
    [userCoords, isOnline, calculateRoute]
  );

  const resetRoute = useCallback(() => {
    requestSeqRef.current += 1;
    setRouteData(null);
    setRouteError(null);
    setStepsOpen(false);
    setRouteLoading(false);
  }, []);

  return {
    routeLoading,
    routeData,
    routeProfile,
    routeError,
    userCoords,
    stepsOpen,
    setStepsOpen,
    calculateRoute,
    switchProfile,
    resetRoute,
  };
}
