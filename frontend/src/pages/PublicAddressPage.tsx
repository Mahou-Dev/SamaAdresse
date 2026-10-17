import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicAddress, createPublicReport, getRoute } from '../api/addressApi';
import type { PublicAddressResponse, ReportReason, RouteResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { AddressPlate } from '../components/AddressPlate';
import { AddressMap } from '../components/AddressMap';
import { ShareAddress } from '../components/ShareAddress';
import { getQuartierName, getZoneName } from '../utils/geoGrid';
import {
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Navigation,
  Share2,
  Image as ImageIcon,
  ExternalLink,
  Flag,
  X,
  CheckCircle2,
  WifiOff,
  Car,
  Footprints,
  ChevronDown,
} from 'lucide-react';
import { useOnlineStatus } from '../context/OnlineStatusContext';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'POSITION_INCORRECTE', label: 'Position GPS incorrecte' },
  { value: 'CONTENU_INAPPROPRIE', label: 'Description inappropriée ou trompeuse' },
  { value: 'PHOTO_INAPPROPRIEE', label: 'Photo inappropriée ou sans rapport' },
  { value: 'AUTRE', label: 'Autre motif' },
];

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} h ${remainingMinutes > 0 ? remainingMinutes + ' min' : ''}`.trim();
}

export const PublicAddressPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { isOnline } = useOnlineStatus();
  const [address, setAddress] = useState<PublicAddressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<boolean>(false);
  const [photoLoaded, setPhotoLoaded] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [loadingGps, setLoadingGps] = useState<boolean>(false);

  // État itinéraire OpenRouteService
  const [routeLoading, setRouteLoading] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [routeProfile, setRouteProfile] = useState<'driving-car' | 'foot-walking'>('driving-car');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [stepsOpen, setStepsOpen] = useState<boolean>(false);

  // État modale de signalement
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<ReportReason>('POSITION_INCORRECTE');
  const [reportComment, setReportComment] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const reportModalRef = useRef<HTMLDivElement>(null);

  const handleCalculateRoute = async (profileToUse = routeProfile) => {
    if (!address) return;
    if (!isOnline) {
      setRouteError("L'itinéraire n'est pas disponible hors ligne.");
      return;
    }

    setRouteLoading(true);
    setRouteError(null);

    const fetchRouteForCoords = async (fromLat: number, fromLon: number) => {
      try {
        const data = await getRoute({
          fromLat,
          fromLon,
          code: address.code,
          profile: profileToUse,
        });
        setRouteData(data);
        setRouteError(null);
      } catch (err: any) {
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
        setRouteLoading(false);
      }
    };

    if (userCoords) {
      await fetchRouteForCoords(userCoords.lat, userCoords.lon);
    } else {
      if (!navigator.geolocation) {
        setRouteError("La géolocalisation n'est pas supportée par votre navigateur.");
        setRouteLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserCoords(coords);
          fetchRouteForCoords(coords.lat, coords.lon);
        },
        (err) => {
          setRouteLoading(false);
          if (err.code === 1) {
            setRouteError("Autorisation de géolocalisation refusée.");
          } else {
            setRouteError("Position GPS indisponible.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleProfileSwitch = (newProfile: 'driving-car' | 'foot-walking') => {
    setRouteProfile(newProfile);
    if (userCoords) {
      handleCalculateRoute(newProfile);
    }
  };

  useEffect(() => {
    if (!code) {
      setErrorMsg("Aucun code d'adresse fourni.");
      setLoading(false);
      return;
    }

    const fetchAddress = async () => {
      setLoading(true);
      setErrorMsg(null);
      setErrorStatus(null);
      setPhotoError(false);
      setPhotoLoaded(false);
      try {
        const data = await getPublicAddress(code);
        setAddress(data);
      } catch (err: any) {
        if (err instanceof ApiError) {
          setErrorStatus(err.status);
          setErrorMsg(err.message);
        } else {
          setErrorMsg(err.message || "Impossible de charger cette adresse.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [code]);

  // Focus trap et fermeture sur Échap pour la modale de signalement
  useEffect(() => {
    if (!reportOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReportOpen(false);
        return;
      }
      if (e.key === 'Tab' && reportModalRef.current) {
        const focusable = reportModalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const firstInput = reportModalRef.current?.querySelector<HTMLElement>('input, button');
    firstInput?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [reportOpen]);

  const handleOpenReport = () => {
    setReportReason('POSITION_INCORRECTE');
    setReportComment('');
    setReportError(null);
    setReportSuccess(false);
    setReportOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    if (reportComment.length > 300) {
      setReportError('Le commentaire ne doit pas dépasser 300 caractères.');
      return;
    }

    setReportSubmitting(true);
    setReportError(null);
    try {
      await createPublicReport(code, {
        reason: reportReason,
        comment: reportComment.trim() || undefined,
      });
      setReportSuccess(true);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        setReportError('Trop de signalements, réessayez plus tard');
      } else if (err instanceof ApiError) {
        setReportError(err.message);
      } else {
        setReportError("Impossible d'envoyer le signalement.");
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  // Calcul d'itinéraire GPS vers l'adresse
  const handleOpenDirections = () => {
    if (!address) return;
    const destLat = address.latitude;
    const destLng = address.longitude;

    if (navigator.geolocation) {
      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoadingGps(false);
          const originLat = position.coords.latitude;
          const originLon = position.coords.longitude;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLng}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        () => {
          setLoadingGps(false);
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        },
        { timeout: 5000 }
      );
    } else {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const zoneDisplayName = address ? getZoneName(address.zone) : '';
  const quartierDisplayName = address ? getQuartierName(address.quartier, address.zone) : '';

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 font-sans pb-32 md:pb-8">
      {/* Lien retour sobre */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C4D44] hover:text-[#1D528F] transition py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>

      {loading ? (
        /* Squelette dimensionné pour CLS < 0.1 */
        <div className="space-y-6" aria-label="Chargement de la fiche publique">
          <div className="w-full h-40 sm:h-48 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] animate-pulse" />
          <div className="flex justify-center gap-3">
            <div className="h-11 w-56 rounded-lg bg-[#E6DDD0] animate-pulse" />
            <div className="h-11 w-32 rounded-lg bg-[#E6DDD0] animate-pulse" />
          </div>
          <div className="w-full aspect-video max-h-64 sm:max-h-80 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] animate-pulse" />
          <div className="w-full h-24 rounded-xl bg-[#FFFFFF] border border-[#D4CEBF] animate-pulse" />
          <div className="w-full h-64 sm:h-80 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] animate-pulse" />
        </div>
      ) : errorStatus === 410 ? (
        /* Fiche publique archivée ou suspendue (410 Gone) : aucune plaque ni donnée */
        <div className="p-8 sm:p-10 text-center rounded-xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] text-[#5C4D44] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-bold text-[#231A15]">
              Cette adresse n'est plus disponible.
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4D44] max-w-md mx-auto">
              La fiche demandée a été retirée ou n'est plus active.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white font-bold text-xs sm:text-sm transition shadow-[0_2px_0_rgba(35,26,21,0.12)] touch-target"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      ) : (!isOnline && !address) ? (
        /* Repli sobre : fiche non consultée auparavant hors ligne */
        <div className="p-8 sm:p-10 text-center rounded-xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-5 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] text-[#8A3112] flex items-center justify-center mx-auto">
            <WifiOff className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-bold text-[#231A15]">
              Cette page n'est pas disponible hors ligne
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
              Cette adresse n'a pas encore été consultée sur cet appareil ou n'est pas conservée en mémoire.
            </p>
          </div>

          {/* Fiches déjà enregistrées si existantes */}
          {(() => {
            try {
              const visited: string[] = JSON.parse(localStorage.getItem('visited_address_codes') || '[]');
              if (visited.length === 0) return null;
              return (
                <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#D4CEBF] text-left space-y-2">
                  <span className="text-xs font-semibold text-[#5C4D44] block">
                    Fiches déjà enregistrées hors ligne
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {visited.map((vCode) => (
                      <Link
                        key={vCode}
                        to={`/a/${vCode}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#8C8272] text-[#1D528F] font-mono text-xs font-bold hover:underline"
                      >
                        <span>{vCode}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            } catch {
              return null;
            }
          })()}

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white font-bold text-xs sm:text-sm transition shadow-[0_2px_0_rgba(35,26,21,0.12)] touch-target"
            >
              <span>Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      ) : errorMsg ? (
        <div className="p-8 text-center rounded-xl bg-[#FFFFFF] border border-[#8C8272]/30 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#231A15]">Adresse non trouvée</h1>
            <p className="text-xs text-[#5C4D44]">{errorMsg}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D528F] text-white font-bold text-xs hover:bg-[#153C6B] transition touch-target"
          >
            Retourner à l'accueil
          </Link>
        </div>
      ) : address && (
        <article className="space-y-6">
          {/* Mention de version hors ligne enregistrée */}
          {!isOnline && (
            <div className="p-3 rounded-lg bg-[#F2ECE1] border border-[#D4CEBF] text-[#5C4D44] text-xs font-medium shadow-[0_1px_0_rgba(35,26,21,0.04)]">
              <span>
                Version enregistrée le {code ? localStorage.getItem(`cached_date_${code}`) || new Date().toLocaleDateString('fr-FR') : ''}
              </span>
            </div>
          )}

          {/* 1. PLAQUE HERO EN TÊTE */}
          <div className="w-full flex flex-col items-center">
            <AddressPlate
              code={address.code}
              zone={address.zone}
              type={address.locationType}
              size="lg"
              showCopy={true}
              className="w-full"
            />

            {/* Actions principales sous la plaque (mobile et desktop) : Bouton plein ocre */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full mt-4">
              <button
                type="button"
                onClick={handleOpenDirections}
                disabled={loadingGps}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs sm:text-sm font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer touch-target disabled:opacity-50"
              >
                {loadingGps ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>Itinéraire depuis ma position</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                onClick={() => setShareOpen(!shareOpen)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer touch-target"
                aria-expanded={shareOpen}
              >
                <Share2 className="w-4 h-4 text-[#1D528F]" />
                <span>{shareOpen ? 'Masquer le partage' : 'Partager'}</span>
              </button>
            </div>
          </div>

          {/* Module de partage dépliable */}
          {shareOpen && (
            <div className="p-4 rounded-xl border border-[#8C8272]/40 bg-[#FFFFFF] shadow-sm">
              <ShareAddress code={address.code} />
            </div>
          )}

          {/* 2. PHOTO DE FAÇADE OU ÉTAT VIDE HONNÊTE (Espace réservé aspect-video h-64 sm:h-80 pour CLS < 0.1) */}
          {address.photoUrl && !photoError ? (
            <div className="relative rounded-xl overflow-hidden border border-[#8C8272]/40 shadow-[0_2px_0_rgba(35,26,21,0.06)] h-64 sm:h-80 w-full aspect-video bg-[#F2ECE1]">
              {!photoLoaded && (
                <div className="absolute inset-0 bg-[#F2ECE1] animate-pulse flex items-center justify-center text-xs text-[#5C4D44]">
                  Chargement de la photo...
                </div>
              )}
              <img
                src={
                  address.photoUrl.startsWith('http')
                    ? address.photoUrl
                    : `${import.meta.env.VITE_API_BASE_URL || ''}${address.photoUrl}`
                }
                alt={`Photo de façade ${address.code}`}
                width={800}
                height={450}
                fetchPriority="high"
                decoding="async"
                className="w-full h-64 sm:h-80 object-cover"
                onLoad={() => setPhotoLoaded(true)}
                onError={() => setPhotoError(true)}
              />
            </div>
          ) : (
            /* État vide honnête sans illustration trompeuse */
            <div className="p-5 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] text-center text-xs text-[#5C4D44] flex items-center justify-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#8C8272] shrink-0" />
              <span className="font-medium">Pas de photo pour ce lieu</span>
            </div>
          )}

          {/* 3. REPÈRE VISUEL & DESCRIPTION */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#8C8272]/30 shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-1.5">
            <span className="text-xs font-bold text-[#5C4D44] block">
              Repère visuel :
            </span>
            <p className="text-sm text-[#231A15] font-medium leading-relaxed">
              {address.description}
            </p>
            {quartierDisplayName && (
              <p className="text-xs text-[#5C4D44] pt-1 border-t border-[#E6DDD0] font-medium">
                Quartier : <span className="text-[#231A15] font-semibold">{quartierDisplayName}</span> ({zoneDisplayName})
              </p>
            )}
          </div>

          {/* 4. CARTE INTERACTIVE ET COORDONNÉES */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#231A15] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1D528F]" />
              <span>Localisation sur la carte</span>
            </h2>
            <AddressMap
              latitude={address.latitude}
              longitude={address.longitude}
              code={address.code}
              description={address.description}
              showDirections={false}
              routeGeometry={
                routeData
                  ? (routeData.geometry.coordinates.map(([lon, lat]) => [lat, lon]) as [number, number][])
                  : undefined
              }
              startPosition={
                userCoords ? [userCoords.lat, userCoords.lon] : undefined
              }
            />

            {/* Bloc Itinéraire OpenRouteService */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#8C8272]/40 shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#1D528F]" />
                  <span className="text-xs font-bold text-[#231A15]">Itinéraire vers ce lieu</span>
                </div>

                {/* Bascule Voiture / À pied */}
                <div className="inline-flex rounded-lg border border-[#8C8272]/40 p-0.5 bg-[#FBF9F5] text-xs">
                  <button
                    type="button"
                    onClick={() => handleProfileSwitch('driving-car')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      routeProfile === 'driving-car'
                        ? 'bg-[#1D528F] text-white shadow-xs'
                        : 'text-[#5C4D44] hover:text-[#231A15]'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Voiture</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProfileSwitch('foot-walking')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      routeProfile === 'foot-walking'
                        ? 'bg-[#1D528F] text-white shadow-xs'
                        : 'text-[#5C4D44] hover:text-[#231A15]'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>À pied</span>
                  </button>
                </div>
              </div>

              {/* Bouton d'action principal Itinéraire */}
              {!routeData && (
                <div>
                  <button
                    type="button"
                    onClick={() => handleCalculateRoute(routeProfile)}
                    disabled={routeLoading || !isOnline}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D528F] hover:bg-[#153e6d] text-white text-xs font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer disabled:opacity-50 touch-target"
                  >
                    {routeLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Calcul de l'itinéraire en cours...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4 text-white" />
                        <span>Itinéraire depuis ma position</span>
                      </>
                    )}
                  </button>
                  {!isOnline && (
                    <p className="text-[11px] text-[#8A3112] font-medium mt-1.5">
                      Itinéraire indisponible hors ligne.
                    </p>
                  )}
                </div>
              )}

              {/* Erreur itinéraire */}
              {routeError && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                    <span>{routeError}</span>
                  </div>
                </div>
              )}

              {/* Résumé de l'itinéraire calculé */}
              {routeData && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F2ECE1] border border-[#D4CEBF]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1D528F]">
                        {formatDuration(routeData.duration)}
                      </span>
                      <span className="text-xs text-[#5C4D44] font-mono">
                        ({formatDistance(routeData.distance)})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStepsOpen(!stepsOpen)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1D528F] hover:underline cursor-pointer"
                    >
                      <span>{stepsOpen ? 'Masquer les étapes' : `Voir les ${routeData.steps.length} étapes`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stepsOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Étapes détaillées */}
                  {stepsOpen && (
                    <ol className="p-3 bg-[#FBF9F5] rounded-xl border border-[#D4CEBF] divide-y divide-[#E6DDD0] text-xs space-y-1 list-decimal list-inside">
                      {routeData.steps.map((st, idx) => (
                        <li key={idx} className="py-1.5 flex items-start justify-between gap-2">
                          <span className="text-[#231A15] leading-snug">{st.instruction}</span>
                          <span className="text-[#5C4D44] font-mono text-[11px] shrink-0">
                            {formatDistance(st.distance)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {/* Repli externe et mention de confidentialité */}
              <div className="pt-2 border-t border-[#E6DDD0] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5C4D44]">
                <span className="italic">Votre position n'est pas enregistrée.</span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#1D528F] hover:underline"
                >
                  <span>Ouvrir dans Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Métadonnées discrètes et lien Signaler un problème sous la carte */}
          <div className="pt-3 border-t border-[#E6DDD0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C4D44]">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Créée le {new Date(address.createdAt).toLocaleDateString('fr-FR')}</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans font-medium text-[#1D528F]">{zoneDisplayName}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenReport}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C4D44] hover:text-[#991B1B] underline underline-offset-2 transition cursor-pointer py-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Signaler un problème</span>
            </button>
          </div>
        </article>
      )}

      {/* Modale / Bottom-sheet de signalement */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#231A15]/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReportOpen(false);
          }}
        >
          <div
            ref={reportModalRef}
            className="w-full max-w-[calc(100vw-32px)] sm:max-w-md rounded-t-2xl sm:rounded-xl bg-[#FBF9F5] border-t sm:border border-[#8C8272] shadow-lg p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto mx-auto"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E6DDD0] pb-3">
              <h2 id="report-modal-title" className="text-base font-bold text-[#231A15]">
                Signaler un problème
              </h2>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="p-1.5 rounded-lg text-[#5C4D44] hover:bg-[#F2ECE1] transition cursor-pointer"
                aria-label="Fermer la fenêtre de signalement"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-[#2A6B44]/10 border border-[#2A6B44]/30 text-[#2A6B44] flex items-start gap-2.5 text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>Merci, votre signalement a été transmis.</span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#231A15] text-white text-xs font-bold cursor-pointer touch-target"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-xs font-bold text-[#231A15] mb-1.5">
                    Motif du signalement
                  </legend>
                  {REPORT_REASONS.map((item) => (
                    <label
                      key={item.value}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                        reportReason === item.value
                          ? 'border-[#B84A24] bg-[#F2ECE1] text-[#231A15] font-semibold'
                          : 'border-[#D4CEBF] bg-[#FFFFFF] text-[#231A15] hover:bg-[#F2ECE1]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={item.value}
                        checked={reportReason === item.value}
                        onChange={() => setReportReason(item.value)}
                        className="accent-[#B84A24]"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </fieldset>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="report-comment" className="font-bold text-[#231A15]">
                      Précisions (optionnel)
                    </label>
                    <span className="font-mono text-[11px] text-[#5C4D44]">
                      {reportComment.length}/300
                    </span>
                  </div>
                  <textarea
                    id="report-comment"
                    rows={3}
                    maxLength={300}
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Indiquez brièvement le problème constaté..."
                    className="w-full px-3 py-2 rounded-lg border border-[#8C8272] bg-[#FFFFFF] text-xs text-[#231A15] placeholder:text-[#5C4D44] focus:outline-none focus:ring-2 focus:ring-[#1D528F]"
                  />
                </div>

                {reportError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reportError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6DDD0]">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition cursor-pointer touch-target"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer disabled:opacity-50 touch-target"
                  >
                    {reportSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Envoyer le signalement</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
