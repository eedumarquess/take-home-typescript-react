export type ReportDateWindow = {
  startDate: string | null;
  endDate: string | null;
};

export type RevenueSummaryRecord = ReportDateWindow & {
  dailyRevenue: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  totalOrders: number;
  totalRevenue: number;
};

export type OrdersByStatusRecord = ReportDateWindow & {
  total: number;
  rows: Array<{
    count: number;
    status: string;
  }>;
};

export type TopProductRecord = {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
};

export type DeliveryTimeSummaryRecord = ReportDateWindow & {
  averageMinutes: number;
  fastestMinutes: number;
  slowestMinutes: number;
  totalDelivered: number;
  byVehicleType: Array<{
    averageMinutes: number;
    count: number;
    vehicleType: string;
  }>;
};

export interface IAnalyticsRepository {
  getRevenueSummary(query: { startDate?: string; endDate?: string }): Promise<RevenueSummaryRecord>;
  getOrdersByStatus(query: { startDate?: string; endDate?: string }): Promise<OrdersByStatusRecord>;
  getTopProducts(query: {
    startDate?: string;
    endDate?: string;
    limit: number;
  }): Promise<TopProductRecord[]>;
  getAverageDeliveryTimeSummary(query: {
    startDate?: string;
    endDate?: string;
  }): Promise<DeliveryTimeSummaryRecord>;
}
