import geoGridJson from '../data/geo-grid.json';

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

export interface GeoGridData {
  zones: GeoZone[];
  quartiers: GeoQuartier[];
}

const DEFAULT_FALLBACK_MAX_DISTANCE_KM = 3.0;

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return R * c;
}

function contains(box: { latMin: number; latMax: number; lonMin: number; lonMax: number }, lat: number, lon: number): boolean {
  return lat >= box.latMin && lat <= box.latMax && lon >= box.lonMin && lon <= box.lonMax;
}

export function validatePlausibleSenegalCoordinates(lat: number, lon: number): void {
  if (lat < 12.0 || lat > 17.0 || lon < -17.6 || lon > -11.0) {
    throw new Error('Coordonnées géographiques hors de la plage plausible du Sénégal (12-17°N, -17/-11°O)');
  }
}

export function resolveQuartier(
  lat: number,
  lon: number,
  fallbackMaxDistanceKm: number = DEFAULT_FALLBACK_MAX_DISTANCE_KM,
  gridData: GeoGridData = geoGridJson as GeoGridData
): GeoQuartier {
  validatePlausibleSenegalCoordinates(lat, lon);

  // (a) Recherche de la zone englobante
  const matchingZone = gridData.zones.find((z) => contains(z, lat, lon));
  if (!matchingZone) {
    throw new Error('Coordonnées hors zone couverte');
  }

  // (b) Recherche des quartiers de cette zone contenant le point
  const candidates = gridData.quartiers.filter(
    (q) => q.zoneCode.toUpperCase() === matchingZone.code.toUpperCase() && contains(q, lat, lon)
  );

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    return findClosestQuartierByCenter(candidates, lat, lon);
  }

  // (c) Dans la zone mais aucun quartier : fallback par proximité
  const zoneQuartiers = gridData.quartiers.filter(
    (q) => q.zoneCode.toUpperCase() === matchingZone.code.toUpperCase()
  );

  if (zoneQuartiers.length === 0) {
    throw new Error('Coordonnées hors zone couverte');
  }

  let closest: GeoQuartier | null = null;
  let minDistanceKm = Number.MAX_VALUE;

  for (const q of zoneQuartiers) {
    const centerLat = (q.latMin + q.latMax) / 2.0;
    const centerLon = (q.lonMin + q.lonMax) / 2.0;
    const dist = haversineDistanceKm(lat, lon, centerLat, centerLon);

    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      closest = q;
    }
  }

  if (closest && minDistanceKm <= fallbackMaxDistanceKm) {
    return closest;
  }

  throw new Error('Coordonnées hors zone couverte');
}

function findClosestQuartierByCenter(candidates: GeoQuartier[], lat: number, lon: number): GeoQuartier {
  let best = candidates[0];
  let minDistanceKm = Number.MAX_VALUE;

  for (const candidate of candidates) {
    const centerLat = (candidate.latMin + candidate.latMax) / 2.0;
    const centerLon = (candidate.lonMin + candidate.lonMax) / 2.0;
    const dist = haversineDistanceKm(lat, lon, centerLat, centerLon);

    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      best = candidate;
    }
  }

  return best;
}

export function getAllZones(gridData: GeoGridData = geoGridJson as GeoGridData): GeoZone[] {
  return gridData.zones;
}

export function getAllQuartiers(gridData: GeoGridData = geoGridJson as GeoGridData): GeoQuartier[] {
  return gridData.quartiers;
}

export function getZoneName(zoneCode?: string, gridData: GeoGridData = geoGridJson as GeoGridData): string {
  if (!zoneCode) return '';
  const zone = gridData.zones.find((z) => z.code.toUpperCase() === zoneCode.toUpperCase());
  return zone ? zone.name : zoneCode;
}

export function getQuartierName(
  quartierCode?: string,
  zoneCode?: string,
  gridData: GeoGridData = geoGridJson as GeoGridData
): string {
  if (!quartierCode) return '';
  const q = gridData.quartiers.find(
    (item) =>
      item.code.toUpperCase() === quartierCode.toUpperCase() &&
      (!zoneCode || item.zoneCode.toUpperCase() === zoneCode.toUpperCase())
  );
  return q ? q.name : quartierCode;
}

