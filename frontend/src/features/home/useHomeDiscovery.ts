import { useState, useEffect, useCallback, useMemo } from 'react';
import { searchDirectory } from '../../api/addressApi';
import type { DirectoryItemResponse } from '../../api/addressApi';
import { useOnlineStatus } from '../../context/OnlineStatusContext';

export interface HomeDiscoveryState {
  items: DirectoryItemResponse[];
  totalElements: number;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  visitedCodes: string[];
  reload: () => void;
}

function readVisitedCodes(): string[] {
  try {
    const raw = localStorage.getItem('visited_address_codes');
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

export function useHomeDiscovery(size = 6): HomeDiscoveryState {
  const { isOnline } = useOnlineStatus();
  const [items, setItems] = useState<DirectoryItemResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(isOnline);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const visitedCodes = useMemo(() => (isOnline ? [] : readVisitedCodes()), [isOnline]);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    let cancelled = false;

    const loadDirectory = async () => {
      try {
        const res = await searchDirectory({ page: 0, size });
        if (cancelled) return;
        setItems(res.content);
        setTotalElements(res.totalElements);
        setError(null);
      } catch {
        if (cancelled) return;
        setError("Impossible de charger les adresses publiées pour le moment.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDirectory();

    return () => {
      cancelled = true;
    };
  }, [isOnline, size, reloadNonce]);

  return {
    items: isOnline ? items : [],
    totalElements: isOnline ? totalElements : 0,
    loading: isOnline ? loading : false,
    error: isOnline ? error : null,
    isOnline,
    visitedCodes,
    reload,
  };
}
