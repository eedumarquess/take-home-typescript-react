import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { SortOrder } from '../../common/enums/sort-order.enum';
import { AppException } from '../../common/errors/app.exception';
import { AppErrorCode } from '../../common/errors/app-error-code.enum';
import { buildSaoPauloDayRange } from '../../common/utils/sao-paulo-date.util';
import { DeliveryPerson } from '../../domain/delivery-persons/delivery-person';
import type { VehicleTypeValue } from '../../domain/delivery-persons/vehicle-type.enum';
import { Order } from '../../domain/orders/order';
import type {
  CreateOrderInput,
  DeliveryPersonAvailability,
  IOrderRepository,
  ListOrdersQuery,
} from '../../domain/orders/order.repository';
import { OrderStatusValue } from '../../domain/orders/order-status.enum';
import { Coordinates } from '../../domain/shared/coordinates';
import { DomainError } from '../../domain/shared/domain-error';
import { Money } from '../../domain/shared/money';
import { PhoneNumber } from '../../domain/shared/phone-number';
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
    const order = await this.prismaService.$transaction(async (transaction) => {
      const requestedProductIds = [...new Set(input.items.map((item) => item.productId))];
      const products = await transaction.product.findMany({
        where: {
          id: {
            in: requestedProductIds,
          },
        },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));
      const unavailableProducts: Array<{
        productId: string;
        productName: string | null;
        reason: string;
      }> = [];

      for (const item of input.items) {
        const product = productsById.get(item.productId);

        if (!product) {
          unavailableProducts.push({
            productId: item.productId,
            productName: null,
            reason: 'Produto nao encontrado',
          });
          continue;
        }

        if (!product.isAvailable) {
          unavailableProducts.push({
            productId: item.productId,
            productName: product.name,
            reason: 'Produto indisponivel',
          });
        }
      }

      if (unavailableProducts.length > 0) {
        throw new AppException(
          422,
          AppErrorCode.UNAVAILABLE_PRODUCT,
          'Um ou mais produtos nao estao disponiveis',
          unavailableProducts,
        );
      }

      const orderDraft = Order.create({
        coordinates: input.coordinates,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        items: input.items.map((item) => {
          const product = productsById.get(item.productId);

          if (!product) {
            throw new AppException(
              422,
              AppErrorCode.UNAVAILABLE_PRODUCT,
              'Um ou mais produtos nao estao disponiveis',
              [
                {
                  productId: item.productId,
                  productName: null,
                  reason: 'Produto nao encontrado',
                },
              ],
            );
          }

          return {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: Money.fromNumber(Number(product.price)),
          };
        }),
      });
      const occurredAt = new Date();

      return transaction.order.create({
        data: {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          items: {
            create: orderDraft.toPrimitives().items.map((item) => ({
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
              occurredAt,
              status: OrderStatus.PENDING,
            },
          },
          totalAmount: toDecimal(orderDraft.toPrimitives().totalAmount.toNumber()),
        },
        include: orderInclude,
      });
    });

    return toOrderDomain(order as PrismaOrderWithRelations);
  }

  async updateStatus(input: {
    id: string;
    expectedUpdatedAt: Date;
    status: OrderStatusValue;
    deliveredAt: Date | null;
    occurredAt: Date;
  }) {
    const order = await this.prismaService.$transaction(async (transaction) => {
      const updatedOrder = await transaction.order.updateMany({
        data: {
          deliveredAt: input.deliveredAt,
          status: orderStatusToPrisma[input.status],
        },
        where: {
          id: input.id,
          updatedAt: input.expectedUpdatedAt,
        },
      });

      if (updatedOrder.count !== 1) {
        throw staleOrderState();
      }

      await transaction.orderStatusEvent.create({
        data: {
          occurredAt: input.occurredAt,
          orderId: input.id,
          status: orderStatusToPrisma[input.status],
        },
      });

      return transaction.order.findUniqueOrThrow({
        include: orderInclude,
        where: { id: input.id },
      });
    });

    return toOrderDomain(order as PrismaOrderWithRelations);
  }

  async assignDeliveryPerson(input: {
    orderId: string;
    deliveryPersonId: string;
    expectedUpdatedAt: Date;
  }) {
    const order = await this.prismaService.$transaction(async (transaction) => {
      const currentOrder = await transaction.order.findUnique({
        where: { id: input.orderId },
      });

      if (!currentOrder) {
        throw new AppException(404, AppErrorCode.ORDER_NOT_FOUND, 'Pedido nao encontrado', []);
      }

      if (currentOrder.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
        throw staleOrderState();
      }

      if (currentOrder.status !== OrderStatus.READY) {
        throw new AppException(
          422,
          AppErrorCode.ORDER_ASSIGNMENT_NOT_ALLOWED,
          "A atribuicao so e permitida para pedidos com status 'ready'",
          [],
        );
      }

      const deliveryPerson = await transaction.deliveryPerson.findUnique({
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
        where: { id: input.deliveryPersonId },
      });

      if (!deliveryPerson) {
        throw new AppException(
          404,
          AppErrorCode.DELIVERY_PERSON_NOT_FOUND,
          'Entregador nao encontrado',
          [],
        );
      }

      try {
        DeliveryPerson.rehydrate({
          currentLocation: null,
          currentOrderId: deliveryPerson.orders[0]?.id ?? null,
          id: deliveryPerson.id,
          isActive: deliveryPerson.isActive,
          name: deliveryPerson.name,
          phone: new PhoneNumber(deliveryPerson.phone),
          vehicleType: deliveryPerson.vehicleType.toLowerCase() as VehicleTypeValue,
        }).assertCanBeAssigned();
      } catch (error) {
        if (error instanceof DomainError) {
          const errorCode =
            error.reason === 'DELIVERY_PERSON_INACTIVE'
              ? AppErrorCode.DELIVERY_PERSON_INACTIVE
              : AppErrorCode.DELIVERY_PERSON_UNAVAILABLE;

          throw new AppException(422, errorCode, error.message, []);
        }

        throw error;
      }

      const updatedOrder = await transaction.order.updateMany({
        data: {
          deliveryPersonId: input.deliveryPersonId,
        },
        where: {
          id: input.orderId,
          status: OrderStatus.READY,
          updatedAt: input.expectedUpdatedAt,
        },
      });

      if (updatedOrder.count !== 1) {
        throw staleOrderState();
      }

      return transaction.order.findUniqueOrThrow({
        include: orderInclude,
        where: { id: input.orderId },
      });
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
        createdAt: true,
      },
      orderBy: [{ createdAt: Prisma.SortOrder.asc }, { id: Prisma.SortOrder.asc }],
      where: {
        status: OrderStatus.READY,
      },
    });

    return orders.map((order) => ({
      coordinates: new Coordinates(Number(order.latitude), Number(order.longitude)),
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      id: order.id,
    }));
  }

  private buildWhere(query: ListOrdersQuery): Prisma.OrderWhereInput {
    const createdAtFilter: Prisma.DateTimeFilter = {};
    const dayRange = buildSaoPauloDayRange(query);

    if (dayRange.gte) {
      createdAtFilter.gte = dayRange.gte;
    }

    if (dayRange.lt) {
      createdAtFilter.lt = dayRange.lt;
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

function staleOrderState() {
  return new AppException(
    409,
    AppErrorCode.CONFLICT,
    'O pedido foi alterado por outra operacao. Atualize e tente novamente.',
    [],
  );
}
