import { requestJson } from '../../services/api';
import type {
  CreateOrderInput,
  OptimizationResult,
  Order,
  OrderListQuery,
  OrderListResponse,
  OrderStatus,
} from './types';

export async function listOrders(query: OrderListQuery = {}) {
  return requestJson<OrderListResponse>(`/orders${buildQueryString(query)}`);
}

export async function getOrder(id: string) {
  return requestJson<Order>(`/orders/${id}`);
}

export async function createOrder(payload: CreateOrderInput) {
  return requestJson<Order>('/orders', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return requestJson<Order>(`/orders/${id}/status`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  });
}

export async function assignDeliveryPerson(id: string, deliveryPersonId: string) {
  return requestJson<Order>(`/orders/${id}/assign`, {
    body: JSON.stringify({ deliveryPersonId }),
    method: 'PATCH',
  });
}

export async function optimizeAssignment() {
  return requestJson<OptimizationResult>('/orders/optimize-assignment', {
    method: 'POST',
  });
}

function buildQueryString(query: OrderListQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') {
      continue;
    }

    params.set(key, String(value));
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : '';
}
