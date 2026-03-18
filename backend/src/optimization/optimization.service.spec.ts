import { Prisma } from '@prisma/client';
import { haversineKm, OptimizationService } from './optimization.service';

describe('OptimizationService', () => {
  const repository = {
    findAvailableDeliveryPersons: jest.fn(),
    findReadyOrders: jest.fn(),
  };

  const service = new OptimizationService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds optimized assignments and returns total distance metadata', async () => {
    repository.findReadyOrders.mockResolvedValue([
      {
        deliveryAddress: 'Rua Augusta, 10',
        id: 'order-1',
        latitude: new Prisma.Decimal('-23.55055'),
        longitude: new Prisma.Decimal('-46.63331'),
      },
      {
        deliveryAddress: 'Av. Paulista, 1000',
        id: 'order-2',
        latitude: new Prisma.Decimal('-23.56141'),
        longitude: new Prisma.Decimal('-46.65657'),
      },
    ]);
    repository.findAvailableDeliveryPersons.mockResolvedValue([
      {
        currentLatitude: new Prisma.Decimal('-23.55052'),
        currentLongitude: new Prisma.Decimal('-46.63334'),
        id: 'delivery-1',
        name: 'Carlos Santos',
      },
      {
        currentLatitude: new Prisma.Decimal('-23.56143'),
        currentLongitude: new Prisma.Decimal('-46.65651'),
        id: 'delivery-2',
        name: 'Ana Souza',
      },
    ]);

    const result = await service.optimizeAssignment();

    expect(result.algorithm).toBe('hungarian');
    expect(result.executionTimeMs).toBeGreaterThan(0);
    expect(result.unassigned).toEqual([]);
    expect(result.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          deliveryPersonId: 'delivery-1',
          orderId: 'order-1',
        }),
        expect.objectContaining({
          deliveryPersonId: 'delivery-2',
          orderId: 'order-2',
        }),
      ]),
    );
    expect(result.totalDistanceKm).toBeCloseTo(
      result.assignments.reduce((sum, assignment) => sum + assignment.estimatedDistanceKm, 0),
      2,
    );
  });

  it('marks orders as unassigned when no delivery person has operational coordinates', async () => {
    repository.findReadyOrders.mockResolvedValue([
      {
        deliveryAddress: 'Rua das Flores, 123',
        id: 'order-1',
        latitude: new Prisma.Decimal('-23.5505'),
        longitude: new Prisma.Decimal('-46.6333'),
      },
      {
        deliveryAddress: 'Av. Brasil, 200',
        id: 'order-2',
        latitude: new Prisma.Decimal('-23.553'),
        longitude: new Prisma.Decimal('-46.631'),
      },
    ]);
    repository.findAvailableDeliveryPersons.mockResolvedValue([
      {
        currentLatitude: null,
        currentLongitude: null,
        id: 'delivery-1',
        name: 'Carlos Santos',
      },
    ]);

    const result = await service.optimizeAssignment();

    expect(result.assignments).toEqual([]);
    expect(result.totalDistanceKm).toBe(0);
    expect(result.unassigned).toEqual([
      {
        orderAddress: 'Rua das Flores, 123',
        orderId: 'order-1',
        reason: 'No available delivery person',
      },
      {
        orderAddress: 'Av. Brasil, 200',
        orderId: 'order-2',
        reason: 'No available delivery person',
      },
    ]);
  });

  it('calculates haversine distance in kilometers', () => {
    expect(haversineKm(-23.5505, -46.6333, -23.5505, -46.6333)).toBeCloseTo(0, 5);
    expect(haversineKm(-23.5505, -46.6333, -23.5614, -46.6566)).toBeGreaterThan(2);
  });
});
