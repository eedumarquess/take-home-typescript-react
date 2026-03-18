import { Coordinates } from '../shared/coordinates';
import { DomainError } from '../shared/domain-error';
import { Money } from '../shared/money';
import { OrderStatusValue } from './order-status.enum';

export type OrderItemProps = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Money;
};

export type AssignedDeliveryPerson = {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
};

export type OrderProps = {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  coordinates: Coordinates;
  status: OrderStatusValue;
  totalAmount: Money;
  items: OrderItemProps[];
  deliveryPersonId: string | null;
  deliveryPerson: AssignedDeliveryPerson | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const validTransitions: Record<OrderStatusValue, OrderStatusValue[]> = {
  [OrderStatusValue.PENDING]: [OrderStatusValue.PREPARING, OrderStatusValue.CANCELLED],
  [OrderStatusValue.PREPARING]: [OrderStatusValue.READY, OrderStatusValue.CANCELLED],
  [OrderStatusValue.READY]: [OrderStatusValue.DELIVERING, OrderStatusValue.CANCELLED],
  [OrderStatusValue.DELIVERING]: [OrderStatusValue.DELIVERED],
  [OrderStatusValue.DELIVERED]: [],
  [OrderStatusValue.CANCELLED]: [],
};

export class Order {
  constructor(private readonly props: OrderProps) {}

  static rehydrate(props: OrderProps) {
    return new Order(props);
  }

  static create(input: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    coordinates: Coordinates;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: Money;
    }>;
  }) {
    assertUniqueProducts(input.items.map((item) => item.productId));

    const totalAmount = input.items.reduce(
      (sum, item) => sum.add(item.unitPrice.multiply(item.quantity)),
      Money.fromNumber(0),
    );

    return new Order({
      coordinates: input.coordinates,
      createdAt: new Date(),
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveredAt: null,
      deliveryAddress: input.deliveryAddress,
      deliveryPerson: null,
      deliveryPersonId: null,
      id: '',
      items: input.items.map((item, index) => ({
        id: `draft-item-${index}`,
        ...item,
      })),
      status: OrderStatusValue.PENDING,
      totalAmount,
      updatedAt: new Date(),
    });
  }

  transitionTo(nextStatus: OrderStatusValue, occurredAt = new Date()) {
    if (!validTransitions[this.props.status].includes(nextStatus)) {
      throw new DomainError(
        `Nao e possivel alterar o status de '${this.props.status}' para '${nextStatus}'`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    if (nextStatus === OrderStatusValue.DELIVERING && !this.props.deliveryPersonId) {
      throw new DomainError(
        "Nao e possivel alterar o status de 'ready' para 'delivering' sem entregador atribuido",
        'INVALID_STATUS_TRANSITION',
      );
    }

    return new Order({
      ...this.props,
      deliveredAt: nextStatus === OrderStatusValue.DELIVERED ? occurredAt : null,
      status: nextStatus,
      updatedAt: occurredAt,
    });
  }

  assertReadyForAssignment() {
    if (this.props.status !== OrderStatusValue.READY) {
      throw new DomainError(
        "A atribuicao so e permitida para pedidos com status 'ready'",
        'ORDER_ASSIGNMENT_NOT_ALLOWED',
      );
    }
  }

  assignDeliveryPerson(deliveryPerson: AssignedDeliveryPerson) {
    this.assertReadyForAssignment();

    return new Order({
      ...this.props,
      deliveryPerson,
      deliveryPersonId: deliveryPerson.id,
      updatedAt: new Date(),
    });
  }

  toPrimitives() {
    return this.props;
  }
}

function assertUniqueProducts(productIds: string[]) {
  const seenProductIds = new Set<string>();

  for (const productId of productIds) {
    if (seenProductIds.has(productId)) {
      throw new DomainError(
        'Nao e permitido repetir produtos no mesmo pedido',
        'DUPLICATE_ORDER_ITEM',
      );
    }

    seenProductIds.add(productId);
  }
}
