import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyAddresses } from '../../api/addressApi';
import type { AddressResponse } from '../../api/addressApi';
import { ApiError } from '../../api/apiClient';
import { getDrafts, getReservedCodes } from '../../utils/offlineDb';
import type { OfflineDraft } from '../../utils/offlineDb';
import { syncManager } from '../../utils/syncManager';

export interface DashboardDataState {
  addresses: AddressResponse[];
  drafts: OfflineDraft[];
  activeReservedCodesCount: number;
  loading: boolean;
  isSyncing: boolean;
  errorMsg: string | null;
  isSessionExpired: boolean;
  reload: () => void;
  triggerSync: () => Promise<void>;
}

export function useDashboardData(): DashboardDataState {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [activeReservedCodesCount, setActiveReservedCodesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const syncingRef = useRef<boolean>(false);

  const reload = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setErrorMsg(null);
      setIsSessionExpired(false);

      // Charger d'abord les données locales IndexedDB (toujours sûres, même en erreur réseau)
      const [draftList, reservedList] = await Promise.all([
        getDrafts().catch(() => [] as OfflineDraft[]),
        getReservedCodes().catch(() => []),
      ]);

      if (!cancelled) {
        setDrafts(draftList);
        const now = Date.now();
        setActiveReservedCodesCount(
          reservedList.filter((c) => c.status === 'RESERVED' && new Date(c.expiresAt).getTime() > now)
            .length
        );
      }

      // Charger les adresses serveur (avec repli cache local automatique dans getMyAddresses)
      try {
        const addrList = await getMyAddresses();
        if (!cancelled) {
          setAddresses(addrList);
          setErrorMsg(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setIsSessionExpired(true);
            setErrorMsg('Votre session a expiré. Reconnectez-vous pour consulter vos adresses.');
          } else if (err instanceof ApiError) {
            setErrorMsg(err.message);
          } else {
            setErrorMsg('Impossible de charger les données du tableau de bord.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === 'SYNC_START' || event.type === 'SYNC_PROGRESS') {
        setIsSyncing(true);
      } else if (
        event.type === 'SYNC_COMPLETE' ||
        event.type === 'SYNC_SUCCESS' ||
        event.type === 'SYNC_ERROR'
      ) {
        setIsSyncing(false);
        setRefreshTick((t) => t + 1);
      }
    });

    return () => unsubscribe();
  }, []);

  const triggerSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      await syncManager.syncNow();
      setRefreshTick((t) => t + 1);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  return {
    addresses,
    drafts,
    activeReservedCodesCount,
    loading,
    isSyncing,
    errorMsg,
    isSessionExpired,
    reload,
    triggerSync,
  };
}
