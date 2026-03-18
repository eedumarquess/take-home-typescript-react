import { Injectable } from '@nestjs/common';
import { OrderStatusValue } from '../../domain/orders/order-status.enum';
import type { IAnalyticsRepository } from '../../domain/reports/analytics.repository';

const orderedStatuses: OrderStatusValue[] = [
  OrderStatusValue.PENDING,
  OrderStatusValue.PREPARING,
  OrderStatusValue.READY,
  OrderStatusValue.DELIVERING,
  OrderStatusValue.DELIVERED,
  OrderStatusValue.CANCELLED,
];

@Injectable()
export class GetRevenueByPeriodUseCase {
  constructor(private readonly analyticsRepository: IAnalyticsRepository) {}

  async execute(query: { startDate?: string; endDate?: string }) {
    const summary = await this.analyticsRepository.getRevenueSummary(query);

    return {
      averageOrderValue:
        summary.totalOrders === 0 ? 0 : roundMetric(summary.totalRevenue / summary.totalOrders),
      dailyRevenue: summary.dailyRevenue.map((entry) => ({
        ...entry,
        revenue: roundMetric(entry.revenue),
      })),
      endDate: summary.endDate,
      startDate: summary.startDate,
      totalOrders: summary.totalOrders,
      totalRevenue: roundMetric(summary.totalRevenue),
    };
  }
}

@Injectable()
export class GetOrdersByStatusUseCase {
  constructor(private readonly analyticsRepository: IAnalyticsRepository) {}

  async execute(query: { startDate?: string; endDate?: string }) {
    const summary = await this.analyticsRepository.getOrdersByStatus(query);
    const counts = new Map(summary.rows.map((row) => [row.status, row.count]));

    return {
      data: orderedStatuses.map((status) => ({
        count: counts.get(status) ?? 0,
        status,
      })),
      endDate: summary.endDate,
      startDate: summary.startDate,
      total: summary.total,
    };
  }
}

@Injectable()
export class GetTopProductsUseCase {
  constructor(private readonly analyticsRepository: IAnalyticsRepository) {}

  async execute(query: { startDate?: string; endDate?: string; limit: number }) {
    const items = await this.analyticsRepository.getTopProducts(query);

    return {
      data: items.map((product) => ({
        ...product,
        totalRevenue: roundMetric(product.totalRevenue),
      })),
    };
  }
}

@Injectable()
export class GetAverageDeliveryTimeUseCase {
  constructor(private readonly analyticsRepository: IAnalyticsRepository) {}

  async execute(query: { startDate?: string; endDate?: string }) {
    const summary = await this.analyticsRepository.getAverageDeliveryTimeSummary(query);

    return {
      averageMinutes: roundMetric(summary.averageMinutes),
      byVehicleType: summary.byVehicleType.map((entry) => ({
        ...entry,
        averageMinutes: roundMetric(entry.averageMinutes),
      })),
      endDate: summary.endDate,
      fastestMinutes: roundMetric(summary.fastestMinutes),
      slowestMinutes: roundMetric(summary.slowestMinutes),
      startDate: summary.startDate,
      totalDelivered: summary.totalDelivered,
    };
  }
}

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}
