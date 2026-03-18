export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type OptimizationAssignment = {
  orderId: string;
  deliveryPersonId: string;
  estimatedDistanceKm: number;
  orderAddress: string;
  deliveryPersonName: string;
};

export type OptimizationUnassignedOrder = {
  orderId: string;
  orderAddress: string;
  reason: string;
};

export type OptimizationResult = {
  assignments: OptimizationAssignment[];
  unassigned: OptimizationUnassignedOrder[];
  totalDistanceKm: number;
  algorithm: 'hungarian';
  executionTimeMs: number;
};

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: OrderStatus;
  totalAmount: number;
  deliveryPerson: {
    id: string;
    name: string;
    phone: string;
    vehicleType: 'bicycle' | 'motorcycle' | 'car';
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
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderListResponse = {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type OrderListQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};
