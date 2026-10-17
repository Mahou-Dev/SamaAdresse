import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  WifiOff,
  X,
} from 'lucide-react';
import { searchDirectory } from '../api/addressApi';
import type { DirectoryItemResponse, LocationType } from '../api/addressApi';
import { ApiError } from '../api/apiClient';

const QUARTIERS = [
  { value: '', label: 'Tous les quartiers' },
  { value: 'KBG', label: 'Boucotte (KBG)' },
  { value: 'ESC', label: 'Escale (ESC)' },
  { value: 'TIL', label: 'Tilène (TIL)' },
  { value: 'KND', label: 'Kandé (KND)' },
  { value: 'NEM', label: 'Néma (NEM)' },
];

const TYPES: { value: '' | LocationType; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'MAISON', label: 'Maison' },
  { value: 'COMMERCE', label: 'Commerce' },
  { value: 'INSTITUTION', label: 'Institution' },
];

export const DirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') || '';
  const urlQuartier = searchParams.get('quartier') || '';
  const urlType = (searchParams.get('type') || '') as '' | LocationType;

  const [inputQ, setInputQ] = useState(urlQ);
  const [selectedQuartier, setSelectedQuartier] = useState(urlQuartier);
  const [selectedType, setSelectedType] = useState<'' | LocationType>(urlType);

  const [items, setItems] = useState<DirectoryItemResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quartierRef = useRef(selectedQuartier);
  const typeRef = useRef(selectedType);
  quartierRef.current = selectedQuartier;
  typeRef.current = selectedType;

  // Écouteur en ligne / hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Décompte compte à rebours 429
  useEffect(() => {
    if (retryAfterSeconds > 0) {
      countdownTimerRef.current = setInterval(() => {
        setRetryAfterSeconds((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [retryAfterSeconds]);

  // Synchronisation des paramètres d'URL
  const updateUrlParams = useCallback(
    (q: string, quartier: string, type: string) => {
      const nextParams = new URLSearchParams();
      if (q.trim()) nextParams.set('q', q.trim());
      if (quartier) nextParams.set('quartier', quartier);
      if (type) nextParams.set('type', type);
      setSearchParams(nextParams, { replace: true });
    },
    [setSearchParams]
  );

  // Recherche API
  const performSearch = useCallback(
    async (
      qParam: string,
      quartierParam: string,
      typeParam: '' | LocationType,
      pageNumber: number,
      append = false
    ) => {
      if (!navigator.onLine) {
        setIsOffline(true);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setIsRateLimited(false);

      try {
        const response = await searchDirectory({
          q: qParam.trim() || undefined,
          quartier: quartierParam || undefined,
          type: typeParam || undefined,
          page: pageNumber,
          size: 10,
        });

        if (append) {
          setItems((prev) => [...prev, ...response.content]);
        } else {
          setItems(response.content);
        }
        setPage(response.number);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setHasSearched(true);

        const count = response.totalElements;
        const countText =
          count === 0
            ? 'Aucune adresse trouvée'
            : count === 1
            ? '1 adresse trouvée'
            : `${count} adresses trouvées`;
        setLiveAnnouncement(countText);
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 429) {
          setIsRateLimited(true);
          const waitTime = err.data?.retryAfterSeconds || 60;
          setRetryAfterSeconds(waitTime);
          setError('Trop de recherches. Merci de patienter un instant.');
          setLiveAnnouncement('Trop de recherches. Merci de patienter un instant.');
        } else if (!navigator.onLine) {
          setIsOffline(true);
        } else {
          setError('Une erreur est survenue lors de la recherche.');
          setLiveAnnouncement('Erreur lors de la recherche.');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Déclencheur initial et changement de filtres
  useEffect(() => {
    performSearch(urlQ, urlQuartier, urlType, 0, false);
  }, [urlQ, urlQuartier, urlType, performSearch]);

  // Gestion de la saisie avec debounce 300 ms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputQ(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateUrlParams(val, quartierRef.current, typeRef.current);
    }, 300);
  };

  const handleQuartierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const val = e.target.value;
    setSelectedQuartier(val);
    quartierRef.current = val;
    updateUrlParams(inputQ, val, typeRef.current);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const val = e.target.value as '' | LocationType;
    setSelectedType(val);
    typeRef.current = val;
    updateUrlParams(inputQ, quartierRef.current, val);
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setInputQ('');
    updateUrlParams('', quartierRef.current, typeRef.current);
  };

  const handleLoadMore = () => {
    if (page + 1 < totalPages && !loadingMore) {
      performSearch(urlQ, urlQuartier, urlType, page + 1, true);
    }
  };

  // Récupérer les fiches visitées enregistrées en local si hors ligne
  const visitedCodes: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('visited_address_codes') || '[]');
    } catch {
      return [];
    }
  })();

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 min-h-[1100px]">
      {/* En-tête de page */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
          Annuaire public
        </h1>
        <p className="text-xs sm:text-sm text-[#5C4D44]">
          Recherchez les adresses, commerces et concessions ayant choisi de figurer dans l'annuaire.
        </p>
      </div>

      {/* Live region pour lecteurs d'écran */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Barre de recherche et filtres */}
      <section aria-label="Recherche et filtres dans l'annuaire" className="space-y-3 min-h-[172px] sm:min-h-[116px]">
        <div className="relative">
          <label htmlFor="directory-search-input" className="sr-only">
            Rechercher une adresse, un commerce…
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C4D44]">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="directory-search-input"
            type="search"
            value={inputQ}
            onChange={handleInputChange}
            placeholder="Code, quartier ou description…"
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-[#8C8272] bg-[#FFFFFF] text-sm text-[#231A15] placeholder-[#5C4D44] focus:outline-none focus:ring-2 focus:ring-[#1D528F] focus:border-transparent transition shadow-[0_1px_0_rgba(35,26,21,0.06)]"
          />
          {inputQ && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5C4D44] hover:text-[#231A15]"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ligne des filtres déroulants */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="filter-quartier" className="block text-xs font-bold text-[#5C4D44] mb-1">
              Quartier
            </label>
            <div className="relative">
              <select
                id="filter-quartier"
                value={selectedQuartier}
                onChange={handleQuartierChange}
                className="w-full px-3 py-2 rounded-lg border border-[#8C8272] bg-[#FFFFFF] text-xs font-medium text-[#231A15] focus:outline-none focus:ring-2 focus:ring-[#1D528F]"
              >
                {QUARTIERS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="filter-type" className="block text-xs font-bold text-[#5C4D44] mb-1">
              Type de lieu
            </label>
            <div className="relative">
              <select
                id="filter-type"
                value={selectedType}
                onChange={handleTypeChange}
                className="w-full px-3 py-2 rounded-lg border border-[#8C8272] bg-[#FFFFFF] text-xs font-medium text-[#231A15] focus:outline-none focus:ring-2 focus:ring-[#1D528F]"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* État Hors ligne */}
      {isOffline && (
        <div className="p-4 sm:p-5 rounded-xl bg-[#F2ECE1] border border-[#8C8272] text-[#231A15] space-y-3">
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-[#8A3112] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-[#231A15]">
                L'annuaire n'est pas disponible hors ligne.
              </h2>
              <p className="text-xs text-[#5C4D44] mt-0.5">
                Une connexion réseau est nécessaire pour interroger la base publique. Consultez vos fiches enregistrées.
              </p>
            </div>
          </div>

          {visitedCodes.length > 0 && (
            <div className="pt-2 border-t border-[#D4CEBF] space-y-1.5">
              <span className="text-xs font-bold text-[#5C4D44] block">
                Fiches consultables hors ligne :
              </span>
              <div className="flex flex-wrap gap-2">
                {visitedCodes.map((code) => (
                  <Link
                    key={code}
                    to={`/a/${code}`}
                    className="px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#8C8272] font-mono text-xs font-bold text-[#1D528F] hover:bg-[#FBF9F5] transition"
                  >
                    {code}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* État Rate limit 429 */}
      {isRateLimited && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>Trop de recherches. Merci de patienter un instant.</span>
          </div>
          {retryAfterSeconds > 0 && (
            <span className="font-mono font-bold shrink-0">
              {retryAfterSeconds}s
            </span>
          )}
        </div>
      )}

      {/* Erreur standard */}
      {error && !isRateLimited && !isOffline && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Conteneur à hauteur réservée pour le message de statut et la liste (CLS < 0,1) */}
      <div className="space-y-4 min-h-[560px]">
        {/* Squelettes de chargement (hauteur alignée sur les cartes réelles) */}
        {loading && (
          <>
            <div className="min-h-[20px] flex items-center justify-between text-xs text-[#5C4D44] px-1" aria-hidden="true">
              <span>Chargement de l'annuaire…</span>
            </div>
            <div className="space-y-3" aria-hidden="true">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[188px] sm:h-[132px] rounded-xl bg-[#FFFFFF] border border-[#8C8272]/30 p-4 flex gap-4 animate-pulse"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-[#F2ECE1] shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-[#F2ECE1] rounded w-1/3" />
                    <div className="h-3 bg-[#F2ECE1] rounded w-3/4" />
                    <div className="h-3 bg-[#F2ECE1] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Résultats de recherche */}
        {!loading && !isOffline && (
          <div className="space-y-4">
            {/* Compteur de résultats sobre (hauteur réservée) */}
            <div className="min-h-[20px] flex items-center justify-between text-xs text-[#5C4D44] px-1">
              {hasSearched && (
                <>
                  <span>
                    {totalElements === 0
                      ? 'Aucun résultat'
                      : totalElements === 1
                      ? '1 adresse trouvée'
                      : `${totalElements} adresses trouvées`}
                  </span>
                  {(urlQ || urlQuartier || urlType) && (
                    <span className="text-[11px] text-[#5C4D44]">
                      Filtres actifs
                    </span>
                  )}
                </>
              )}
            </div>

            {/* État vide */}
            {hasSearched && items.length === 0 && !error && (
              <div className="p-8 sm:p-12 text-center rounded-xl bg-[#FFFFFF] border border-[#8C8272]/40 shadow-[0_1px_0_rgba(35,26,21,0.06)] space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] flex items-center justify-center text-[#8A3112] mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#231A15]">
                    Aucune adresse ne correspond à votre recherche.
                  </h2>
                  <p className="text-xs text-[#5C4D44] max-w-sm mx-auto">
                    Essayez avec un mot-clé plus court, ou retirez les filtres par quartier ou type de lieu.
                  </p>
                </div>
              </div>
            )}

            {/* Liste des cartes d'adresses compactes */}
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.code}
                  className="p-4 rounded-xl border border-[#8C8272]/40 bg-[#FFFFFF] shadow-[0_1px_2px_rgba(35,26,21,0.05)] hover:border-[#1D528F] transition flex flex-col sm:flex-row gap-4 items-start justify-between"
                >
                  <div className="flex gap-3 sm:gap-4 items-start w-full">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={`Façade pour l'adresse ${item.code}`}
                        width={80}
                        height={80}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-[#E6DDD0] shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-[#F2ECE1] border border-[#E6DDD0] flex flex-col items-center justify-center text-[#5C4D44] shrink-0">
                        <MapPin className="w-6 h-6 text-[#1D528F]" />
                        <span className="text-[10px] font-medium mt-1">Sans photo</span>
                      </div>
                    )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-base text-[#1D528F]">
                        {item.code}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F2ECE1] text-[#231A15] border border-[#E6DDD0]">
                        {item.quartier}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F2ECE1] text-[#5C4D44] border border-[#E6DDD0]">
                        {item.locationType === 'COMMERCE'
                          ? 'Commerce'
                          : item.locationType === 'INSTITUTION'
                          ? 'Institution'
                          : 'Maison'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#231A15] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.ownerName && (
                      <p className="text-xs text-[#5C4D44] mt-1">
                        Propriétaire :{' '}
                        <span className="font-medium text-[#231A15]">{item.ownerName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to={`/a/${item.code}`}
                  className="shrink-0 self-end sm:self-center px-3 py-1.5 rounded-lg border border-[#8C8272] bg-[#FBF9F5] hover:bg-[#F2ECE1] text-xs font-bold text-[#1D528F] transition flex items-center gap-1.5 touch-target shadow-[0_1px_0_rgba(35,26,21,0.06)]"
                >
                  <span>Voir la fiche</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </article>
            ))}
          </div>

          {/* Bouton Afficher plus (Pagination discrète) */}
          {page + 1 < totalPages && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-xs font-bold text-[#231A15] transition shadow-[0_1px_0_rgba(35,26,21,0.06)] touch-target cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1D528F]" />
                    <span>Chargement des adresses suivantes...</span>
                  </>
                ) : (
                  <span>Afficher plus d'adresses</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default DirectoryPage;
