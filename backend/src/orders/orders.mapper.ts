import type { DeliveryPerson, Order, OrderItem, Product } from '@prisma/client';
import { OrderStatus, VehicleType } from '@prisma/client';
import { OrderStatusValue } from '../common/enums/order-status.enum';
import { VehicleTypeValue } from '../common/enums/vehicle-type.enum';

type OrderItemWithProductSummary = OrderItem & {
  product: Pick<Product, 'id' | 'name'>;
};

export type OrderWithRelations = Order & {
  deliveryPerson: DeliveryPerson | null;
  items: OrderItemWithProductSummary[];
};

export type OrderResponse = {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: OrderStatusValue;
  totalAmount: number;
  deliveryPerson: {
    id: string;
    name: string;
    phone: string;
    vehicleType: VehicleTypeValue;
  } | null;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const orderStatusToPrisma: Record<OrderStatusValue, OrderStatus> = {
  [OrderStatusValue.PENDING]: OrderStatus.PENDING,
  [OrderStatusValue.PREPARING]: OrderStatus.PREPARING,
  [OrderStatusValue.READY]: OrderStatus.READY,
  [OrderStatusValue.DELIVERING]: OrderStatus.DELIVERING,
  [OrderStatusValue.DELIVERED]: OrderStatus.DELIVERED,
  [OrderStatusValue.CANCELLED]: OrderStatus.CANCELLED,
};

const orderStatusFromPrisma: Record<OrderStatus, OrderStatusValue> = {
  [OrderStatus.PENDING]: OrderStatusValue.PENDING,
  [OrderStatus.PREPARING]: OrderStatusValue.PREPARING,
  [OrderStatus.READY]: OrderStatusValue.READY,
  [OrderStatus.DELIVERING]: OrderStatusValue.DELIVERING,
  [OrderStatus.DELIVERED]: OrderStatusValue.DELIVERED,
  [OrderStatus.CANCELLED]: OrderStatusValue.CANCELLED,
};

const vehicleTypeFromPrisma: Record<VehicleType, VehicleTypeValue> = {
  [VehicleType.BICYCLE]: VehicleTypeValue.BICYCLE,
  [VehicleType.MOTORCYCLE]: VehicleTypeValue.MOTORCYCLE,
  [VehicleType.CAR]: VehicleTypeValue.CAR,
};

export function toOrderResponse(order: OrderWithRelations): OrderResponse {
  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    latitude: Number(order.latitude),
    longitude: Number(order.longitude),
    status: orderStatusFromPrisma[order.status],
    totalAmount: Number(order.totalAmount),
    deliveryPerson: order.deliveryPerson
      ? {
          id: order.deliveryPerson.id,
          name: order.deliveryPerson.name,
          phone: order.deliveryPerson.phone,
          vehicleType: vehicleTypeFromPrisma[order.deliveryPerson.vehicleType],
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
      },
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
