import type { Order } from '../../domain/orders/order';

export function toOrderResponse(order: Order) {
  const props = order.toPrimitives();

  return {
    id: props.id,
    customerName: props.customerName,
    customerPhone: props.customerPhone,
    deliveryAddress: props.deliveryAddress,
    latitude: props.coordinates.latitude,
    longitude: props.coordinates.longitude,
    status: props.status,
    totalAmount: props.totalAmount.toNumber(),
    deliveryPerson: props.deliveryPerson
      ? {
          id: props.deliveryPerson.id,
          name: props.deliveryPerson.name,
          phone: props.deliveryPerson.phone,
          vehicleType: props.deliveryPerson.vehicleType,
        }
      : null,
    items: props.items.map((item) => ({
      id: item.id,
      product: {
        id: item.productId,
        name: item.productName,
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
    })),
    deliveredAt: props.deliveredAt,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}
