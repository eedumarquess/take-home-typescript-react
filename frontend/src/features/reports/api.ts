import { requestJson } from '../../services/api';
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

function buildQueryString(query: Record<string, string | number | undefined>) {
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
