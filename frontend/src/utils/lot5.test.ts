import { describe, it, expect } from 'vitest';
import { formatMyAddressesSubtitle } from './myAddresses';

describe('Lot 5 (0.3) — Compteurs et sous-titre de /addresses/mine', () => {
  it('affiche correctement le sous-titre initial avec 2 actives et 0 archivée', () => {
    expect(formatMyAddressesSubtitle(2, 0)).toBe('2 actives');
  });

  it('affiche correctement le sous-titre avec 1 active et 0 archivée', () => {
    expect(formatMyAddressesSubtitle(1, 0)).toBe('1 active');
  });

  it('affiche correctement le sous-titre avec 0 active et 0 archivée', () => {
    expect(formatMyAddressesSubtitle(0, 0)).toBe('0 active');
  });

  it('couvre le cycle complet : 2 actives -> archiver 1 -> archiver 2 -> restaurer 1 -> restaurer 2', () => {
    let active = 2;
    let archived = 0;

    // État 1 : Initial
    expect(formatMyAddressesSubtitle(active, archived)).toBe('2 actives');

    // Étape 2 : Le propriétaire archive la 1ère adresse
    active -= 1;
    archived += 1;
    expect(formatMyAddressesSubtitle(active, archived)).toBe('1 active · 1 archivée');

    // Étape 3 : Le propriétaire archive la 2nde adresse
    active -= 1;
    archived += 1;
    expect(formatMyAddressesSubtitle(active, archived)).toBe('0 active · 2 archivées');

    // Étape 4 : Le propriétaire restaure la 1ère adresse
    active += 1;
    archived -= 1;
    expect(formatMyAddressesSubtitle(active, archived)).toBe('1 active · 1 archivée');

    // Étape 5 : Le propriétaire restaure la 2nde adresse
    active += 1;
    archived -= 1;
    expect(formatMyAddressesSubtitle(active, archived)).toBe('2 actives');
  });
});
