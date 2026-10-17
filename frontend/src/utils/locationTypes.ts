import type { LocationType } from '../api/addressApi';

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  MAISON: 'Maison',
  COMMERCE: 'Commerce',
  INSTITUTION: 'Institution',
};

export const LOCATION_TYPES: { id: LocationType; label: string }[] = [
  { id: 'MAISON', label: 'Maison' },
  { id: 'COMMERCE', label: 'Commerce' },
  { id: 'INSTITUTION', label: 'Institution' },
];

export const getLocationTypeLabel = (type?: string | null): string => {
  if (!type) return '';
  const upper = type.toUpperCase() as LocationType;
  return LOCATION_TYPE_LABELS[upper] || type;
};
