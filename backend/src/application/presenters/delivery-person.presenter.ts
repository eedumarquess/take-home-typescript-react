import type { DeliveryPerson } from '../../domain/delivery-persons/delivery-person';

export function toDeliveryPersonResponse(deliveryPerson: DeliveryPerson) {
  const props = deliveryPerson.toPrimitives();

  return {
    id: props.id,
    name: props.name,
    phone: props.phone.value,
    vehicleType: props.vehicleType,
    isActive: props.isActive,
    currentLatitude: props.currentLocation?.latitude ?? null,
    currentLongitude: props.currentLocation?.longitude ?? null,
    currentOrderId: props.currentOrderId,
  };
}
