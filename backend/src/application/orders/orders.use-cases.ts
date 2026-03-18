import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { AppErrorCode } from '../../common/errors/app-error-code.enum';
import { DeliveryPerson } from '../../domain/delivery-persons/delivery-person';
import type { VehicleTypeValue } from '../../domain/delivery-persons/vehicle-type.enum';
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
    assertNoDuplicateProducts(input.items);

    const createdOrder = await this.ordersRepository.create({
      coordinates: new Coordinates(input.latitude, input.longitude),
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      items: input.items,
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
      const occurredAt = new Date();
      const transitionedOrder = order.transitionTo(input.status, occurredAt);
      const updatedOrder = await this.ordersRepository.updateStatus({
        deliveredAt: transitionedOrder.toPrimitives().deliveredAt,
        expectedUpdatedAt: order.toPrimitives().updatedAt,
        id,
        occurredAt,
        status: transitionedOrder.toPrimitives().status,
      });

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

    const updatedOrder = await this.ordersRepository.assignDeliveryPerson({
      deliveryPersonId: input.deliveryPersonId,
      expectedUpdatedAt: order.toPrimitives().updatedAt,
      orderId: id,
    });

    return toOrderResponse(updatedOrder);
  }
}

function orderNotFound() {
  return new AppException(404, AppErrorCode.ORDER_NOT_FOUND, 'Pedido nao encontrado', []);
}

function assertNoDuplicateProducts(items: Array<{ productId: string }>) {
  const seenProductIds = new Set<string>();
  const duplicatedProductIds = new Set<string>();

  for (const item of items) {
    if (seenProductIds.has(item.productId)) {
      duplicatedProductIds.add(item.productId);
    }

    seenProductIds.add(item.productId);
  }

  if (duplicatedProductIds.size === 0) {
    return;
  }

  throw new AppException(
    422,
    AppErrorCode.VALIDATION_ERROR,
    'Dados invalidos',
    [...duplicatedProductIds].map((productId) => ({
      field: 'items',
      message: 'Nao e permitido repetir produtos no mesmo pedido',
      productId,
    })),
  );
}
