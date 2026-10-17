import {
  getDrafts,
  updateDraft,
  deleteDraft,
  saveReservedCodes,
} from './offlineDb';
import type { OfflineDraft, OfflineReservedCode } from './offlineDb';
import {
  createAddress,
  topUpReservedCodes,
  getActiveReservedCodes,
} from '../api/addressApi';
import { hasSessionIndicator, getMemoryAccessToken } from '../api/apiClient';
import { getQuartierName } from './geoGrid';
import type {
  AddressResponse,
  CreateAddressPayload,
  LocationType,
} from '../api/addressApi';

export type SyncEventType =
  | 'SYNC_START'
  | 'SYNC_PROGRESS'
  | 'SYNC_SUCCESS'
  | 'SYNC_ERROR'
  | 'SYNC_COMPLETE'
  | 'CODE_CHANGED';

export interface SyncEvent {
  type: SyncEventType;
  draftId?: string;
  draft?: OfflineDraft;
  address?: AddressResponse;
  message?: string;
  codeChangedNotice?: {
    quartier: string;
    newCode: string;
    oldCode: string;
  };
}

type SyncListener = (event: SyncEvent) => void;

class ForegroundSyncManager {
  private isSyncing = false;
  private isRefreshingCodes = false;
  private listeners: Set<SyncListener> = new Set();
  private initialized = false;

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: SyncEvent) {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch {
        // ignore subscriber errors
      }
    });
  }

  private isAuthenticated(): boolean {
    return Boolean(getMemoryAccessToken() || hasSessionIndicator());
  }

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    window.addEventListener('online', () => {
      if (this.isAuthenticated()) {
        this.refreshReservedCodes();
        this.syncNow();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine && this.isAuthenticated()) {
        this.refreshReservedCodes();
        this.syncNow();
      }
    });

    // Tentative initiale si en ligne et connecté
    if (navigator.onLine) {
      setTimeout(() => {
        if (this.isAuthenticated()) {
          this.refreshReservedCodes();
          this.syncNow();
        }
      }, 1000);
    }
  }

  public async refreshReservedCodes(zone: string = 'ZIG'): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.onLine) return;
    if (!this.isAuthenticated() || this.isRefreshingCodes) return;
    this.isRefreshingCodes = true;
    try {
      let items = await getActiveReservedCodes();
      const activeForZone = Array.isArray(items)
        ? items.filter((i) => i.zone === zone && i.status === 'RESERVED')
        : [];

      // Ne déclencher le POST de garnissage (limité à 5 appels/heure) que si le stock actif est incomplet (< 15 pour ZIG)
      if (activeForZone.length < 15) {
        try {
          items = await topUpReservedCodes(zone);
        } catch {
          // Conserver la liste obtenue par GET si le plafond horaire est atteint
        }
      }

      if (Array.isArray(items) && items.length > 0) {
        const toSave: OfflineReservedCode[] = items.map((i) => ({
          code: i.code,
          zone: i.zone,
          quartier: i.quartier,
          expiresAt: i.expiresAt,
          status: i.status === 'USED' ? 'USED' : 'RESERVED',
        }));
        await saveReservedCodes(toSave);
      }
    } catch {
      // Ignorer les erreurs réseau silencieuses de garnissage en arrière-plan
    } finally {
      this.isRefreshingCodes = false;
    }
  }

  public async syncNow(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.onLine) return;
    if (this.isSyncing) return;

    const drafts = await getDrafts();
    if (drafts.length === 0) return;

    this.isSyncing = true;
    this.emit({ type: 'SYNC_START' });

    try {
      for (const draft of drafts) {
        draft.status = 'SYNCING';
        await updateDraft(draft);
        this.emit({ type: 'SYNC_PROGRESS', draftId: draft.id, draft });

        try {
          const payload: CreateAddressPayload = {
            latitude: draft.latitude,
            longitude: draft.longitude,
            description: draft.description,
            locationType: draft.locationType as LocationType,
            reservedCode: draft.reservedCode || undefined,
            clientRequestId: draft.clientRequestId,
          };

          const response = await createAddress(payload, draft.photoBlob || undefined);

          // Si le code réservé a été réassigné
          if (response.codeChanged) {
            const oldCode = response.previousCode || draft.reservedCode || 'code provisoire';
            const quartierName = getQuartierName(response.quartier, response.zone) || response.quartier;
            this.emit({
              type: 'CODE_CHANGED',
              codeChangedNotice: {
                quartier: quartierName,
                newCode: response.code,
                oldCode,
              },
              message: `Le code provisoire ${oldCode} a été remplacé par ${response.code}, car l'adresse se trouve à ${quartierName}.`,
            });
          }

          // Supprimer le brouillon local synchronisé
          await deleteDraft(draft.id);

          this.emit({
            type: 'SYNC_SUCCESS',
            draftId: draft.id,
            address: response,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erreur de transmission';
          draft.status = 'FAILED';
          draft.attempts = (draft.attempts || 0) + 1;
          draft.lastError = message;
          await updateDraft(draft);

          this.emit({
            type: 'SYNC_ERROR',
            draftId: draft.id,
            draft,
            message,
          });
          // Arrêter la boucle sur erreur réseau pour ne pas spammer
          break;
        }
      }
    } finally {
      this.isSyncing = false;
      this.emit({ type: 'SYNC_COMPLETE' });
    }
  }
}

export const syncManager = new ForegroundSyncManager();

if (typeof window !== 'undefined') {
  (window as any).__syncManager = syncManager;
}

