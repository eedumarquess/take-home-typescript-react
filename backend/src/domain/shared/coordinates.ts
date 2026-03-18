import { DomainError } from './domain-error';

export class Coordinates {
  constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new DomainError('Latitude invalida', 'INVALID_LATITUDE');
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new DomainError('Longitude invalida', 'INVALID_LONGITUDE');
    }
  }

  haversineDistanceTo(other: Coordinates) {
    const earthRadiusKm = 6371;
    const latitudeDelta = toRadians(other.latitude - this.latitude);
    const longitudeDelta = toRadians(other.longitude - this.longitude);
    const startLatitudeRadians = toRadians(this.latitude);
    const endLatitudeRadians = toRadians(other.latitude);

    const haversineValue =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(startLatitudeRadians) *
        Math.cos(endLatitudeRadians) *
        Math.sin(longitudeDelta / 2) ** 2;

    return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversineValue));
  }
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
