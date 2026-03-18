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
    const orders = await this.analyticsRepository.findDeliveredOrdersForRevenue(query);
    const dailyRevenueMap = new Map<string, { orders: number; revenue: number }>();
    let totalRevenue = 0;

    for (const order of orders) {
      if (!order.deliveredAt) {
        continue;
      }

      const deliveredDate = order.deliveredAt.toISOString().slice(0, 10);
      const currentDay = dailyRevenueMap.get(deliveredDate) ?? { orders: 0, revenue: 0 };

      currentDay.orders += 1;
      currentDay.revenue += order.totalAmount;
      dailyRevenueMap.set(deliveredDate, currentDay);
      totalRevenue += order.totalAmount;
    }

    const dailyRevenue = [...dailyRevenueMap.entries()].map(([date, values]) => ({
      date,
      orders: values.orders,
      revenue: roundMetric(values.revenue),
    }));
    const totalOrders = orders.length;

    return {
      averageOrderValue: totalOrders === 0 ? 0 : roundMetric(totalRevenue / totalOrders),
      dailyRevenue,
      endDate: query.endDate ?? dailyRevenue.at(-1)?.date ?? null,
      startDate: query.startDate ?? dailyRevenue[0]?.date ?? null,
      totalOrders,
      totalRevenue: roundMetric(totalRevenue),
    };
  }
}

@Injectable()
export class GetOrdersByStatusUseCase {
  constructor(private readonly analyticsRepository: IAnalyticsRepository) {}

  async execute(query: { startDate?: string; endDate?: string }) {
    const orders = await this.analyticsRepository.findOrdersForStatusBreakdown(query);
    const counts = new Map<string, number>();

    for (const order of orders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }

    return {
      data: orderedStatuses.map((status) => ({
        count: counts.get(status) ?? 0,
        status,
      })),
      total: orders.length,
    };
  }
}

@Injectable()
export class GetTopProductsUseCase {
  constructor(private readonly analyticsRepository: IAnalyticsRepository) {}

  async execute(query: { startDate?: string; endDate?: string; limit: number }) {
    const items = await this.analyticsRepository.findDeliveredOrderItems(query);
    const totals = new Map<
      string,
      { productId: string; productName: string; totalQuantity: number; totalRevenue: number }
    >();

    for (const item of items) {
      const current = totals.get(item.productId) ?? {
        productId: item.productId,
        productName: item.productName,
        totalQuantity: 0,
        totalRevenue: 0,
      };

      current.totalQuantity += item.quantity;
      current.totalRevenue += item.quantity * item.unitPrice;
      totals.set(item.productId, current);
    }

    return {
      data: [...totals.values()]
        .sort(
          (left, right) =>
            right.totalQuantity - left.totalQuantity ||
            right.totalRevenue - left.totalRevenue ||
            left.productName.localeCompare(right.productName),
        )
        .slice(0, query.limit)
        .map((product) => ({
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
    const orders = await this.analyticsRepository.findDeliveredOrdersForDeliveryTime(query);
    const durations = orders
      .filter((order) => order.deliveredAt !== null)
      .map((order) => ({
        durationMinutes:
          ((order.deliveredAt as Date).getTime() - order.createdAt.getTime()) / 60000,
        vehicleType: order.vehicleType,
      }));

    if (durations.length === 0) {
      return {
        averageMinutes: 0,
        byVehicleType: [],
        fastestMinutes: 0,
        slowestMinutes: 0,
        totalDelivered: 0,
      };
    }

    const vehicleTypeMap = new Map<string, { count: number; totalMinutes: number }>();
    const deliveryTimes = durations.map((entry) => entry.durationMinutes);

    for (const entry of durations) {
      if (!entry.vehicleType) {
        continue;
      }

      const current = vehicleTypeMap.get(entry.vehicleType) ?? { count: 0, totalMinutes: 0 };
      current.count += 1;
      current.totalMinutes += entry.durationMinutes;
      vehicleTypeMap.set(entry.vehicleType, current);
    }

    return {
      averageMinutes: roundMetric(average(deliveryTimes)),
      byVehicleType: [...vehicleTypeMap.entries()].map(([vehicleType, values]) => ({
        averageMinutes: roundMetric(values.totalMinutes / values.count),
        count: values.count,
        vehicleType,
      })),
      fastestMinutes: roundMetric(Math.min(...deliveryTimes)),
      slowestMinutes: roundMetric(Math.max(...deliveryTimes)),
      totalDelivered: durations.length,
    };
  }
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}
