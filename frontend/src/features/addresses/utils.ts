import type { ReportReason } from '../../api/addressApi';

export const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'POSITION_INCORRECTE',
    label: 'Position GPS incorrecte',
    description: 'Le repère sur la carte ne correspond pas à l’entrée réelle du lieu.',
  },
  {
    value: 'CONTENU_INAPPROPRIE',
    label: 'Description inappropriée ou trompeuse',
    description: 'Le texte contient des informations erronées, offensantes ou hors sujet.',
  },
  {
    value: 'PHOTO_INAPPROPRIEE',
    label: 'Photo inappropriée ou sans rapport',
    description: 'La photo de façade ne correspond pas au lieu ou ne respecte pas les règles.',
  },
  {
    value: 'AUTRE',
    label: 'Autre motif',
    description: 'Tout autre problème nécessitant une vérification par la modération.',
  },
];

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} h ${remainingMinutes > 0 ? `${remainingMinutes} min` : ''}`.trim();
}

export function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function resolvePhotoSrc(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')) {
    return photoUrl;
  }
  return `${import.meta.env.VITE_API_BASE_URL || ''}${photoUrl}`;
}

export function readVisitedAddressCodes(): string[] {
  try {
    const raw = localStorage.getItem('visited_address_codes');
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}
