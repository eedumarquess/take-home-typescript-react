import { Coordinates } from '../../domain/shared/coordinates';
import { HungarianAssignmentAlgorithm } from './hungarian-assignment.algorithm';

describe('HungarianAssignmentAlgorithm', () => {
  const algorithm = new HungarianAssignmentAlgorithm();

  it('builds optimized assignments and returns total distance metadata', () => {
    const result = algorithm.optimize(
      [
        {
          coordinates: new Coordinates(-23.55055, -46.63331),
          deliveryAddress: 'Rua Augusta, 10',
          id: 'order-1',
        },
        {
          coordinates: new Coordinates(-23.56141, -46.65657),
          deliveryAddress: 'Av. Paulista, 1000',
          id: 'order-2',
        },
      ],
      [
        {
          coordinates: new Coordinates(-23.55052, -46.63334),
          id: 'delivery-1',
          name: 'Carlos Santos',
        },
        {
          coordinates: new Coordinates(-23.56143, -46.65651),
          id: 'delivery-2',
          name: 'Ana Souza',
        },
      ],
    );

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

  it('marks orders as unassigned when demand exceeds supply', () => {
    const result = algorithm.optimize(
      [
        {
          coordinates: new Coordinates(-23.5505, -46.6333),
          deliveryAddress: 'Rua das Flores, 123',
          id: 'order-1',
        },
        {
          coordinates: new Coordinates(-23.553, -46.631),
          deliveryAddress: 'Av. Brasil, 200',
          id: 'order-2',
        },
      ],
      [
        {
          coordinates: new Coordinates(-23.55052, -46.63334),
          id: 'delivery-1',
          name: 'Carlos Santos',
        },
      ],
    );

    expect(result.assignments).toHaveLength(1);
    expect(result.unassigned).toEqual([
      {
        orderAddress: 'Av. Brasil, 200',
        orderId: 'order-2',
        reason: 'No available delivery person',
      },
    ]);
  });
});
