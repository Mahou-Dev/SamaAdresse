import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPublicAddress } from '../../../api/addressApi';
import type { PublicAddressResponse } from '../../../api/addressApi';
import { ApiError } from '../../../api/apiClient';
import { useOnlineStatus } from '../../../context/OnlineStatusContext';
import { readVisitedAddressCodes } from '../utils';

export interface PublicAddressState {
  address: PublicAddressResponse | null;
  loading: boolean;
  errorMsg: string | null;
  errorStatus: number | null;
  isOnline: boolean;
  cachedDate: string | null;
  visitedCodes: string[];
  reload: () => void;
}

export function usePublicAddress(code?: string): PublicAddressState {
  const { isOnline } = useOnlineStatus();
  const [address, setAddress] = useState<PublicAddressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(code));
  const [errorMsg, setErrorMsg] = useState<string | null>(
    code ? null : "Aucun code d'adresse fourni."
  );
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Réinitialisation synchrone lors d'un changement de paramètre :code
  const [trackedCode, setTrackedCode] = useState(code);
  if (code !== trackedCode) {
    setTrackedCode(code);
    setAddress(null);
    setLoading(Boolean(code));
    setErrorMsg(code ? null : "Aucun code d'adresse fourni.");
    setErrorStatus(null);
  }

  const reload = useCallback(() => {
    if (!code) return;
    setLoading(true);
    setErrorMsg(null);
    setErrorStatus(null);
    setReloadNonce((n) => n + 1);
  }, [code]);

  useEffect(() => {
    if (!code) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const data = await getPublicAddress(code);
        if (cancelled) return;
        setAddress(data);
        setErrorMsg(null);
        setErrorStatus(null);
      } catch (err: unknown) {
        if (cancelled) return;
        setAddress(null);
        if (err instanceof ApiError) {
          setErrorStatus(err.status);
          setErrorMsg(err.message);
        } else if (err instanceof Error) {
          setErrorMsg(err.message || 'Impossible de charger cette adresse.');
        } else {
          setErrorMsg('Impossible de charger cette adresse.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [code, reloadNonce]);

  const cachedDate = useMemo(() => {
    if (isOnline || !code) return null;
    try {
      return localStorage.getItem(`cached_date_${code}`) || new Date().toLocaleDateString('fr-FR');
    } catch {
      return new Date().toLocaleDateString('fr-FR');
    }
  }, [isOnline, code]);

  const visitedCodes = useMemo(() => {
    if (isOnline) return [];
    return readVisitedAddressCodes();
  }, [isOnline]);

  return {
    address,
    loading,
    errorMsg,
    errorStatus,
    isOnline,
    cachedDate,
    visitedCodes,
    reload,
  };
}
