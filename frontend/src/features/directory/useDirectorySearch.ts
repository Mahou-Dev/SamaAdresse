import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchDirectory } from '../../api/addressApi';
import type { DirectoryItemResponse, LocationType } from '../../api/addressApi';
import { ApiError } from '../../api/apiClient';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { parseDirectoryView } from './types';
import type { DirectoryViewMode } from './types';

const PAGE_SIZE = 12;

function readVisitedCodes(): string[] {
  try {
    const raw = localStorage.getItem('visited_address_codes');
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

function parseLocationType(raw: string | null): '' | LocationType {
  if (raw === 'MAISON' || raw === 'COMMERCE' || raw === 'INSTITUTION') {
    return raw;
  }
  return '';
}

export function useDirectorySearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOnline } = useOnlineStatus();

  const urlQ = searchParams.get('q') || '';
  const urlQuartier = searchParams.get('quartier') || '';
  const urlType = parseLocationType(searchParams.get('type'));
  const viewMode: DirectoryViewMode = parseDirectoryView(searchParams.get('view'));

  // Synchronisation du champ de saisie lors d'une navigation externe (ex. bouton retour ou raccourci)
  const [inputQ, setInputQ] = useState(urlQ);
  const [syncedUrlQ, setSyncedUrlQ] = useState(urlQ);
  if (urlQ !== syncedUrlQ) {
    setSyncedUrlQ(urlQ);
    setInputQ(urlQ);
  }

  const [items, setItems] = useState<DirectoryItemResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(isOnline);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);
  const latestParamsRef = useRef({
    q: urlQ,
    quartier: urlQuartier,
    type: urlType,
    view: viewMode,
  });

  useEffect(() => {
    latestParamsRef.current = {
      q: urlQ,
      quartier: urlQuartier,
      type: urlType,
      view: viewMode,
    };
  }, [urlQ, urlQuartier, urlType, viewMode]);

  // Nettoyage du timer de debounce au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Compte à rebours 429
  useEffect(() => {
    if (retryAfterSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setRetryAfterSeconds((prev) => {
        if (prev <= 1) {
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [retryAfterSeconds]);

  const updateUrlParams = useCallback(
    (next: {
      q?: string;
      quartier?: string;
      type?: '' | LocationType;
      view?: DirectoryViewMode;
    }) => {
      const current = latestParamsRef.current;
      const mergedQ = next.q !== undefined ? next.q : current.q;
      const mergedQuartier = next.quartier !== undefined ? next.quartier : current.quartier;
      const mergedType = next.type !== undefined ? next.type : current.type;
      const mergedView = next.view !== undefined ? next.view : current.view;

      const params = new URLSearchParams();
      if (mergedQ.trim()) params.set('q', mergedQ.trim());
      if (mergedQuartier) params.set('quartier', mergedQuartier);
      if (mergedType) params.set('type', mergedType);
      if (mergedView !== 'grid') params.set('view', mergedView);

      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const fetchDirectoryPage = useCallback(
    async (
      qParam: string,
      quartierParam: string,
      typeParam: '' | LocationType,
      pageNumber: number,
      append: boolean
    ) => {
      if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const seq = ++requestSeqRef.current;

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
          size: PAGE_SIZE,
        });

        if (seq !== requestSeqRef.current) return;

        if (append) {
          setItems((prev) => {
            const seen = new Set(prev.map((item) => item.code));
            const nextItems = response.content.filter((item) => !seen.has(item.code));
            return [...prev, ...nextItems];
          });
        } else {
          setItems(response.content);
        }

        setPage(response.number);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setHasSearched(true);

        const count = response.totalElements;
        setLiveAnnouncement(
          count === 0
            ? 'Aucune adresse trouvée'
            : count === 1
            ? '1 adresse trouvée'
            : `${count} adresses trouvées`
        );
      } catch (err: unknown) {
        if (seq !== requestSeqRef.current) return;

        if (err instanceof ApiError && err.status === 429) {
          setIsRateLimited(true);
          const data = err.data as { retryAfterSeconds?: number } | undefined;
          const waitTime =
            typeof data?.retryAfterSeconds === 'number' && data.retryAfterSeconds > 0
              ? data.retryAfterSeconds
              : 60;
          setRetryAfterSeconds(waitTime);
          setError('Trop de recherches. Merci de patienter un instant.');
          setLiveAnnouncement('Trop de recherches. Merci de patienter un instant.');
        } else if (err instanceof ApiError && err.status === 403) {
          setError(
            'Votre requête a été bloquée par le pare-feu de sécurité (terme non autorisé ou suspect).'
          );
          setLiveAnnouncement('Requête bloquée par la sécurité.');
        } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
          // Géré par l'état hors ligne
        } else {
          setError('Une erreur est survenue lors de la recherche.');
          setLiveAnnouncement('Erreur lors de la recherche.');
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [isOnline]
  );

  // Déclenchement uniquement lorsque les critères de recherche ou la connectivité changent
  // (changer de vue Grille / Liste / Carte ne relance jamais la requête API)
  useEffect(() => {
    if (!isOnline) {
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchDirectoryPage(urlQ, urlQuartier, urlType, 0, false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [urlQ, urlQuartier, urlType, isOnline, retryNonce, fetchDirectoryPage]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputQ(value);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        updateUrlParams({ q: value });
      }, 300);
    },
    [updateUrlParams]
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setInputQ(value);
      updateUrlParams({ q: value });
    },
    [updateUrlParams]
  );

  const handleClearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setInputQ('');
    updateUrlParams({ q: '' });
  }, [updateUrlParams]);

  const handleQuartierChange = useCallback(
    (quartier: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      updateUrlParams({ q: inputQ, quartier });
    },
    [inputQ, updateUrlParams]
  );

  const handleTypeChange = useCallback(
    (type: '' | LocationType) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      updateUrlParams({ q: inputQ, type });
    },
    [inputQ, updateUrlParams]
  );

  const handleViewChange = useCallback(
    (view: DirectoryViewMode) => {
      updateUrlParams({ view });
    },
    [updateUrlParams]
  );

  const resetFilters = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setInputQ('');
    updateUrlParams({ q: '', quartier: '', type: '' });
  }, [updateUrlParams]);

  const loadMore = useCallback(() => {
    if (page + 1 < totalPages && !loadingMore) {
      void fetchDirectoryPage(urlQ, urlQuartier, urlType, page + 1, true);
    }
  }, [page, totalPages, loadingMore, fetchDirectoryPage, urlQ, urlQuartier, urlType]);

  const retry = useCallback(() => {
    setRetryNonce((n) => n + 1);
  }, []);

  const visitedCodes = useMemo(() => {
    if (isOnline) return [];
    return readVisitedCodes();
  }, [isOnline]);

  const activeFilterCount =
    (urlQ.trim() ? 1 : 0) + (urlQuartier ? 1 : 0) + (urlType ? 1 : 0);

  return {
    inputQ,
    urlQ,
    selectedQuartier: urlQuartier,
    selectedType: urlType,
    viewMode,
    items,
    page,
    totalPages,
    totalElements,
    loading: isOnline ? loading : false,
    loadingMore,
    error: isOnline ? error : null,
    isRateLimited: isOnline ? isRateLimited : false,
    retryAfterSeconds,
    isOffline: !isOnline,
    liveAnnouncement,
    hasSearched,
    visitedCodes,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
    canLoadMore: page + 1 < totalPages,
    handleInputChange,
    handleSearchSubmit,
    handleClearSearch,
    handleQuartierChange,
    handleTypeChange,
    handleViewChange,
    resetFilters,
    loadMore,
    retry,
  };
}
