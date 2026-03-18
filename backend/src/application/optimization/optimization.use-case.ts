import { Injectable } from '@nestjs/common';
import type { IDeliveryPersonRepository } from '../../domain/delivery-persons/delivery-person.repository';
import type { IAssignmentAlgorithm } from '../../domain/optimization/assignment-algorithm';
import type { IOrderRepository } from '../../domain/orders/order.repository';

@Injectable()
export class OptimizeAssignmentUseCase {
  constructor(
    private readonly ordersRepository: IOrderRepository,
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
    private readonly assignmentAlgorithm: IAssignmentAlgorithm,
  ) {}

  async execute() {
    const startedAt = performance.now();
    const [readyOrders, deliveryPersons] = await Promise.all([
      this.ordersRepository.findReadyOrders(),
      this.deliveryPersonRepository.findAvailable(),
    ]);

    const eligibleDeliveryPersons = deliveryPersons
      .filter((deliveryPerson) => deliveryPerson.toPrimitives().currentLocation !== null)
      .flatMap((deliveryPerson) => {
        const currentLocation = deliveryPerson.toPrimitives().currentLocation;

        if (currentLocation === null) {
          return [];
        }

        return [
          {
            coordinates: currentLocation,
            id: deliveryPerson.toPrimitives().id,
            name: deliveryPerson.toPrimitives().name,
          },
        ];
      })
      .sort((left, right) => left.id.localeCompare(right.id));
    const sortedReadyOrders = [...readyOrders].sort(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id),
    );

    if (sortedReadyOrders.length === 0) {
      return {
        algorithm: 'hungarian',
        assignments: [],
        executionTimeMs: Math.max(1, Math.round(performance.now() - startedAt)),
        totalDistanceKm: 0,
        unassigned: [],
      };
    }

    if (eligibleDeliveryPersons.length === 0) {
      return {
        algorithm: 'hungarian',
        assignments: [],
        executionTimeMs: Math.max(1, Math.round(performance.now() - startedAt)),
        totalDistanceKm: 0,
        unassigned: sortedReadyOrders.map((order) => ({
          orderAddress: order.deliveryAddress,
          orderId: order.id,
          reason: 'No available delivery person',
        })),
      };
    }

    const result = this.assignmentAlgorithm.optimize(
      sortedReadyOrders.map((order) => ({
        coordinates: order.coordinates,
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        id: order.id,
      })),
      eligibleDeliveryPersons,
    );

    return {
      algorithm: 'hungarian',
      assignments: result.assignments,
      executionTimeMs: Math.max(1, Math.round(performance.now() - startedAt)),
      totalDistanceKm: result.totalDistanceKm,
      unassigned: result.unassigned,
    };
  }
}
