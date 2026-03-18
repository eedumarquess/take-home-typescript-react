import { requestJson } from '../../services/api';
import { buildQueryString } from '../../services/query-string';
import type {
  AverageDeliveryTimeReport,
  OrdersByStatusReport,
  ReportDateRangeQuery,
  RevenueReport,
  TopProductsReport,
} from './types';

export async function getRevenueReport(query: ReportDateRangeQuery = {}) {
  return requestJson<RevenueReport>(`/reports/revenue${buildQueryString(query)}`);
}

export async function getOrdersByStatusReport(query: ReportDateRangeQuery = {}) {
  return requestJson<OrdersByStatusReport>(`/reports/orders-by-status${buildQueryString(query)}`);
}

export async function getTopProductsReport(query: ReportDateRangeQuery & { limit?: number } = {}) {
  return requestJson<TopProductsReport>(`/reports/top-products${buildQueryString(query)}`);
}

export async function getAverageDeliveryTimeReport(query: ReportDateRangeQuery = {}) {
  return requestJson<AverageDeliveryTimeReport>(
    `/reports/average-delivery-time${buildQueryString(query)}`,
  );
}
