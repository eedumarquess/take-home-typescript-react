import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ReportDateRangeQueryDto } from './dto/report-date-range-query.dto';
import type { TopProductsReportQueryDto } from './dto/top-products-report-query.dto';

type DateScopedQuery = ReportDateRangeQueryDto | TopProductsReportQueryDto;

export type RevenueOrderRecord = {
  deliveredAt: Date | null;
  totalAmount: Prisma.Decimal;
};

export type OrderStatusRecord = {
  status: OrderStatus;
};

export type TopProductRecord = {
  quantity: number;
  unitPrice: Prisma.Decimal;
  product: {
    id: string;
    name: string;
  };
};

export type DeliveryTimeRecord = {
  createdAt: Date;
  deliveredAt: Date | null;
  deliveryPerson: {
    vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'CAR';
  } | null;
};

@Injectable()
export class ReportsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findDeliveredOrdersForRevenue(query: ReportDateRangeQueryDto): Promise<RevenueOrderRecord[]> {
    return this.prismaService.order.findMany({
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
  }

  findOrdersForStatusBreakdown(query: ReportDateRangeQueryDto): Promise<OrderStatusRecord[]> {
    return this.prismaService.order.findMany({
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
      select: {
        status: true,
      },
      where: {
        createdAt: buildRequiredDateRangeFilter(query),
      },
    });
  }

  findDeliveredOrderItems(query: TopProductsReportQueryDto): Promise<TopProductRecord[]> {
    return this.prismaService.orderItem.findMany({
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
    });
  }

  findDeliveredOrdersForDeliveryTime(
    query: ReportDateRangeQueryDto,
  ): Promise<DeliveryTimeRecord[]> {
    return this.prismaService.order.findMany({
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
    });
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
