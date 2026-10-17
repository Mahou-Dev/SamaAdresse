import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasSessionIndicator,
  setSessionIndicator,
  clearSessionIndicator,
} from '../api/apiClient';
import { REPORT_REASONS } from '../pages/PublicAddressPage';
import type { AddressResponse, AddressStatus, ReportReason } from '../api/addressApi';

// Fonctions pures de transition d'état et validation Lot 4 testées unitairement
export function filterAddressesByTab(
  addresses: AddressResponse[],
  tab: 'ACTIVE' | 'ARCHIVED'
): AddressResponse[] {
  return tab === 'ACTIVE'
    ? addresses.filter((a) => a.status !== 'ARCHIVED')
    : addresses.filter((a) => a.status === 'ARCHIVED');
}

export function canRestoreAddress(status: AddressStatus): boolean {
  return status === 'ARCHIVED';
}

export function validateReportPayload(reason: string, comment?: string): {
  valid: boolean;
  error?: string;
} {
  const allowedReasons = REPORT_REASONS.map((r) => r.value as string);
  if (!allowedReasons.includes(reason)) {
    return { valid: false, error: 'Motif de signalement invalide.' };
  }
  if (comment && comment.length > 300) {
    return { valid: false, error: 'Le commentaire ne doit pas dépasser 300 caractères.' };
  }
  return { valid: true };
}

export function canAccessAdminSection(role?: 'ADMIN' | 'PROPRIETAIRE' | null): boolean {
  return role === 'ADMIN';
}

describe('Lot 4 — Cycle de vie, Signalements, Session et Modération Admin', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    const mockStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, val: string) => {
        store[key] = String(val);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage },
      configurable: true,
      writable: true,
    });
  });

  it('gère correctement le drapeau sa_session dans localStorage pour éviter /api/auth/refresh sans session', () => {
    expect(hasSessionIndicator()).toBe(false);
    setSessionIndicator();
    expect(store['sa_session']).toBe('1');
    expect(hasSessionIndicator()).toBe(true);
    clearSessionIndicator();
    expect(hasSessionIndicator()).toBe(false);
  });

  it('filtre correctement les adresses entre les onglets Actives et Archivées et interdit la restauration si SUSPENDUE', () => {
    const owner = {
      id: 'u1',
      fullName: 'Fatou Diallo',
      email: 'fatou@samaadresse.sn',
      phoneNumber: '+221771112233',
      role: 'PROPRIETAIRE',
    };
    const sample: AddressResponse[] = [
      {
        id: '1',
        code: 'ZIG-KBG-1001',
        latitude: 12.58,
        longitude: -16.27,
        description: 'Maison active',
        locationType: 'MAISON',
        zone: 'ZIG',
        quartier: 'KBG',
        status: 'ACTIVE',
        createdAt: '2026-03-28T00:00:00Z',
        owner,
      },
      {
        id: '2',
        code: 'ZIG-KBG-1002',
        latitude: 12.58,
        longitude: -16.27,
        description: 'Maison archivée',
        locationType: 'MAISON',
        zone: 'ZIG',
        quartier: 'KBG',
        status: 'ARCHIVED',
        createdAt: '2026-03-28T00:00:00Z',
        owner,
      },
      {
        id: '3',
        code: 'ZIG-KBG-1003',
        latitude: 12.58,
        longitude: -16.27,
        description: 'Maison suspendue',
        locationType: 'MAISON',
        zone: 'ZIG',
        quartier: 'KBG',
        status: 'SUSPENDED',
        moderationNotice: 'Suspendue par la modération',
        createdAt: '2026-03-28T00:00:00Z',
        owner,
      },
    ];

    const actives = filterAddressesByTab(sample, 'ACTIVE');
    const archived = filterAddressesByTab(sample, 'ARCHIVED');

    expect(actives.map((a) => a.id)).toEqual(['1', '3']);
    expect(archived.map((a) => a.id)).toEqual(['2']);
    expect(canRestoreAddress('ARCHIVED')).toBe(true);
    expect(canRestoreAddress('SUSPENDED')).toBe(false);
    expect(canRestoreAddress('ACTIVE')).toBe(false);
  });

  it('valide le formulaire de signalement public (4 motifs autorisés et commentaire <= 300 caractères)', () => {
    const expectedReasons: ReportReason[] = [
      'POSITION_INCORRECTE',
      'CONTENU_INAPPROPRIE',
      'PHOTO_INAPPROPRIEE',
      'AUTRE',
    ];
    expect(REPORT_REASONS.map((r) => r.value)).toEqual(expectedReasons);

    expect(validateReportPayload('POSITION_INCORRECTE', 'Point GPS décalé de 200m').valid).toBe(
      true
    );
    expect(validateReportPayload('MOTIF_INCONNU').valid).toBe(false);
    expect(validateReportPayload('AUTRE', 'x'.repeat(301)).valid).toBe(false);
  });

  it('affiche conditionnellement l’accès à /admin uniquement pour le rôle ADMIN', () => {
    expect(canAccessAdminSection('ADMIN')).toBe(true);
    expect(canAccessAdminSection('PROPRIETAIRE')).toBe(false);
    expect(canAccessAdminSection(null)).toBe(false);
    expect(canAccessAdminSection(undefined)).toBe(false);
  });
});
