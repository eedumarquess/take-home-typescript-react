import { Coordinates } from '../shared/coordinates';
import { Money } from '../shared/money';
import { Order } from './order';
import { OrderStatusValue } from './order-status.enum';

describe('Order domain', () => {
  it('allows valid status transitions and sets deliveredAt when delivered', () => {
    const order = Order.rehydrate({
      coordinates: new Coordinates(-23.5505, -46.6333),
      createdAt: new Date('2025-01-20T14:30:00.000Z'),
      customerName: 'Joao Silva',
      customerPhone: '(11) 99999-1234',
      deliveredAt: null,
      deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
      deliveryPerson: {
        id: 'delivery-1',
        name: 'Carlos Santos',
        phone: '(11) 91234-5678',
        vehicleType: 'motorcycle',
      },
      deliveryPersonId: 'delivery-1',
      id: 'order-1',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          productName: 'X-Burger',
          quantity: 2,
          unitPrice: Money.fromNumber(32.9),
        },
      ],
      status: OrderStatusValue.DELIVERING,
      totalAmount: Money.fromNumber(65.8),
      updatedAt: new Date('2025-01-20T14:30:00.000Z'),
    });

    const deliveredOrder = order.transitionTo(OrderStatusValue.DELIVERED);

    expect(deliveredOrder.toPrimitives().status).toBe(OrderStatusValue.DELIVERED);
    expect(deliveredOrder.toPrimitives().deliveredAt).toEqual(expect.any(Date));
  });

  it('rejects invalid status transitions', () => {
    const order = Order.rehydrate({
      coordinates: new Coordinates(-23.5505, -46.6333),
      createdAt: new Date('2025-01-20T14:30:00.000Z'),
      customerName: 'Joao Silva',
      customerPhone: '(11) 99999-1234',
      deliveredAt: null,
      deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
      deliveryPerson: null,
      deliveryPersonId: null,
      id: 'order-1',
      items: [],
      status: OrderStatusValue.PENDING,
      totalAmount: Money.fromNumber(0),
      updatedAt: new Date('2025-01-20T14:30:00.000Z'),
    });

    expect(() => order.transitionTo(OrderStatusValue.DELIVERED)).toThrow(
      "Nao e possivel alterar o status de 'pending' para 'delivered'",
    );
  });
});
