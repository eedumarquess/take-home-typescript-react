import { SortOrder } from '../../common/enums/sort-order.enum';
import type { Product } from '../products/product';
import type { Coordinates } from '../shared/coordinates';
import type { Money } from '../shared/money';
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
  coordinates: Coordinates;
  totalAmount: Money;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: Money;
  }>;
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
};

export interface IOrderRepository {
  findMany(query: ListOrdersQuery): Promise<Order[]>;
  count(query: ListOrdersQuery): Promise<number>;
  findById(id: string): Promise<Order | null>;
  findProductsByIds(productIds: string[]): Promise<Product[]>;
  findDeliveryPersonAvailabilityById(id: string): Promise<DeliveryPersonAvailability | null>;
  create(input: CreateOrderInput): Promise<Order>;
  updateStatus(id: string, status: OrderStatusValue, deliveredAt: Date | null): Promise<Order>;
  assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order>;
  findReadyOrders(): Promise<OptimizationOrderCandidate[]>;
}
