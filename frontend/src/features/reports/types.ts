import type { OrderStatus } from '../orders/types';

export type ReportDateRangeQuery = {
  startDate?: string;
  endDate?: string;
};

export type RevenueReport = {
  startDate: string | null;
  endDate: string | null;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
};

export type OrdersByStatusReport = {
  data: Array<{
    status: OrderStatus;
    count: number;
  }>;
  total: number;
};

export type TopProductsReport = {
  data: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
};

export type AverageDeliveryTimeReport = {
  averageMinutes: number;
  fastestMinutes: number;
  slowestMinutes: number;
  totalDelivered: number;
  byVehicleType: Array<{
    vehicleType: 'bicycle' | 'motorcycle' | 'car';
    averageMinutes: number;
    count: number;
  }>;
};
