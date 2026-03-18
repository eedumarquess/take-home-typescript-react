import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { buildSaoPauloDayRange, formatSaoPauloDate } from '../../common/utils/sao-paulo-date.util';
import type {
  DeliveryTimeSummaryRecord,
  IAnalyticsRepository,
  OrdersByStatusRecord,
  RevenueSummaryRecord,
  TopProductRecord,
} from '../../domain/reports/analytics.repository';
import { PrismaService } from '../../prisma/prisma.service';

type DateScopedQuery = { startDate?: string; endDate?: string };

@Injectable()
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getRevenueSummary(query: DateScopedQuery): Promise<RevenueSummaryRecord> {
    const deliveredAtFilter = buildDateRangeFilter(query);
    const [aggregate, rows] = await Promise.all([
      this.prismaService.order.aggregate({
        _count: {
          _all: true,
        },
        _max: {
          deliveredAt: true,
        },
        _min: {
          deliveredAt: true,
        },
        _sum: {
          totalAmount: true,
        },
        where: {
          deliveredAt: deliveredAtFilter,
          status: OrderStatus.DELIVERED,
        },
      }),
      this.prismaService.$queryRaw<Array<{ date: string; orders: number; revenue: number }>>(
        Prisma.sql`
          SELECT
            TO_CHAR(TIMEZONE('America/Sao_Paulo', o.delivered_at), 'YYYY-MM-DD') AS "date",
            COUNT(*)::int AS "orders",
            COALESCE(SUM(o.total_amount), 0)::float8 AS "revenue"
          FROM orders o
          WHERE o.status = 'delivered'
          ${buildTimestampWhereClause('o.delivered_at', query)}
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ),
    ]);

    return {
      dailyRevenue: rows.map((row) => ({
        date: row.date,
        orders: Number(row.orders),
        revenue: Number(row.revenue),
      })),
      endDate: query.endDate ?? toEffectiveDate(aggregate._max.deliveredAt),
      startDate: query.startDate ?? toEffectiveDate(aggregate._min.deliveredAt),
      totalOrders: aggregate._count._all,
      totalRevenue: Number(aggregate._sum.totalAmount ?? 0),
    };
  }

  async getOrdersByStatus(query: DateScopedQuery): Promise<OrdersByStatusRecord> {
    const createdAtFilter = buildRequiredDateRangeFilter(query);
    const where = {
      createdAt: createdAtFilter,
    };
    const [rows, total, aggregate] = await Promise.all([
      this.prismaService.order.groupBy({
        _count: {
          _all: true,
        },
        by: ['status'],
        where,
      }),
      this.prismaService.order.count({ where }),
      this.prismaService.order.aggregate({
        _max: {
          createdAt: true,
        },
        _min: {
          createdAt: true,
        },
        where,
      }),
    ]);

    return {
      endDate: query.endDate ?? toEffectiveDate(aggregate._max.createdAt),
      rows: rows.map((row) => ({
        count: row._count._all,
        status: row.status.toLowerCase(),
      })),
      startDate: query.startDate ?? toEffectiveDate(aggregate._min.createdAt),
      total,
    };
  }

  async getTopProducts(query: DateScopedQuery & { limit: number }): Promise<TopProductRecord[]> {
    const rows = await this.prismaService.$queryRaw<
      Array<{
        productId: string;
        productName: string;
        totalQuantity: number;
        totalRevenue: number;
      }>
    >(Prisma.sql`
      SELECT
        oi.product_id AS "productId",
        p.name AS "productName",
        COALESCE(SUM(oi.quantity), 0)::int AS "totalQuantity",
        COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float8 AS "totalRevenue"
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      INNER JOIN products p ON p.id = oi.product_id
      WHERE o.status = 'delivered'
      ${buildTimestampWhereClause('o.delivered_at', query)}
      GROUP BY oi.product_id, p.name
      ORDER BY SUM(oi.quantity) DESC, SUM(oi.quantity * oi.unit_price) DESC, p.name ASC
      LIMIT ${query.limit}
    `);

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      totalQuantity: Number(row.totalQuantity),
      totalRevenue: Number(row.totalRevenue),
    }));
  }

  async getAverageDeliveryTimeSummary(query: DateScopedQuery): Promise<DeliveryTimeSummaryRecord> {
    const deliveredAtFilter = buildDateRangeFilter(query);
    const where = {
      deliveredAt: deliveredAtFilter,
      deliveryPersonId: {
        not: null as string | null,
      },
      status: OrderStatus.DELIVERED,
    };
    const [aggregateWindow, overallRows, byVehicleRows] = await Promise.all([
      this.prismaService.order.aggregate({
        _max: {
          deliveredAt: true,
        },
        _min: {
          deliveredAt: true,
        },
        where,
      }),
      this.prismaService.$queryRaw<
        Array<{
          averageMinutes: number;
          fastestMinutes: number;
          slowestMinutes: number;
          totalDelivered: number;
        }>
      >(Prisma.sql`
        SELECT
          COALESCE(AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 60.0), 0)::float8 AS "averageMinutes",
          COALESCE(MIN(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 60.0), 0)::float8 AS "fastestMinutes",
          COALESCE(MAX(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 60.0), 0)::float8 AS "slowestMinutes",
          COUNT(*)::int AS "totalDelivered"
        FROM orders o
        WHERE o.status = 'delivered'
          AND o.delivery_person_id IS NOT NULL
        ${buildTimestampWhereClause('o.delivered_at', query)}
      `),
      this.prismaService.$queryRaw<
        Array<{
          averageMinutes: number;
          count: number;
          vehicleType: string;
        }>
      >(Prisma.sql`
        SELECT
          dp.vehicle_type::text AS "vehicleType",
          COALESCE(AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 60.0), 0)::float8 AS "averageMinutes",
          COUNT(*)::int AS "count"
        FROM orders o
        INNER JOIN delivery_persons dp ON dp.id = o.delivery_person_id
        WHERE o.status = 'delivered'
          AND o.delivery_person_id IS NOT NULL
        ${buildTimestampWhereClause('o.delivered_at', query)}
        GROUP BY dp.vehicle_type
        ORDER BY dp.vehicle_type ASC
      `),
    ]);
    const overall = overallRows[0];

    return {
      averageMinutes: Number(overall?.averageMinutes ?? 0),
      byVehicleType: byVehicleRows.map((row) => ({
        averageMinutes: Number(row.averageMinutes),
        count: Number(row.count),
        vehicleType: row.vehicleType,
      })),
      endDate: query.endDate ?? toEffectiveDate(aggregateWindow._max.deliveredAt),
      fastestMinutes: Number(overall?.fastestMinutes ?? 0),
      slowestMinutes: Number(overall?.slowestMinutes ?? 0),
      startDate: query.startDate ?? toEffectiveDate(aggregateWindow._min.deliveredAt),
      totalDelivered: Number(overall?.totalDelivered ?? 0),
    };
  }
}

function buildDateRangeFilter(query: DateScopedQuery): Prisma.DateTimeNullableFilter | undefined {
  const filter: Prisma.DateTimeNullableFilter = {};
  const dayRange = buildSaoPauloDayRange(query);

  if (dayRange.gte) {
    filter.gte = dayRange.gte;
  }

  if (dayRange.lt) {
    filter.lt = dayRange.lt;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

function buildRequiredDateRangeFilter(query: DateScopedQuery): Prisma.DateTimeFilter | undefined {
  const filter: Prisma.DateTimeFilter = {};
  const dayRange = buildSaoPauloDayRange(query);

  if (dayRange.gte) {
    filter.gte = dayRange.gte;
  }

  if (dayRange.lt) {
    filter.lt = dayRange.lt;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

function buildTimestampWhereClause(columnName: string, query: DateScopedQuery) {
  const dayRange = buildSaoPauloDayRange(query);
  const conditions: Prisma.Sql[] = [];

  if (dayRange.gte) {
    conditions.push(Prisma.sql`${Prisma.raw(columnName)} >= ${dayRange.gte}`);
  }

  if (dayRange.lt) {
    conditions.push(Prisma.sql`${Prisma.raw(columnName)} < ${dayRange.lt}`);
  }

  if (conditions.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql` AND ${Prisma.join(conditions, ' AND ')}`;
}

function toEffectiveDate(value: Date | null | undefined) {
  return value ? formatSaoPauloDate(value) : null;
}
