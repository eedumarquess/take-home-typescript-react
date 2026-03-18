import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import type { IAnalyticsRepository } from '../../domain/reports/analytics.repository';
import { PrismaService } from '../../prisma/prisma.service';

type DateScopedQuery = { startDate?: string; endDate?: string };

@Injectable()
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findDeliveredOrdersForRevenue(query: DateScopedQuery) {
    const orders = await this.prismaService.order.findMany({
      orderBy: {
        deliveredAt: Prisma.SortOrder.asc,
      },
      select: {
        deliveredAt: true,
        totalAmount: true,
      },
      where: {
        deliveredAt: buildDateRangeFilter(query),
        status: OrderStatus.DELIVERED,
      },
    });

    return orders.map((order) => ({
      deliveredAt: order.deliveredAt,
      totalAmount: Number(order.totalAmount),
    }));
  }

  findOrdersForStatusBreakdown(query: DateScopedQuery) {
    return this.prismaService.order
      .findMany({
        orderBy: {
          createdAt: Prisma.SortOrder.asc,
        },
        select: {
          status: true,
        },
        where: {
          createdAt: buildRequiredDateRangeFilter(query),
        },
      })
      .then((orders) =>
        orders.map((order) => ({
          status: order.status.toLowerCase(),
        })),
      );
  }

  findDeliveredOrderItems(query: DateScopedQuery & { limit: number }) {
    return this.prismaService.orderItem
      .findMany({
        select: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          quantity: true,
          unitPrice: true,
        },
        where: {
          order: {
            deliveredAt: buildDateRangeFilter(query),
            status: OrderStatus.DELIVERED,
          },
        },
      })
      .then((items) =>
        items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      );
  }

  findDeliveredOrdersForDeliveryTime(query: DateScopedQuery) {
    return this.prismaService.order
      .findMany({
        orderBy: {
          deliveredAt: Prisma.SortOrder.asc,
        },
        select: {
          createdAt: true,
          deliveredAt: true,
          deliveryPerson: {
            select: {
              vehicleType: true,
            },
          },
        },
        where: {
          deliveredAt: buildDateRangeFilter(query),
          status: OrderStatus.DELIVERED,
        },
      })
      .then((orders) =>
        orders.map((order) => ({
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
          vehicleType: order.deliveryPerson?.vehicleType.toLowerCase() ?? null,
        })),
      );
  }
}

function buildDateRangeFilter(query: DateScopedQuery): Prisma.DateTimeNullableFilter | undefined {
  const filter: Prisma.DateTimeNullableFilter = {};

  if (query.startDate) {
    filter.gte = new Date(`${query.startDate}T00:00:00.000Z`);
  }

  if (query.endDate) {
    const endDate = new Date(`${query.endDate}T00:00:00.000Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    filter.lt = endDate;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

function buildRequiredDateRangeFilter(query: DateScopedQuery): Prisma.DateTimeFilter | undefined {
  const filter: Prisma.DateTimeFilter = {};

  if (query.startDate) {
    filter.gte = new Date(`${query.startDate}T00:00:00.000Z`);
  }

  if (query.endDate) {
    const endDate = new Date(`${query.endDate}T00:00:00.000Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    filter.lt = endDate;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}
