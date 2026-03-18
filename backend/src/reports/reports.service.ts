import { Injectable } from '@nestjs/common';
import { OrderStatus, VehicleType } from '@prisma/client';
import { OrderStatusValue } from '../common/enums/order-status.enum';
import { VehicleTypeValue } from '../common/enums/vehicle-type.enum';
import type { ReportDateRangeQueryDto } from './dto/report-date-range-query.dto';
import type { TopProductsReportQueryDto } from './dto/top-products-report-query.dto';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getRevenue(query: ReportDateRangeQueryDto) {
    const orders = await this.reportsRepository.findDeliveredOrdersForRevenue(query);
    const dailyRevenueMap = new Map<string, { orders: number; revenue: number }>();
    let totalRevenue = 0;

    for (const order of orders) {
      if (!order.deliveredAt) {
        continue;
      }

      const deliveredDate = toIsoDate(order.deliveredAt);
      const revenue = Number(order.totalAmount);
      const currentDay = dailyRevenueMap.get(deliveredDate) ?? { orders: 0, revenue: 0 };

      currentDay.orders += 1;
      currentDay.revenue += revenue;
      dailyRevenueMap.set(deliveredDate, currentDay);
      totalRevenue += revenue;
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

  async getOrdersByStatus(query: ReportDateRangeQueryDto) {
    const orders = await this.reportsRepository.findOrdersForStatusBreakdown(query);
    const counts = new Map<OrderStatus, number>();

    for (const order of orders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }

    return {
      data: orderedStatuses.map((status) => ({
        count: counts.get(status) ?? 0,
        status: orderStatusFromPrisma[status],
      })),
      total: orders.length,
    };
  }

  async getTopProducts(query: TopProductsReportQueryDto) {
    const items = await this.reportsRepository.findDeliveredOrderItems(query);
    const totals = new Map<
      string,
      { productId: string; productName: string; totalQuantity: number; totalRevenue: number }
    >();

    for (const item of items) {
      const current = totals.get(item.product.id) ?? {
        productId: item.product.id,
        productName: item.product.name,
        totalQuantity: 0,
        totalRevenue: 0,
      };

      current.totalQuantity += item.quantity;
      current.totalRevenue += item.quantity * Number(item.unitPrice);
      totals.set(item.product.id, current);
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

  async getAverageDeliveryTime(query: ReportDateRangeQueryDto) {
    const orders = await this.reportsRepository.findDeliveredOrdersForDeliveryTime(query);
    const durations = orders
      .filter((order) => order.deliveredAt !== null)
      .map((order) => ({
        durationMinutes: differenceInMinutes(order.createdAt, order.deliveredAt as Date),
        vehicleType: order.deliveryPerson?.vehicleType ?? null,
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

    const vehicleTypeMap = new Map<VehicleType, { count: number; totalMinutes: number }>();
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
        vehicleType: vehicleTypeFromPrisma[vehicleType],
      })),
      fastestMinutes: roundMetric(Math.min(...deliveryTimes)),
      slowestMinutes: roundMetric(Math.max(...deliveryTimes)),
      totalDelivered: durations.length,
    };
  }
}

const orderedStatuses: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

const orderStatusFromPrisma: Record<OrderStatus, OrderStatusValue> = {
  [OrderStatus.PENDING]: OrderStatusValue.PENDING,
  [OrderStatus.PREPARING]: OrderStatusValue.PREPARING,
  [OrderStatus.READY]: OrderStatusValue.READY,
  [OrderStatus.DELIVERING]: OrderStatusValue.DELIVERING,
  [OrderStatus.DELIVERED]: OrderStatusValue.DELIVERED,
  [OrderStatus.CANCELLED]: OrderStatusValue.CANCELLED,
};

const vehicleTypeFromPrisma: Record<VehicleType, VehicleTypeValue> = {
  [VehicleType.BICYCLE]: VehicleTypeValue.BICYCLE,
  [VehicleType.MOTORCYCLE]: VehicleTypeValue.MOTORCYCLE,
  [VehicleType.CAR]: VehicleTypeValue.CAR,
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function differenceInMinutes(startDate: Date, endDate: Date) {
  return (endDate.getTime() - startDate.getTime()) / 60000;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}
