import { OrderStatus, Prisma, VehicleType } from '@prisma/client';
import { OrderStatusValue } from '../common/enums/order-status.enum';
import { SortOrder } from '../common/enums/sort-order.enum';
import { AppErrorCode } from '../common/errors/app-error-code.enum';
import { OrderSortBy } from './dto/list-orders-query.dto';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const repository = {
    assignDeliveryPerson: jest.fn(),
    count: jest.fn(),
    createOrder: jest.fn(),
    findById: jest.fn(),
    findDeliveryPersonById: jest.fn(),
    findMany: jest.fn(),
    findProductsByIds: jest.fn(),
    updateStatus: jest.fn(),
  };

  const service = new OrdersService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists orders with pagination and serializes numeric fields', async () => {
    repository.findMany.mockResolvedValue([
      buildOrder({
        deliveryPerson: {
          id: 'delivery-1',
          isActive: true,
          name: 'Carlos Santos',
          phone: '(11) 91234-5678',
          vehicleType: VehicleType.MOTORCYCLE,
        },
        status: OrderStatus.DELIVERING,
        totalAmount: new Prisma.Decimal('65.80'),
      }),
    ]);
    repository.count.mockResolvedValue(1);

    const result = await service.list({
      endDate: '2025-01-31',
      limit: 20,
      page: 1,
      sortBy: OrderSortBy.TOTAL_AMOUNT,
      sortOrder: SortOrder.ASC,
      startDate: '2025-01-01',
      status: OrderStatusValue.DELIVERING,
    });

    expect(result).toEqual({
      data: [
        expect.objectContaining({
          deliveryPerson: {
            id: 'delivery-1',
            name: 'Carlos Santos',
            phone: '(11) 91234-5678',
            vehicleType: 'motorcycle',
          },
          status: 'delivering',
          totalAmount: 65.8,
        }),
      ],
      pagination: {
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('creates orders with backend-calculated totalAmount and unitPrice snapshots', async () => {
    repository.findProductsByIds.mockResolvedValue([
      {
        id: 'product-1',
        isAvailable: true,
        name: 'X-Burger',
        price: new Prisma.Decimal('32.90'),
      },
      {
        id: 'product-2',
        isAvailable: true,
        name: 'Refrigerante',
        price: new Prisma.Decimal('8.50'),
      },
    ]);
    repository.createOrder.mockResolvedValue(
      buildOrder({
        totalAmount: new Prisma.Decimal('74.30'),
      }),
    );

    await service.create({
      customerName: 'Maria Oliveira',
      customerPhone: '(11) 99876-5432',
      deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
      items: [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ],
      latitude: -23.5505,
      longitude: -46.6333,
    });

    expect(repository.createOrder).toHaveBeenCalledWith({
      customerName: 'Maria Oliveira',
      customerPhone: '(11) 99876-5432',
      deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          unitPrice: 32.9,
        },
        {
          productId: 'product-2',
          quantity: 1,
          unitPrice: 8.5,
        },
      ],
      latitude: -23.5505,
      longitude: -46.6333,
      totalAmount: 74.3,
    });
  });

  it('rejects orders containing unavailable products', async () => {
    repository.findProductsByIds.mockResolvedValue([
      {
        id: 'product-1',
        isAvailable: false,
        name: 'Pudim de Leite',
        price: new Prisma.Decimal('14.00'),
      },
    ]);

    await expect(
      service.create({
        customerName: 'Maria Oliveira',
        customerPhone: '(11) 99876-5432',
        deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
        items: [{ productId: 'product-1', quantity: 1 }],
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.UNAVAILABLE_PRODUCT,
          details: [
            {
              productId: 'product-1',
              productName: 'Pudim de Leite',
              reason: 'Produto indisponivel',
            },
          ],
        },
      },
      status: 422,
    });
  });

  it('updates order status and sets deliveredAt when transitioning to delivered', async () => {
    repository.findById.mockResolvedValue(
      buildOrder({
        deliveryPersonId: 'delivery-1',
        status: OrderStatus.DELIVERING,
      }),
    );
    repository.updateStatus.mockImplementation(
      async (_id: string, status: OrderStatus, deliveredAt: Date | null) =>
        buildOrder({
          deliveredAt,
          deliveryPersonId: 'delivery-1',
          status,
        }),
    );

    const result = await service.updateStatus('order-1', {
      status: OrderStatusValue.DELIVERED,
    });

    expect(repository.updateStatus).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.DELIVERED,
      expect.any(Date),
    );
    expect(result.status).toBe('delivered');
    expect(result.deliveredAt).toEqual(expect.any(Date));
  });

  it('rejects invalid status transitions', async () => {
    repository.findById.mockResolvedValue(
      buildOrder({
        status: OrderStatus.PENDING,
      }),
    );

    await expect(
      service.updateStatus('order-1', {
        status: OrderStatusValue.DELIVERED,
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.INVALID_STATUS_TRANSITION,
        },
      },
      status: 422,
    });
  });

  it('assigns a delivery person to a ready order', async () => {
    repository.findById.mockResolvedValue(
      buildOrder({
        status: OrderStatus.READY,
      }),
    );
    repository.findDeliveryPersonById.mockResolvedValue({
      id: 'delivery-2',
      isActive: true,
      name: 'Ana Souza',
      orders: [],
      phone: '(11) 93456-7890',
      vehicleType: VehicleType.BICYCLE,
    });
    repository.assignDeliveryPerson.mockResolvedValue(
      buildOrder({
        deliveryPerson: {
          id: 'delivery-2',
          isActive: true,
          name: 'Ana Souza',
          phone: '(11) 93456-7890',
          vehicleType: VehicleType.BICYCLE,
        },
        deliveryPersonId: 'delivery-2',
        status: OrderStatus.READY,
      }),
    );

    const result = await service.assignDeliveryPerson('order-1', {
      deliveryPersonId: 'delivery-2',
    });

    expect(repository.assignDeliveryPerson).toHaveBeenCalledWith('order-1', {
      deliveryPersonId: 'delivery-2',
    });
    expect(result.deliveryPerson).toMatchObject({
      id: 'delivery-2',
      vehicleType: 'bicycle',
    });
  });

  it('rejects assignment for inactive delivery persons', async () => {
    repository.findById.mockResolvedValue(
      buildOrder({
        status: OrderStatus.READY,
      }),
    );
    repository.findDeliveryPersonById.mockResolvedValue({
      id: 'delivery-3',
      isActive: false,
      name: 'Pedro Oliveira',
      orders: [],
      phone: '(11) 94567-8901',
      vehicleType: VehicleType.CAR,
    });

    await expect(
      service.assignDeliveryPerson('order-1', {
        deliveryPersonId: 'delivery-3',
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.DELIVERY_PERSON_INACTIVE,
        },
      },
      status: 422,
    });
  });

  it('rejects assignment for busy delivery persons', async () => {
    repository.findById.mockResolvedValue(
      buildOrder({
        status: OrderStatus.READY,
      }),
    );
    repository.findDeliveryPersonById.mockResolvedValue({
      id: 'delivery-4',
      isActive: true,
      name: 'Carlos Santos',
      orders: [{ id: 'order-delivering' }],
      phone: '(11) 91234-5678',
      vehicleType: VehicleType.MOTORCYCLE,
    });

    await expect(
      service.assignDeliveryPerson('order-1', {
        deliveryPersonId: 'delivery-4',
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.DELIVERY_PERSON_UNAVAILABLE,
        },
      },
      status: 422,
    });
  });

  it('rejects assignment when the order is not ready', async () => {
    repository.findById.mockResolvedValue(
      buildOrder({
        status: OrderStatus.PREPARING,
      }),
    );

    await expect(
      service.assignDeliveryPerson('order-1', {
        deliveryPersonId: 'delivery-5',
      }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: AppErrorCode.ORDER_ASSIGNMENT_NOT_ALLOWED,
        },
      },
      status: 422,
    });
  });
});

function buildOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    createdAt: new Date('2025-01-20T14:30:00.000Z'),
    customerName: 'Joao Silva',
    customerPhone: '(11) 99999-1234',
    deliveredAt: null,
    deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
    deliveryPerson: null,
    deliveryPersonId: null,
    id: 'order-1',
    items: [
      {
        createdAt: new Date('2025-01-20T14:30:00.000Z'),
        id: 'item-1',
        orderId: 'order-1',
        product: {
          id: 'product-1',
          name: 'X-Burger',
        },
        productId: 'product-1',
        quantity: 2,
        unitPrice: new Prisma.Decimal('32.90'),
      },
    ],
    latitude: new Prisma.Decimal('-23.55050000'),
    longitude: new Prisma.Decimal('-46.63330000'),
    status: OrderStatus.PENDING,
    totalAmount: new Prisma.Decimal('65.80'),
    updatedAt: new Date('2025-01-20T14:30:00.000Z'),
    ...overrides,
  };
}
