import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncManager } from './syncManager';
import type { SyncEvent } from './syncManager';
import * as offlineDb from './offlineDb';
import * as addressApi from '../api/addressApi';

vi.mock('./offlineDb', () => ({
  getDrafts: vi.fn(),
  updateDraft: vi.fn(),
  deleteDraft: vi.fn(),
  saveReservedCodes: vi.fn(),
  getDraftsCount: vi.fn(),
  saveDraft: vi.fn(),
  MAX_DRAFTS: 20,
}));

vi.mock('../api/addressApi', () => ({
  createAddress: vi.fn(),
  topUpReservedCodes: vi.fn(),
  getActiveReservedCodes: vi.fn(),
}));

describe('syncManager — Gestion de la synchronisation et de la file', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate navigator.onLine = true
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });
  });

  it('émet les événements appropriés lors d\'une synchronisation réussie', async () => {
    const mockDraft: offlineDb.OfflineDraft = {
      id: 'draft-1',
      clientRequestId: '550e8400-e29b-41d4-a716-446655440000',
      latitude: 12.5783,
      longitude: -16.2719,
      zone: 'ZIG',
      quartier: 'Boucotte',
      description: 'Maison test Boucotte',
      locationType: 'MAISON',
      photoBlob: null,
      reservedCode: 'ZIG-BOU-1234',
      status: 'PENDING',
      createdAt: '2026-10-17T00:00:00Z',
      attempts: 0,
    };

    vi.mocked(offlineDb.getDrafts).mockResolvedValue([mockDraft]);
    vi.mocked(addressApi.createAddress).mockResolvedValue({
      id: 'addr-1',
      code: 'ZIG-BOU-1234',
      zone: 'ZIG',
      quartier: 'Boucotte',
      description: 'Maison test Boucotte',
      locationType: 'MAISON',
      latitude: 12.5783,
      longitude: -16.2719,
      status: 'ACTIVE',
      createdAt: '2026-10-17T00:00:00Z',
      isPublic: true,
      listed: true,
      showOwnerName: false,
      codeChanged: false,
      owner: {
        id: 'user-1',
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+221770000000',
        role: 'USER',
      },
    } as any);

    const events: SyncEvent[] = [];
    const unsubscribe = syncManager.subscribe((e) => events.push(e));

    await syncManager.syncNow();
    unsubscribe();

    expect(events.map((e) => e.type)).toEqual([
      'SYNC_START',
      'SYNC_PROGRESS',
      'SYNC_SUCCESS',
      'SYNC_COMPLETE',
    ]);
    expect(offlineDb.deleteDraft).toHaveBeenCalledWith('draft-1');
  });

  it('détecte et signale codeChanged lors de la réattribution du code par le serveur', async () => {
    const mockDraft: offlineDb.OfflineDraft = {
      id: 'draft-reassign',
      clientRequestId: '660e8400-e29b-41d4-a716-446655440001',
      latitude: 12.5800,
      longitude: -16.2700,
      zone: 'ZIG',
      quartier: 'Escale',
      description: 'Boutique Escale',
      locationType: 'COMMERCE',
      photoBlob: null,
      reservedCode: 'ZIG-BOU-9999', // mauvais préfixe
      status: 'PENDING',
      createdAt: '2026-10-17T00:00:00Z',
      attempts: 0,
    };

    vi.mocked(offlineDb.getDrafts).mockResolvedValue([mockDraft]);
    vi.mocked(addressApi.createAddress).mockResolvedValue({
      id: 'addr-2',
      code: 'ZIG-ESC-4321', // réassigné
      zone: 'ZIG',
      quartier: 'Escale',
      description: 'Boutique Escale',
      locationType: 'COMMERCE',
      latitude: 12.5800,
      longitude: -16.2700,
      status: 'ACTIVE',
      createdAt: '2026-10-17T00:00:00Z',
      isPublic: true,
      listed: true,
      showOwnerName: false,
      codeChanged: true,
      previousCode: 'ZIG-BOU-9999',
    } as any);

    const events: SyncEvent[] = [];
    const unsubscribe = syncManager.subscribe((e) => events.push(e));

    await syncManager.syncNow();
    unsubscribe();

    const codeChangedEvent = events.find((e) => e.type === 'CODE_CHANGED');
    expect(codeChangedEvent).toBeDefined();
    expect(codeChangedEvent?.codeChangedNotice).toEqual({
      quartier: 'Escale',
      newCode: 'ZIG-ESC-4321',
      oldCode: 'ZIG-BOU-9999',
    });
    expect(offlineDb.deleteDraft).toHaveBeenCalledWith('draft-reassign');
  });

  it('gère l\'échec réseau, incrémente les tentatives et met à jour le statut', async () => {
    const mockDraft: offlineDb.OfflineDraft = {
      id: 'draft-fail',
      clientRequestId: '770e8400-e29b-41d4-a716-446655440002',
      latitude: 12.5700,
      longitude: -16.2700,
      zone: 'ZIG',
      quartier: 'Boucotte',
      description: 'Maison erreur',
      locationType: 'MAISON',
      photoBlob: null,
      reservedCode: null,
      status: 'PENDING',
      createdAt: '2026-10-17T00:00:00Z',
      attempts: 1,
    };

    vi.mocked(offlineDb.getDrafts).mockResolvedValue([mockDraft]);
    vi.mocked(addressApi.createAddress).mockRejectedValue(new Error('Erreur réseau 500'));

    const events: SyncEvent[] = [];
    const unsubscribe = syncManager.subscribe((e) => events.push(e));

    await syncManager.syncNow();
    unsubscribe();

    const errorEvent = events.find((e) => e.type === 'SYNC_ERROR');
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.message).toBe('Erreur réseau 500');
    expect(offlineDb.updateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'draft-fail',
        status: 'FAILED',
        attempts: 2,
        lastError: 'Erreur réseau 500',
      })
    );
    expect(offlineDb.deleteDraft).not.toHaveBeenCalled();
  });

  it('conserve l\'idempotence avec le même clientRequestId', async () => {
    const clientRequestId = 'unique-uuid-client-1234';
    const mockDraft: offlineDb.OfflineDraft = {
      id: 'draft-idem',
      clientRequestId,
      latitude: 12.575,
      longitude: -16.275,
      zone: 'ZIG',
      quartier: 'Boucotte',
      description: 'Idempotent test',
      locationType: 'MAISON',
      photoBlob: null,
      reservedCode: 'ZIG-BOU-5555',
      status: 'PENDING',
      createdAt: '2026-10-17T00:00:00Z',
      attempts: 0,
    };

    vi.mocked(offlineDb.getDrafts).mockResolvedValue([mockDraft]);
    vi.mocked(addressApi.createAddress).mockResolvedValue({
      id: 'addr-existing',
      code: 'ZIG-BOU-5555',
      zone: 'ZIG',
      quartier: 'Boucotte',
      description: 'Idempotent test',
      locationType: 'MAISON',
      latitude: 12.575,
      longitude: -16.275,
      status: 'ACTIVE',
      createdAt: '2026-10-17T00:00:00Z',
      isPublic: true,
      listed: true,
      showOwnerName: false,
    } as any);

    await syncManager.syncNow();

    expect(addressApi.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        clientRequestId,
        reservedCode: 'ZIG-BOU-5555',
      }),
      undefined
    );
  });
});
