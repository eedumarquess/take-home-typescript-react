import type { Coordinates } from '../shared/coordinates';
import type { DeliveryPerson } from './delivery-person';
import type { VehicleTypeValue } from './vehicle-type.enum';

export type ListDeliveryPersonsQuery = {
  available?: boolean;
  isActive?: boolean;
};

export type SaveDeliveryPersonInput = {
  name: string;
  phone: string;
  vehicleType: VehicleTypeValue;
  isActive: boolean;
  currentLocation: Coordinates | null;
};

export interface IDeliveryPersonRepository {
  findMany(query: ListDeliveryPersonsQuery): Promise<DeliveryPerson[]>;
  findById(id: string): Promise<DeliveryPerson | null>;
  create(input: SaveDeliveryPersonInput): Promise<DeliveryPerson>;
  update(id: string, input: SaveDeliveryPersonInput): Promise<DeliveryPerson>;
  delete(id: string): Promise<void>;
  findAvailable(): Promise<DeliveryPerson[]>;
}
