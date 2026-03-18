import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, VehicleType } from '@prisma/client';
import { SortOrder } from '../common/enums/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import type { AssignDeliveryPersonDto } from './dto/assign-delivery-person.dto';
import type { CreateOrderItemInput } from './dto/create-order.dto';
import { type ListOrdersQueryDto, OrderSortBy } from './dto/list-orders-query.dto';
import { type OrderWithRelations, orderStatusToPrisma } from './orders.mapper';

type AvailableProduct = {
  id: string;
  name: string;
  isAvailable: boolean;
  price: Prisma.Decimal;
};

export type DeliveryPersonAvailability = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  vehicleType: VehicleType;
  orders: Array<{ id: string }>;
};

export type CreateOrderPersistenceInput = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  totalAmount: number;
  items: Array<CreateOrderItemInput & { unitPrice: number }>;
};

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
export class OrdersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findMany(query: ListOrdersQueryDto): Promise<OrderWithRelations[]> {
    return this.prismaService.order.findMany({
      include: orderInclude,
      orderBy: this.buildOrderBy(query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: this.buildWhere(query),
    });
  }

  count(query: ListOrdersQueryDto) {
    return this.prismaService.order.count({
      where: this.buildWhere(query),
    });
  }

  findById(id: string): Promise<OrderWithRelations | null> {
    return this.prismaService.order.findUnique({
      include: orderInclude,
      where: { id },
    });
  }

  findProductsByIds(productIds: string[]): Promise<AvailableProduct[]> {
    return this.prismaService.product.findMany({
      select: {
        id: true,
        isAvailable: true,
        name: true,
        price: true,
      },
      where: {
        id: {
          in: productIds,
        },
      },
    });
  }

  findDeliveryPersonById(id: string): Promise<DeliveryPersonAvailability | null> {
    return this.prismaService.deliveryPerson.findUnique({
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
  }

  createOrder(input: CreateOrderPersistenceInput): Promise<OrderWithRelations> {
    return this.prismaService.$transaction((transaction) =>
      transaction.order.create({
        data: {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          latitude: new Prisma.Decimal(input.latitude),
          longitude: new Prisma.Decimal(input.longitude),
          status: OrderStatus.PENDING,
          totalAmount: new Prisma.Decimal(input.totalAmount),
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
            })),
          },
          statusEvents: {
            create: {
              occurredAt: new Date(),
              status: OrderStatus.PENDING,
            },
          },
        },
        include: orderInclude,
      }),
    );
  }

  updateStatus(
    id: string,
    status: OrderStatus,
    deliveredAt: Date | null,
  ): Promise<OrderWithRelations> {
    return this.prismaService.$transaction(async (transaction) => {
      const order = await transaction.order.update({
        data: {
          deliveredAt,
          status,
        },
        include: orderInclude,
        where: { id },
      });

      await transaction.orderStatusEvent.create({
        data: {
          occurredAt: new Date(),
          orderId: id,
          status,
        },
      });

      return order;
    });
  }

  assignDeliveryPerson(
    orderId: string,
    input: AssignDeliveryPersonDto,
  ): Promise<OrderWithRelations> {
    return this.prismaService.order.update({
      data: {
        deliveryPersonId: input.deliveryPersonId,
      },
      include: orderInclude,
      where: { id: orderId },
    });
  }

  private buildWhere(query: ListOrdersQueryDto): Prisma.OrderWhereInput {
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

  private buildOrderBy(query: ListOrdersQueryDto): Prisma.OrderOrderByWithRelationInput {
    const direction =
      query.sortOrder === SortOrder.ASC ? Prisma.SortOrder.asc : Prisma.SortOrder.desc;

    switch (query.sortBy) {
      case OrderSortBy.TOTAL_AMOUNT:
        return { totalAmount: direction };
      default:
        return { createdAt: direction };
    }
  }
}
