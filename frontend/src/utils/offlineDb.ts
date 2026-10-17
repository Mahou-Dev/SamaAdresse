export interface OfflineReservedCode {
  code: string;
  zone: string;
  quartier: string;
  expiresAt: string;
  status: 'RESERVED' | 'USED';
}

export interface OfflineDraft {
  id: string;
  clientRequestId: string;
  latitude: number;
  longitude: number;
  zone: string;
  quartier: string;
  description: string;
  locationType: string;
  photoBlob: Blob | null;
  reservedCode: string | null;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  createdAt: string;
  attempts: number;
  lastError?: string | null;
}

const DB_NAME = 'samaadresse_offline';
const DB_VERSION = 1;
export const MAX_DRAFTS = 20;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB non disponible dans cet environnement'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('reservedCodes')) {
        const reservedStore = db.createObjectStore('reservedCodes', { keyPath: 'code' });
        reservedStore.createIndex('status', 'status', { unique: false });
        reservedStore.createIndex('zone_quartier', ['zone', 'quartier'], { unique: false });
      }

      if (!db.objectStoreNames.contains('drafts')) {
        const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
        draftStore.createIndex('status', 'status', { unique: false });
        draftStore.createIndex('createdAt', 'createdAt', { unique: false });
        draftStore.createIndex('clientRequestId', 'clientRequestId', { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function saveReservedCodes(codes: OfflineReservedCode[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reservedCodes', 'readwrite');
    const store = tx.objectStore('reservedCodes');

    codes.forEach((item) => {
      store.put(item);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAvailableReservedCode(zone: string, quartier: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reservedCodes', 'readwrite');
    const store = tx.objectStore('reservedCodes');
    const request = store.openCursor();
    const now = new Date().toISOString();

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(null);
        return;
      }

      const item: OfflineReservedCode = cursor.value;
      if (
        item.zone.toUpperCase() === zone.toUpperCase() &&
        item.quartier.toUpperCase() === quartier.toUpperCase() &&
        item.status === 'RESERVED' &&
        item.expiresAt > now
      ) {
        // Marquer comme USED localement pour éviter réattribution
        item.status = 'USED';
        cursor.update(item);
        resolve(item.code);
        return;
      }

      cursor.continue();
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getReservedCodes(): Promise<OfflineReservedCode[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reservedCodes', 'readonly');
    const store = tx.objectStore('reservedCodes');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getDrafts(): Promise<OfflineDraft[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readonly');
    const store = tx.objectStore('drafts');
    const request = store.getAll();

    request.onsuccess = () => {
      const list: OfflineDraft[] = request.result || [];
      // Tri chronologique
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDraftsCount(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readonly');
    const store = tx.objectStore('drafts');
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(draft: OfflineDraft): Promise<void> {
  const currentCount = await getDraftsCount();
  if (currentCount >= MAX_DRAFTS) {
    throw new Error('File d\'attente pleine (20 adresses). Veuillez vous reconnecter pour les transmettre.');
  }

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    store.put(draft);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateDraft(draft: OfflineDraft): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    store.put(draft);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    const store = tx.objectStore('drafts');
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearReservedCodes(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reservedCodes', 'readwrite');
    tx.objectStore('reservedCodes').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearDrafts(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite');
    tx.objectStore('drafts').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['reservedCodes', 'drafts'], 'readwrite');
    tx.objectStore('reservedCodes').clear();
    tx.objectStore('drafts').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

if (typeof window !== 'undefined') {
  (window as any).__offlineDb = {
    openDb,
    saveDraft,
    getDrafts,
    getDraftsCount,
    saveReservedCodes,
    getReservedCodes,
    clearReservedCodes,
    clearDrafts,
    clearAllOfflineData,
  };
}

