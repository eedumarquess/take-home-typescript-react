import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { AppErrorCode } from '../../common/errors/app-error-code.enum';
import { DeliveryPerson } from '../../domain/delivery-persons/delivery-person';
import type { VehicleTypeValue } from '../../domain/delivery-persons/vehicle-type.enum';
import { Order } from '../../domain/orders/order';
import type { IOrderRepository, ListOrdersQuery } from '../../domain/orders/order.repository';
import { OrderStatusValue } from '../../domain/orders/order-status.enum';
import { Coordinates } from '../../domain/shared/coordinates';
import { DomainError } from '../../domain/shared/domain-error';
import { PhoneNumber } from '../../domain/shared/phone-number';
import { toOrderResponse } from '../presenters/order.presenter';

@Injectable()
export class ListOrdersUseCase {
  constructor(private readonly ordersRepository: IOrderRepository) {}

  async execute(query: ListOrdersQuery) {
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
}

@Injectable()
export class GetOrderDetailsUseCase {
  constructor(private readonly ordersRepository: IOrderRepository) {}

  async execute(id: string) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw orderNotFound();
    }

    return toOrderResponse(order);
  }
}

@Injectable()
export class CreateOrderUseCase {
  constructor(private readonly ordersRepository: IOrderRepository) {}

  async execute(input: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    latitude: number;
    longitude: number;
    items: Array<{ productId: string; quantity: number }>;
  }) {
    const requestedProductIds = input.items.map((item) => item.productId);
    const products = await this.ordersRepository.findProductsByIds(requestedProductIds);
    const productsById = new Map(products.map((product) => [product.toPrimitives().id, product]));
    const unavailableProducts: Array<{
      productId: string;
      productName: string | null;
      reason: string;
    }> = [];

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

      if (!product.toPrimitives().isAvailable) {
        unavailableProducts.push({
          productId,
          productName: product.toPrimitives().name,
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

    const order = Order.create({
      coordinates: new Coordinates(input.latitude, input.longitude),
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
          productName: product.toPrimitives().name,
          quantity: item.quantity,
          unitPrice: product.toPrimitives().price,
        };
      }),
    });

    const createdOrder = await this.ordersRepository.create({
      coordinates: order.toPrimitives().coordinates,
      customerName: order.toPrimitives().customerName,
      customerPhone: order.toPrimitives().customerPhone,
      deliveryAddress: order.toPrimitives().deliveryAddress,
      items: order.toPrimitives().items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount: order.toPrimitives().totalAmount,
    });

    return toOrderResponse(createdOrder);
  }
}

@Injectable()
export class TransitionOrderUseCase {
  constructor(private readonly ordersRepository: IOrderRepository) {}

  async execute(id: string, input: { status: OrderStatusValue }) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw orderNotFound();
    }

    try {
      const transitionedOrder = order.transitionTo(input.status);
      const updatedOrder = await this.ordersRepository.updateStatus(
        id,
        transitionedOrder.toPrimitives().status,
        transitionedOrder.toPrimitives().deliveredAt,
      );

      return toOrderResponse(updatedOrder);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new AppException(422, AppErrorCode.INVALID_STATUS_TRANSITION, error.message, []);
      }

      throw error;
    }
  }
}

@Injectable()
export class AssignDeliveryUseCase {
  constructor(private readonly ordersRepository: IOrderRepository) {}

  async execute(id: string, input: { deliveryPersonId: string }) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw orderNotFound();
    }

    try {
      order.assertReadyForAssignment();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new AppException(422, AppErrorCode.ORDER_ASSIGNMENT_NOT_ALLOWED, error.message, []);
      }

      throw error;
    }

    const availability = await this.ordersRepository.findDeliveryPersonAvailabilityById(
      input.deliveryPersonId,
    );

    if (!availability) {
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
        currentOrderId: availability.currentOrderId,
        id: availability.id,
        isActive: availability.isActive,
        name: availability.name,
        phone: new PhoneNumber(availability.phone),
        vehicleType: availability.vehicleType as VehicleTypeValue,
      }).assertCanBeAssigned();
    } catch (error) {
      if (error instanceof DomainError) {
        const errorCode =
          error.reason === 'ORDER_ASSIGNMENT_NOT_ALLOWED'
            ? AppErrorCode.ORDER_ASSIGNMENT_NOT_ALLOWED
            : error.reason === 'DELIVERY_PERSON_INACTIVE'
              ? AppErrorCode.DELIVERY_PERSON_INACTIVE
              : AppErrorCode.DELIVERY_PERSON_UNAVAILABLE;

        throw new AppException(422, errorCode, error.message, []);
      }

      throw error;
    }

    const updatedOrder = await this.ordersRepository.assignDeliveryPerson(
      id,
      input.deliveryPersonId,
    );
    return toOrderResponse(updatedOrder);
  }
}

function orderNotFound() {
  return new AppException(404, AppErrorCode.ORDER_NOT_FOUND, 'Pedido nao encontrado', []);
}
