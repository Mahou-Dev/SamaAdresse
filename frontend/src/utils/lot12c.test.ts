import { describe, it, expect } from 'vitest';
import { ApiError } from '../api/apiClient';

describe('Lot 12c (A1) — Gestion du 403 WAF Cloudflare / Render sur la recherche', () => {
  it('instancie correctement un ApiError 403', () => {
    const error = new ApiError(403, 'Erreur HTTP 403', { message: 'Blocked by Cloudflare/Render WAF' });
    expect(error.status).toBe(403);
    expect(error.message).toBe('Erreur HTTP 403');
  });

  it('génère un message clair et sécurisé sans écran cassé pour un 403 WAF', () => {
    const formatErrorMessage = (err: unknown): string => {
      if (err instanceof ApiError && err.status === 429) {
        return 'Trop de recherches. Merci de patienter un instant.';
      } else if (err instanceof ApiError && err.status === 403) {
        return 'Votre requête a été bloquée par le pare-feu de sécurité (terme non autorisé ou suspect).';
      }
      return 'Une erreur est survenue lors de la recherche.';
    };

    const err403 = new ApiError(403, 'Erreur HTTP 403');
    expect(formatErrorMessage(err403)).toBe(
      'Votre requête a été bloquée par le pare-feu de sécurité (terme non autorisé ou suspect).'
    );

    const errGeneric = new Error('Network error');
    expect(formatErrorMessage(errGeneric)).toBe('Une erreur est survenue lors de la recherche.');
  });
});
