import type { LocationType } from '../api/addressApi';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validation de l'Étape 1 : Position GPS
 * Exige une latitude et une longitude valides dans les limites géographiques.
 */
export function validateStep1Position(
  lat: number | null | undefined,
  lng: number | null | undefined
): ValidationResult {
  if (lat === null || lat === undefined || Number.isNaN(lat)) {
    return { isValid: false, error: 'La latitude est requise.' };
  }
  if (lng === null || lng === undefined || Number.isNaN(lng)) {
    return { isValid: false, error: 'La longitude est requise.' };
  }
  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'La latitude doit être comprise entre -90 et 90 degrés.' };
  }
  if (lng < -180 || lng > 180) {
    return { isValid: false, error: 'La longitude doit être comprise entre -180 et 180 degrés.' };
  }
  return { isValid: true };
}

/**
 * Validation de l'Étape 2 : Détails du lieu
 * Type de lieu valide (MAISON, COMMERCE, INSTITUTION) et description non vide (max 500 car.).
 */
export function validateStep2Details(
  locationType: string,
  description: string
): ValidationResult {
  const validTypes: LocationType[] = ['MAISON', 'COMMERCE', 'INSTITUTION'];
  if (!validTypes.includes(locationType as LocationType)) {
    return { isValid: false, error: 'Veuillez sélectionner un type de lieu valide.' };
  }

  const trimmed = description.trim();
  if (!trimmed) {
    return { isValid: false, error: 'La description du repère visuel est obligatoire.' };
  }
  if (trimmed.length > 500) {
    return { isValid: false, error: 'La description ne doit pas dépasser 500 caractères.' };
  }
  return { isValid: true };
}

/**
 * Validation de l'Étape 3 : Photo (Facultative)
 * Si fournie, doit être un fichier image valide de moins de 10 Mo.
 */
export function validateStep3Photo(photo?: File | null): ValidationResult {
  if (!photo) {
    return { isValid: true }; // Étape facultative
  }

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!acceptedTypes.includes(photo.type)) {
    return {
      isValid: false,
      error: 'Format non supporté. Seules les images JPEG, PNG et WebP sont acceptées.',
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10 Mo
  if (photo.size > maxSize) {
    return { isValid: false, error: "La photo ne doit pas dépasser 10 Mo avant réduction." };
  }

  return { isValid: true };
}
