import { Coordinates } from './coordinates';

describe('Coordinates', () => {
  it('calculates haversine distance in kilometers', () => {
    expect(
      new Coordinates(-23.5505, -46.6333).haversineDistanceTo(new Coordinates(-23.5505, -46.6333)),
    ).toBeCloseTo(0, 5);
    expect(
      new Coordinates(-23.5505, -46.6333).haversineDistanceTo(new Coordinates(-23.5614, -46.6566)),
    ).toBeGreaterThan(2);
  });
});
