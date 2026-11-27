import { ApiError } from './api'

/** Message lisible pour une erreur d'API ou réseau, sans jamais inventer de succès. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message
    // 502/503/504 : message rédigé par le serveur (service tiers ou non configuré), utile à afficher.
    // 500 : erreur inattendue, on n'en montre pas le détail technique.
    if (error.status === 500 || (error.status > 504)) return 'Le service rencontre un problème. Réessayez plus tard.'
    if (error.status >= 502 && error.message === 'La requête a échoué.') return 'Le service est momentanément indisponible. Réessayez plus tard.'
    return error.message
  }
  return 'Une erreur inattendue est survenue.'
}
