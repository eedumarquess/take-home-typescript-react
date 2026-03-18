import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import type { ErrorDetail } from '../common/errors/app.exception';
import { AppException } from '../common/errors/app.exception';
import { AppErrorCode } from '../common/errors/app-error-code.enum';
import type { AssignDeliveryPersonDto } from './dto/assign-delivery-person.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { type OrderWithRelations, orderStatusToPrisma, toOrderResponse } from './orders.mapper';
import { OrdersRepository } from './orders.repository';

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async list(query: ListOrdersQueryDto) {
    const [items, total] = await Promise.all([
      this.ordersRepository.findMany(query),
      this.ordersRepository.count(query),
    ]);

    return {
      data: items.map(toOrderResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  async getById(id: string) {
    const order = await this.ensureExists(id);
    return toOrderResponse(order);
  }

  async create(input: CreateOrderDto) {
    const requestedProductIds = input.items.map((item) => item.productId);
    const products = await this.ordersRepository.findProductsByIds(requestedProductIds);
    const productsById = new Map(products.map((product) => [product.id, product]));
    const unavailableProducts: ErrorDetail[] = [];

    for (const productId of requestedProductIds) {
      const product = productsById.get(productId);

      if (!product) {
        unavailableProducts.push({
          productId,
          productName: null,
          reason: 'Produto nao encontrado',
        });
        continue;
      }

      if (!product.isAvailable) {
        unavailableProducts.push({
          productId,
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

    const persistenceItems = input.items.map((item) => {
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
          ] satisfies ErrorDetail[],
        );
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(product.price),
      };
    });

    const totalAmount = persistenceItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await this.ordersRepository.createOrder({
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      latitude: input.latitude,
      longitude: input.longitude,
      totalAmount,
      items: persistenceItems,
    });

    return toOrderResponse(order);
  }

  async updateStatus(id: string, input: UpdateOrderStatusDto) {
    const order = await this.ensureExists(id);
    const nextStatus = orderStatusToPrisma[input.status];

    if (!validTransitions[order.status].includes(nextStatus)) {
      throw new AppException(
        422,
        AppErrorCode.INVALID_STATUS_TRANSITION,
        `Nao e possivel alterar o status de '${order.status}' para '${input.status}'`,
        [],
      );
    }

    if (nextStatus === OrderStatus.DELIVERING && !order.deliveryPersonId) {
      throw new AppException(
        422,
        AppErrorCode.INVALID_STATUS_TRANSITION,
        "Nao e possivel alterar o status de 'ready' para 'delivering' sem entregador atribuido",
        [],
      );
    }

    const deliveredAt = nextStatus === OrderStatus.DELIVERED ? new Date() : null;
    const updatedOrder = await this.ordersRepository.updateStatus(id, nextStatus, deliveredAt);

    return toOrderResponse(updatedOrder);
  }

  async assignDeliveryPerson(id: string, input: AssignDeliveryPersonDto) {
    const order = await this.ensureExists(id);

    if (order.status !== OrderStatus.READY) {
      throw new AppException(
        422,
        AppErrorCode.ORDER_ASSIGNMENT_NOT_ALLOWED,
        "A atribuicao so e permitida para pedidos com status 'ready'",
        [],
      );
    }

    const deliveryPerson = await this.ordersRepository.findDeliveryPersonById(
      input.deliveryPersonId,
    );

    if (!deliveryPerson) {
      throw new AppException(
        404,
        AppErrorCode.DELIVERY_PERSON_NOT_FOUND,
        'Entregador nao encontrado',
        [],
      );
    }

    if (!deliveryPerson.isActive) {
      throw new AppException(
        422,
        AppErrorCode.DELIVERY_PERSON_INACTIVE,
        'Nao e possivel atribuir um entregador inativo',
        [],
      );
    }

    if (deliveryPerson.orders.length > 0) {
      throw new AppException(
        422,
        AppErrorCode.DELIVERY_PERSON_UNAVAILABLE,
        'Este entregador ja esta atribuido a outro pedido em andamento',
        [],
      );
    }

    const updatedOrder = await this.ordersRepository.assignDeliveryPerson(id, input);

    return toOrderResponse(updatedOrder);
  }

  private async ensureExists(id: string): Promise<OrderWithRelations> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new AppException(404, AppErrorCode.ORDER_NOT_FOUND, 'Pedido nao encontrado', []);
    }

    return order;
  }
}
