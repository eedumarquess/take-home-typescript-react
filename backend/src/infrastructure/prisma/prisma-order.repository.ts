import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { SortOrder } from '../../common/enums/sort-order.enum';
import type {
  CreateOrderInput,
  DeliveryPersonAvailability,
  IOrderRepository,
  ListOrdersQuery,
} from '../../domain/orders/order.repository';
import { OrderStatusValue } from '../../domain/orders/order-status.enum';
import { Coordinates } from '../../domain/shared/coordinates';
import { PrismaService } from '../../prisma/prisma.service';
import {
  orderStatusToPrisma,
  type PrismaOrderWithRelations,
  toDecimal,
  toOrderDomain,
  toProductDomain,
} from './prisma.mappers';

const orderInclude = {
  deliveryPerson: true,
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: Prisma.SortOrder.asc,
    },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(query: ListOrdersQuery) {
    const orders = await this.prismaService.order.findMany({
      include: orderInclude,
      orderBy: this.buildOrderBy(query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: this.buildWhere(query),
    });

    return orders.map((order) => toOrderDomain(order as PrismaOrderWithRelations));
  }

  count(query: ListOrdersQuery) {
    return this.prismaService.order.count({
      where: this.buildWhere(query),
    });
  }

  async findById(id: string) {
    const order = await this.prismaService.order.findUnique({
      include: orderInclude,
      where: { id },
    });

    return order ? toOrderDomain(order as PrismaOrderWithRelations) : null;
  }

  async findProductsByIds(productIds: string[]) {
    const products = await this.prismaService.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    return products.map(toProductDomain);
  }

  async findDeliveryPersonAvailabilityById(id: string): Promise<DeliveryPersonAvailability | null> {
    const deliveryPerson = await this.prismaService.deliveryPerson.findUnique({
      include: {
        orders: {
          select: {
            id: true,
          },
          take: 1,
          where: {
            status: OrderStatus.DELIVERING,
          },
        },
      },
      where: { id },
    });

    if (!deliveryPerson) {
      return null;
    }

    return {
      currentOrderId: deliveryPerson.orders[0]?.id ?? null,
      id: deliveryPerson.id,
      isActive: deliveryPerson.isActive,
      name: deliveryPerson.name,
      phone: deliveryPerson.phone,
      vehicleType: deliveryPerson.vehicleType.toLowerCase(),
    };
  }

  async create(input: CreateOrderInput) {
    const order = await this.prismaService.$transaction((transaction) =>
      transaction.order.create({
        data: {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: toDecimal(item.unitPrice.toNumber()),
            })),
          },
          latitude: toDecimal(input.coordinates.latitude),
          longitude: toDecimal(input.coordinates.longitude),
          status: OrderStatus.PENDING,
          statusEvents: {
            create: {
              occurredAt: new Date(),
              status: OrderStatus.PENDING,
            },
          },
          totalAmount: toDecimal(input.totalAmount.toNumber()),
        },
        include: orderInclude,
      }),
    );

    return toOrderDomain(order as PrismaOrderWithRelations);
  }

  async updateStatus(id: string, status: OrderStatusValue, deliveredAt: Date | null) {
    const order = await this.prismaService.$transaction(async (transaction) => {
      const updatedOrder = await transaction.order.update({
        data: {
          deliveredAt,
          status: orderStatusToPrisma[status],
        },
        include: orderInclude,
        where: { id },
      });

      await transaction.orderStatusEvent.create({
        data: {
          occurredAt: new Date(),
          orderId: id,
          status: orderStatusToPrisma[status],
        },
      });

      return updatedOrder;
    });

    return toOrderDomain(order as PrismaOrderWithRelations);
  }

  async assignDeliveryPerson(orderId: string, deliveryPersonId: string) {
    const order = await this.prismaService.order.update({
      data: {
        deliveryPersonId,
      },
      include: orderInclude,
      where: { id: orderId },
    });

    return toOrderDomain(order as PrismaOrderWithRelations);
  }

  async findReadyOrders() {
    const orders = await this.prismaService.order.findMany({
      select: {
        deliveryAddress: true,
        id: true,
        latitude: true,
        longitude: true,
      },
      where: {
        status: OrderStatus.READY,
      },
    });

    return orders.map((order) => ({
      coordinates: new Coordinates(Number(order.latitude), Number(order.longitude)),
      deliveryAddress: order.deliveryAddress,
      id: order.id,
    }));
  }

  private buildWhere(query: ListOrdersQuery): Prisma.OrderWhereInput {
    const createdAtFilter: Prisma.DateTimeFilter = {};

    if (query.startDate) {
      createdAtFilter.gte = new Date(`${query.startDate}T00:00:00.000Z`);
    }

    if (query.endDate) {
      const endDate = new Date(`${query.endDate}T00:00:00.000Z`);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      createdAtFilter.lt = endDate;
    }

    return {
      createdAt: Object.keys(createdAtFilter).length === 0 ? undefined : createdAtFilter,
      status: query.status ? orderStatusToPrisma[query.status] : undefined,
    };
  }

  private buildOrderBy(query: ListOrdersQuery): Prisma.OrderOrderByWithRelationInput {
    const direction =
      query.sortOrder === SortOrder.ASC ? Prisma.SortOrder.asc : Prisma.SortOrder.desc;

    switch (query.sortBy) {
      case 'totalAmount':
        return { totalAmount: direction };
      default:
        return { createdAt: direction };
    }
  }
}
