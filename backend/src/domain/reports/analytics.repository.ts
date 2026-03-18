export type RevenueOrderRecord = {
  deliveredAt: Date | null;
  totalAmount: number;
};

export type OrdersByStatusRecord = {
  status: string;
};

export type TopProductRecord = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type DeliveryTimeRecord = {
  createdAt: Date;
  deliveredAt: Date | null;
  vehicleType: string | null;
};

export interface IAnalyticsRepository {
  findDeliveredOrdersForRevenue(query: {
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueOrderRecord[]>;
  findOrdersForStatusBreakdown(query: {
    startDate?: string;
    endDate?: string;
  }): Promise<OrdersByStatusRecord[]>;
  findDeliveredOrderItems(query: {
    startDate?: string;
    endDate?: string;
    limit: number;
  }): Promise<TopProductRecord[]>;
  findDeliveredOrdersForDeliveryTime(query: {
    startDate?: string;
    endDate?: string;
  }): Promise<DeliveryTimeRecord[]>;
}
