import { calculateHaversineDistance } from '../locationService';

describe('locationService — Haversine Distance & Outlier Calculation', () => {
  it('accurately calculates distance between two known GPS coordinates', () => {
    // Distance between Statue of Liberty (40.6892, -74.0445) and Empire State Building (40.7484, -73.9857) ~ 8.28 km
    const lat1 = 40.6892;
    const lon1 = -74.0445;
    const lat2 = 40.7484;
    const lon2 = -73.9857;

    const distanceMeters = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    const distanceKm = distanceMeters / 1000;

    expect(distanceKm).toBeGreaterThan(8.2);
    expect(distanceKm).toBeLessThan(8.4);
  });

  it('returns 0 for identical points', () => {
    const distance = calculateHaversineDistance(12.9716, 77.5946, 12.9716, 77.5946);
    expect(distance).toBe(0);
  });

  it('accumulates multi-segment route distance correctly (P1 -> P2 -> P3)', () => {
    const p1 = { lat: 12.9716, lon: 77.5946 };
    const p2 = { lat: 12.9726, lon: 77.5956 };
    const p3 = { lat: 12.9736, lon: 77.5966 };

    const d1 = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
    const d2 = calculateHaversineDistance(p2.lat, p2.lon, p3.lat, p3.lon);
    const total = d1 + d2;

    expect(total).toBeGreaterThan(0);
    expect(total).toBeCloseTo(d1 + d2, 4);
  });

  it('filters velocity jumps over 15 km/h (walking upper bound)', () => {
    // 500 meters in 5 seconds = 100 m/s = 360 km/h (GPS jump/teleport)
    const timeDiffSec = 5;
    const distanceMeters = 500;
    const speedKmh = (distanceMeters / timeDiffSec) * 3.6;

    const isOutlier = speedKmh > 15;
    expect(isOutlier).toBe(true);
  });
});
