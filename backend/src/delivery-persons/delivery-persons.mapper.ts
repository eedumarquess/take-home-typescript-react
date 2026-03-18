import type { DeliveryPerson, Order } from '@prisma/client';
import { VehicleType } from '@prisma/client';
import { VehicleTypeValue } from '../common/enums/vehicle-type.enum';

export type DeliveryPersonWithCurrentOrder = DeliveryPerson & {
  orders: Array<Pick<Order, 'id'>>;
};

export type DeliveryPersonResponse = {
  id: string;
  name: string;
  phone: string;
  vehicleType: VehicleTypeValue;
  isActive: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentOrderId: string | null;
};

export const vehicleTypeToPrisma: Record<VehicleTypeValue, VehicleType> = {
  [VehicleTypeValue.BICYCLE]: VehicleType.BICYCLE,
  [VehicleTypeValue.MOTORCYCLE]: VehicleType.MOTORCYCLE,
  [VehicleTypeValue.CAR]: VehicleType.CAR,
};

const vehicleTypeFromPrisma: Record<VehicleType, VehicleTypeValue> = {
  [VehicleType.BICYCLE]: VehicleTypeValue.BICYCLE,
  [VehicleType.MOTORCYCLE]: VehicleTypeValue.MOTORCYCLE,
  [VehicleType.CAR]: VehicleTypeValue.CAR,
};

export function toDeliveryPersonResponse(
  deliveryPerson: DeliveryPersonWithCurrentOrder,
): DeliveryPersonResponse {
  return {
    id: deliveryPerson.id,
    name: deliveryPerson.name,
    phone: deliveryPerson.phone,
    vehicleType: vehicleTypeFromPrisma[deliveryPerson.vehicleType],
    isActive: deliveryPerson.isActive,
    currentLatitude:
      deliveryPerson.currentLatitude === null ? null : Number(deliveryPerson.currentLatitude),
    currentLongitude:
      deliveryPerson.currentLongitude === null ? null : Number(deliveryPerson.currentLongitude),
    currentOrderId: deliveryPerson.orders[0]?.id ?? null,
  };
}
