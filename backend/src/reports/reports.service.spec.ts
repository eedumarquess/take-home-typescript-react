import { OrderStatus, VehicleType } from '@prisma/client';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const repository = {
    findDeliveredOrderItems: jest.fn(),
    findDeliveredOrdersForDeliveryTime: jest.fn(),
    findDeliveredOrdersForRevenue: jest.fn(),
    findOrdersForStatusBreakdown: jest.fn(),
  };

  const service = new ReportsService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates delivered revenue by day and computes averages', async () => {
    repository.findDeliveredOrdersForRevenue.mockResolvedValue([
      {
        deliveredAt: new Date('2025-01-01T12:00:00.000Z'),
        totalAmount: { toString: () => '50.00', valueOf: () => 50 },
      },
      {
        deliveredAt: new Date('2025-01-01T18:00:00.000Z'),
        totalAmount: { toString: () => '30.50', valueOf: () => 30.5 },
      },
      {
        deliveredAt: new Date('2025-01-02T18:00:00.000Z'),
        totalAmount: { toString: () => '20.00', valueOf: () => 20 },
      },
    ]);

    const result = await service.getRevenue({});

    expect(result).toEqual({
      averageOrderValue: 33.5,
      dailyRevenue: [
        { date: '2025-01-01', orders: 2, revenue: 80.5 },
        { date: '2025-01-02', orders: 1, revenue: 20 },
      ],
      endDate: '2025-01-02',
      startDate: '2025-01-01',
      totalOrders: 3,
      totalRevenue: 100.5,
    });
  });

  it('returns top products ordered by quantity and respects the requested limit', async () => {
    repository.findDeliveredOrderItems.mockResolvedValue([
      {
        product: { id: 'product-1', name: 'X-Burger' },
        quantity: 3,
        unitPrice: { toString: () => '30.00', valueOf: () => 30 },
      },
      {
        product: { id: 'product-2', name: 'Suco' },
        quantity: 5,
        unitPrice: { toString: () => '8.00', valueOf: () => 8 },
      },
      {
        product: { id: 'product-1', name: 'X-Burger' },
        quantity: 1,
        unitPrice: { toString: () => '30.00', valueOf: () => 30 },
      },
    ]);

    const result = await service.getTopProducts({ limit: 1 });

    expect(result).toEqual({
      data: [
        {
          productId: 'product-2',
          productName: 'Suco',
          totalQuantity: 5,
          totalRevenue: 40,
        },
      ],
    });
  });

  it('computes delivery time rollups including byVehicleType', async () => {
    repository.findDeliveredOrdersForDeliveryTime.mockResolvedValue([
      {
        createdAt: new Date('2025-01-10T10:00:00.000Z'),
        deliveredAt: new Date('2025-01-10T10:30:00.000Z'),
        deliveryPerson: { vehicleType: VehicleType.MOTORCYCLE },
      },
      {
        createdAt: new Date('2025-01-10T11:00:00.000Z'),
        deliveredAt: new Date('2025-01-10T11:50:00.000Z'),
        deliveryPerson: { vehicleType: VehicleType.BICYCLE },
      },
      {
        createdAt: new Date('2025-01-10T12:00:00.000Z'),
        deliveredAt: new Date('2025-01-10T12:40:00.000Z'),
        deliveryPerson: { vehicleType: VehicleType.MOTORCYCLE },
      },
    ]);

    const result = await service.getAverageDeliveryTime({});

    expect(result).toEqual({
      averageMinutes: 40,
      byVehicleType: [
        { averageMinutes: 35, count: 2, vehicleType: 'motorcycle' },
        { averageMinutes: 50, count: 1, vehicleType: 'bicycle' },
      ],
      fastestMinutes: 30,
      slowestMinutes: 50,
      totalDelivered: 3,
    });
  });

  it('returns all statuses even when a period has sparse distribution', async () => {
    repository.findOrdersForStatusBreakdown.mockResolvedValue([
      { status: OrderStatus.PENDING },
      { status: OrderStatus.DELIVERED },
      { status: OrderStatus.DELIVERED },
    ]);

    const result = await service.getOrdersByStatus({});

    expect(result).toEqual({
      data: [
        { count: 1, status: 'pending' },
        { count: 0, status: 'preparing' },
        { count: 0, status: 'ready' },
        { count: 0, status: 'delivering' },
        { count: 2, status: 'delivered' },
        { count: 0, status: 'cancelled' },
      ],
      total: 3,
    });
  });
});
