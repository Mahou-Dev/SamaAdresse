import { describe, it, expect } from 'vitest';
import { resolveQuartier, haversineDistanceKm, validatePlausibleSenegalCoordinates } from './geoGrid';
import fixturePoints from '../data/geo-grid-fixture.json';

interface FixturePoint {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  expectedStatus: 'RESOLVED' | 'OUT_OF_ZONE' | 'INVALID_COORDINATES';
  expectedZone: string | null;
  expectedQuartier: string | null;
  distanceToCenterKm: number | null;
}

describe('geoGrid.ts parity with backend GeoGridService', () => {
  it('should have at least 60 points in fixture', () => {
    expect((fixturePoints as FixturePoint[]).length).toBeGreaterThanOrEqual(60);
  });

  const points = fixturePoints as FixturePoint[];

  points.forEach((point) => {
    it(`Point ${point.id} (${point.description}) should match backend outcome: ${point.expectedStatus}`, () => {
      if (point.expectedStatus === 'INVALID_COORDINATES') {
        expect(() => {
          validatePlausibleSenegalCoordinates(point.latitude, point.longitude);
        }).toThrow(/hors de la plage plausible/);
      } else if (point.expectedStatus === 'OUT_OF_ZONE') {
        expect(() => {
          resolveQuartier(point.latitude, point.longitude);
        }).toThrow(/Coordonnées hors zone couverte/);
      } else if (point.expectedStatus === 'RESOLVED') {
        const result = resolveQuartier(point.latitude, point.longitude);
        expect(result.zoneCode).toBe(point.expectedZone);
        expect(result.code).toBe(point.expectedQuartier);

        // Distance check
        const centerLat = (result.latMin + result.latMax) / 2.0;
        const centerLon = (result.lonMin + result.lonMax) / 2.0;
        const dist = haversineDistanceKm(point.latitude, point.longitude, centerLat, centerLon);
        expect(Math.round(dist * 1000) / 1000).toBeCloseTo(point.distanceToCenterKm!, 2);
      }
    });
  });
});
