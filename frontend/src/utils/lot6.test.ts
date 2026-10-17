import { describe, it, expect } from 'vitest';
import { formatDistance, formatDuration } from '../pages/PublicAddressPage';

describe('Lot 6 — Tests unitaires', () => {
  describe('formatDistance', () => {
    it('formate correctement les distances inférieures à 1 km', () => {
      expect(formatDistance(50)).toBe('50 m');
      expect(formatDistance(350)).toBe('350 m');
      expect(formatDistance(999)).toBe('999 m');
    });

    it('formate correctement les distances supérieures ou égales à 1 km avec virgule', () => {
      expect(formatDistance(1000)).toBe('1,0 km');
      expect(formatDistance(2340)).toBe('2,3 km');
      expect(formatDistance(15600)).toBe('15,6 km');
    });
  });

  describe('formatDuration', () => {
    it('formate correctement les durées inférieures à 1 minute en 1 min minimum', () => {
      expect(formatDuration(15)).toBe('1 min');
      expect(formatDuration(45)).toBe('1 min');
    });

    it('formate correctement les durées en minutes', () => {
      expect(formatDuration(480)).toBe('8 min');
      expect(formatDuration(1500)).toBe('25 min');
    });

    it('formate correctement les durées avec heures et minutes', () => {
      expect(formatDuration(3600)).toBe('1 h');
      expect(formatDuration(3720)).toBe('1 h 2 min');
      expect(formatDuration(7200)).toBe('2 h');
      expect(formatDuration(7500)).toBe('2 h 5 min');
    });
  });

  describe('Transformation GeoJSON vers Leaflet', () => {
    it('convertit les coordonnées [lon, lat] en [lat, lon]', () => {
      const geoJsonCoords: [number, number][] = [
        [-16.2719, 12.5783],
        [-16.2750, 12.5800],
        [-16.2800, 12.5850],
      ];

      const leafletCoords = geoJsonCoords.map(([lon, lat]) => [lat, lon]);

      expect(leafletCoords).toEqual([
        [12.5783, -16.2719],
        [12.5800, -16.2750],
        [12.5850, -16.2800],
      ]);
    });
  });
});
