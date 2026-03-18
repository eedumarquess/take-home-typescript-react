import { OrderStatus, type Prisma } from '@prisma/client';

export function buildDeliveryPersonAvailabilityWhere(
  available?: boolean,
  isActive?: boolean,
): Prisma.DeliveryPersonWhereInput {
  if (available === true) {
    return {
      isActive,
      orders: {
        none: {
          status: OrderStatus.DELIVERING,
        },
      },
    };
  }

  if (available === false) {
    return {
      isActive,
      orders: {
        some: {
          status: OrderStatus.DELIVERING,
        },
      },
    };
  }

  return {
    isActive,
  };
}

export function hasDeliveringOrder(deliveryPerson: { orders: Array<{ id: string }> }) {
  return deliveryPerson.orders.length > 0;
}
