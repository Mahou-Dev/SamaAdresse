import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMyAddresses,
  uploadAddressPhoto,
  archiveAddress,
  restoreAddress,
  updateAddressVisibility,
} from '../../api/addressApi';
import type { AddressResponse } from '../../api/addressApi';
import { ApiError } from '../../api/apiClient';
import { getDrafts } from '../../utils/offlineDb';
import type { OfflineDraft } from '../../utils/offlineDb';
import { syncManager } from '../../utils/syncManager';
import { validateStep3Photo } from '../../utils/formValidation';
import { compressImage } from '../../utils/imageCompressor';
import type { ToastType } from '../../components/Toast';

export interface UseMyAddressesOptions {
  isOnline: boolean;
  showToast: (message: string, type?: ToastType) => void;
}

export function useMyAddresses({ isOnline, showToast }: UseMyAddressesOptions) {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [codeChangedNotification, setCodeChangedNotification] = useState<string | null>(null);
  const [recentlyArchived, setRecentlyArchived] = useState<AddressResponse | null>(null);
  const [archiving, setArchiving] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null);
  const [uploadingAddressId, setUploadingAddressId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const actionInFlightRef = useRef<boolean>(false);

  const reload = useCallback(() => {
    setLoading(true);
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setErrorMsg(null);
      setIsSessionExpired(false);

      const draftList = await getDrafts().catch(() => [] as OfflineDraft[]);
      if (!cancelled) {
        setDrafts(draftList);
      }

      try {
        const data = await getMyAddresses();
        if (!cancelled) {
          setAddresses(data);
          setErrorMsg(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setIsSessionExpired(true);
            setErrorMsg('Votre session a expiré. Reconnectez-vous pour gérer vos adresses.');
          } else if (err instanceof ApiError) {
            setErrorMsg(err.message);
          } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setErrorMsg(null);
          } else {
            setErrorMsg('Impossible de charger vos adresses.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAll();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === 'SYNC_START') {
        setIsSyncing(true);
      } else if (event.type === 'SYNC_PROGRESS') {
        getDrafts()
          .then((list) => setDrafts(list))
          .catch(() => {});
      } else if (event.type === 'SYNC_SUCCESS') {
        if (event.draftId) {
          setDrafts((prev) => prev.filter((d) => d.id !== event.draftId));
        } else {
          getDrafts()
            .then((list) => setDrafts(list))
            .catch(() => {});
        }
        if (event.address) {
          const synced = event.address;
          setAddresses((prev) => {
            if (prev.some((a) => a.id === synced.id || a.code === synced.code)) {
              return prev;
            }
            return [synced, ...prev];
          });
          showToastRef.current(`Adresse ${synced.code} synchronisée !`, 'success');
        }
      } else if (event.type === 'CODE_CHANGED') {
        if (event.message) {
          setCodeChangedNotification(event.message);
        }
      } else if (event.type === 'SYNC_COMPLETE' || event.type === 'SYNC_ERROR') {
        setIsSyncing(false);
        setRefreshTick((t) => t + 1);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setIsSyncing(true);
    try {
      await syncManager.syncNow();
      setRefreshTick((t) => t + 1);
    } finally {
      actionInFlightRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline]);

  const confirmArchive = useCallback(
    async (target: AddressResponse): Promise<boolean> => {
      if (actionInFlightRef.current) return false;
      if (!isOnline) {
        showToastRef.current('Une connexion Internet est requise pour archiver une adresse.', 'error');
        return false;
      }
      actionInFlightRef.current = true;
      setArchiving(true);
      try {
        const updated = await archiveAddress(target.id);
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setRecentlyArchived(updated);
        showToastRef.current(`Adresse ${updated.code} archivée.`, 'info');
        return true;
      } catch (err: unknown) {
        showToastRef.current(
          err instanceof ApiError ? err.message : "Impossible d'archiver cette adresse.",
          'error'
        );
        return false;
      } finally {
        actionInFlightRef.current = false;
        setArchiving(false);
      }
    },
    [isOnline]
  );

  const restore = useCallback(
    async (addressId: string): Promise<boolean> => {
      if (actionInFlightRef.current) return false;
      if (!isOnline) {
        showToastRef.current('Une connexion Internet est requise pour restaurer une adresse.', 'error');
        return false;
      }
      actionInFlightRef.current = true;
      setRestoringId(addressId);
      try {
        const updated = await restoreAddress(addressId);
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setRecentlyArchived((prev) => (prev?.id === addressId ? null : prev));
        showToastRef.current(`Adresse ${updated.code} restaurée avec succès.`, 'success');
        return true;
      } catch (err: unknown) {
        showToastRef.current(
          err instanceof ApiError ? err.message : 'Impossible de restaurer cette adresse.',
          'error'
        );
        return false;
      } finally {
        actionInFlightRef.current = false;
        setRestoringId(null);
      }
    },
    [isOnline]
  );

  const toggleVisibility = useCallback(
    async (target: AddressResponse): Promise<boolean> => {
      if (actionInFlightRef.current || target.status !== 'ACTIVE') return false;
      if (!isOnline) {
        showToastRef.current(
          'Une connexion Internet est requise pour modifier la visibilité dans l’annuaire.',
          'error'
        );
        return false;
      }
      const nextListed = !target.listed;
      const nextShowOwnerName = nextListed ? Boolean(target.showOwnerName) : false;

      actionInFlightRef.current = true;
      setTogglingVisibilityId(target.id);
      try {
        const updated = await updateAddressVisibility(target.id, {
          listed: nextListed,
          showOwnerName: nextShowOwnerName,
        });
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showToastRef.current(
          updated.listed
            ? `Adresse ${updated.code} publiée dans l'annuaire public.`
            : `Adresse ${updated.code} retirée de l'annuaire public.`,
          'success'
        );
        return true;
      } catch (err: unknown) {
        showToastRef.current(
          err instanceof ApiError
            ? err.message
            : "Impossible de modifier la visibilité de cette adresse.",
          'error'
        );
        return false;
      } finally {
        actionInFlightRef.current = false;
        setTogglingVisibilityId(null);
      }
    },
    [isOnline]
  );

  const uploadPhoto = useCallback(
    async (addressId: string, file: File): Promise<boolean> => {
      if (actionInFlightRef.current) return false;
      if (!isOnline) {
        showToastRef.current('Une connexion Internet est requise pour envoyer une photo.', 'error');
        return false;
      }

      const validation = validateStep3Photo(file);
      if (!validation.isValid) {
        showToastRef.current(validation.error || 'Format ou taille de photo non valide.', 'error');
        return false;
      }

      actionInFlightRef.current = true;
      setUploadingAddressId(addressId);
      try {
        const compressed = await compressImage(file);
        const updated = await uploadAddressPhoto(addressId, compressed.file);
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showToastRef.current('Photo de façade mise à jour avec succès.', 'success');
        return true;
      } catch (err: unknown) {
        showToastRef.current(
          err instanceof ApiError ? err.message : "Erreur lors de l'envoi de la photo.",
          'error'
        );
        return false;
      } finally {
        actionInFlightRef.current = false;
        setUploadingAddressId(null);
      }
    },
    [isOnline]
  );

  return {
    addresses,
    drafts,
    loading,
    errorMsg,
    isSessionExpired,
    isSyncing,
    codeChangedNotification,
    setCodeChangedNotification,
    recentlyArchived,
    setRecentlyArchived,
    archiving,
    restoringId,
    togglingVisibilityId,
    uploadingAddressId,
    reload,
    syncNow,
    confirmArchive,
    restore,
    toggleVisibility,
    uploadPhoto,
  };
}
