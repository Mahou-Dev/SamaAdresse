import geoGridData from '../data/geo-grid.json';

export interface GeoZone {
  code: string;
  name: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface GeoQuartier {
  code: string;
  name: string;
  zoneCode: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export const ZONES: GeoZone[] = geoGridData.zones;
export const QUARTIERS: GeoQuartier[] = geoGridData.quartiers;

export const ZONE_NAMES: Record<string, string> = Object.fromEntries(
  ZONES.map((z) => [z.code.toUpperCase(), z.name])
);

export const QUARTIER_NAMES: Record<string, string> = Object.fromEntries(
  QUARTIERS.map((q) => [q.code.toUpperCase(), q.name])
);

/**
 * Retourne le nom de la zone (ex: ZIG -> Ziguinchor, DKR -> Dakar)
 */
export function getZoneName(zoneCode?: string | null): string {
  if (!zoneCode) return 'Sénégal';
  const upper = zoneCode.toUpperCase();
  return ZONE_NAMES[upper] || upper;
}

/**
 * Retourne le nom officiel du quartier issu de geo-grid.json (ex: KBG -> Boucotte - Kangourou)
 */
export function getQuartierName(quartierCode?: string | null, zoneCode?: string | null): string {
  if (!quartierCode) return '';
  const upper = quartierCode.toUpperCase();
  if (zoneCode) {
    const match = QUARTIERS.find(
      (q) => q.code.toUpperCase() === upper && q.zoneCode.toUpperCase() === zoneCode.toUpperCase()
    );
    if (match) return match.name;
  }
  return QUARTIER_NAMES[upper] || upper;
}
