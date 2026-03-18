import { SortOrder } from '../../common/enums/sort-order.enum';
import type { Product } from '../products/product';
import type { Coordinates } from '../shared/coordinates';
import type { Order } from './order';
import type { OrderStatusValue } from './order-status.enum';

export type ListOrdersQuery = {
  page: number;
  limit: number;
  status?: OrderStatusValue;
  startDate?: string;
  endDate?: string;
  sortBy: 'createdAt' | 'totalAmount';
  sortOrder: SortOrder;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  coordinates: Coordinates;
};

export type DeliveryPersonAvailability = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  vehicleType: string;
  currentOrderId: string | null;
};

export type OptimizationOrderCandidate = {
  id: string;
  deliveryAddress: string;
  coordinates: Coordinates;
  createdAt: Date;
};

export interface IOrderRepository {
  findMany(query: ListOrdersQuery): Promise<Order[]>;
  count(query: ListOrdersQuery): Promise<number>;
  findById(id: string): Promise<Order | null>;
  findProductsByIds(productIds: string[]): Promise<Product[]>;
  findDeliveryPersonAvailabilityById(id: string): Promise<DeliveryPersonAvailability | null>;
  create(input: CreateOrderInput): Promise<Order>;
  updateStatus(input: {
    id: string;
    expectedUpdatedAt: Date;
    status: OrderStatusValue;
    deliveredAt: Date | null;
    occurredAt: Date;
  }): Promise<Order>;
  assignDeliveryPerson(input: {
    orderId: string;
    deliveryPersonId: string;
    expectedUpdatedAt: Date;
  }): Promise<Order>;
  findReadyOrders(): Promise<OptimizationOrderCandidate[]>;
}
