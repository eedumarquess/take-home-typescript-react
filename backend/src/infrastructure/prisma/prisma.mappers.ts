import {
  OrderStatus,
  Prisma,
  type DeliveryPerson as PrismaDeliveryPerson,
  type Order as PrismaOrder,
  type OrderItem as PrismaOrderItem,
  type Product as PrismaProduct,
  ProductCategory,
  VehicleType,
} from '@prisma/client';
import { DeliveryPerson } from '../../domain/delivery-persons/delivery-person';
import { VehicleTypeValue } from '../../domain/delivery-persons/vehicle-type.enum';
import { Order } from '../../domain/orders/order';
import { OrderStatusValue } from '../../domain/orders/order-status.enum';
import { Product } from '../../domain/products/product';
import { ProductCategoryValue } from '../../domain/products/product-category.enum';
import { Coordinates } from '../../domain/shared/coordinates';
import { Money } from '../../domain/shared/money';
import { PhoneNumber } from '../../domain/shared/phone-number';

type OrderItemWithProduct = PrismaOrderItem & {
  product: Pick<PrismaProduct, 'id' | 'name'>;
};

export type PrismaOrderWithRelations = PrismaOrder & {
  deliveryPerson: PrismaDeliveryPerson | null;
  items: OrderItemWithProduct[];
};

export type PrismaDeliveryPersonWithCurrentOrder = PrismaDeliveryPerson & {
  orders: Array<{ id: string }>;
};

export const productCategoryToPrisma: Record<ProductCategoryValue, ProductCategory> = {
  [ProductCategoryValue.MEAL]: ProductCategory.MEAL,
  [ProductCategoryValue.DRINK]: ProductCategory.DRINK,
  [ProductCategoryValue.DESSERT]: ProductCategory.DESSERT,
  [ProductCategoryValue.SIDE]: ProductCategory.SIDE,
};

export const orderStatusToPrisma: Record<OrderStatusValue, OrderStatus> = {
  [OrderStatusValue.PENDING]: OrderStatus.PENDING,
  [OrderStatusValue.PREPARING]: OrderStatus.PREPARING,
  [OrderStatusValue.READY]: OrderStatus.READY,
  [OrderStatusValue.DELIVERING]: OrderStatus.DELIVERING,
  [OrderStatusValue.DELIVERED]: OrderStatus.DELIVERED,
  [OrderStatusValue.CANCELLED]: OrderStatus.CANCELLED,
};

export const vehicleTypeToPrisma: Record<VehicleTypeValue, VehicleType> = {
  [VehicleTypeValue.BICYCLE]: VehicleType.BICYCLE,
  [VehicleTypeValue.MOTORCYCLE]: VehicleType.MOTORCYCLE,
  [VehicleTypeValue.CAR]: VehicleType.CAR,
};

const productCategoryFromPrisma: Record<ProductCategory, ProductCategoryValue> = {
  [ProductCategory.MEAL]: ProductCategoryValue.MEAL,
  [ProductCategory.DRINK]: ProductCategoryValue.DRINK,
  [ProductCategory.DESSERT]: ProductCategoryValue.DESSERT,
  [ProductCategory.SIDE]: ProductCategoryValue.SIDE,
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

export function toProductDomain(product: PrismaProduct) {
  return Product.rehydrate({
    category: productCategoryFromPrisma[product.category],
    createdAt: product.createdAt,
    description: product.description,
    id: product.id,
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    name: product.name,
    preparationTime: product.preparationTime,
    price: Money.fromNumber(Number(product.price)),
    updatedAt: product.updatedAt,
  });
}

export function toOrderDomain(order: PrismaOrderWithRelations) {
  return Order.rehydrate({
    coordinates: new Coordinates(Number(order.latitude), Number(order.longitude)),
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveredAt: order.deliveredAt,
    deliveryAddress: order.deliveryAddress,
    deliveryPerson: order.deliveryPerson
      ? {
          id: order.deliveryPerson.id,
          name: order.deliveryPerson.name,
          phone: order.deliveryPerson.phone,
          vehicleType: vehicleTypeFromPrisma[order.deliveryPerson.vehicleType],
        }
      : null,
    deliveryPersonId: order.deliveryPersonId,
    id: order.id,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: Money.fromNumber(Number(item.unitPrice)),
    })),
    status: orderStatusFromPrisma[order.status],
    totalAmount: Money.fromNumber(Number(order.totalAmount)),
    updatedAt: order.updatedAt,
  });
}

export function toDeliveryPersonDomain(deliveryPerson: PrismaDeliveryPersonWithCurrentOrder) {
  return DeliveryPerson.rehydrate({
    currentLocation:
      deliveryPerson.currentLatitude === null || deliveryPerson.currentLongitude === null
        ? null
        : new Coordinates(
            Number(deliveryPerson.currentLatitude),
            Number(deliveryPerson.currentLongitude),
          ),
    currentOrderId: deliveryPerson.orders[0]?.id ?? null,
    id: deliveryPerson.id,
    isActive: deliveryPerson.isActive,
    name: deliveryPerson.name,
    phone: new PhoneNumber(deliveryPerson.phone),
    vehicleType: vehicleTypeFromPrisma[deliveryPerson.vehicleType],
  });
}

export function toDecimal(value: number) {
  return new Prisma.Decimal(value);
}
