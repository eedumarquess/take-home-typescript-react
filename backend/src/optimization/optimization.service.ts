import { performance } from 'node:perf_hooks';
import { Injectable } from '@nestjs/common';
import type { OptimizeAssignmentResponseDto } from './dto/optimize-assignment-response.dto';
import type {
  OptimizationDeliveryPersonCandidate,
  OptimizationOrderCandidate,
} from './optimization.repository';
import { OptimizationRepository } from './optimization.repository';

@Injectable()
export class OptimizationService {
  constructor(private readonly optimizationRepository: OptimizationRepository) {}

  async optimizeAssignment(): Promise<OptimizeAssignmentResponseDto> {
    const startedAt = performance.now();
    const [readyOrders, deliveryPersons] = await Promise.all([
      this.optimizationRepository.findReadyOrders(),
      this.optimizationRepository.findAvailableDeliveryPersons(),
    ]);

    const eligibleDeliveryPersons = deliveryPersons.filter(
      (deliveryPerson) =>
        deliveryPerson.currentLatitude !== null && deliveryPerson.currentLongitude !== null,
    );

    if (readyOrders.length === 0) {
      return this.buildResponse([], [], startedAt);
    }

    if (eligibleDeliveryPersons.length === 0) {
      return this.buildResponse(
        [],
        readyOrders.map((order) => ({
          orderAddress: order.deliveryAddress,
          orderId: order.id,
          reason: 'No available delivery person',
        })),
        startedAt,
      );
    }

    const costMatrix = buildCostMatrix(readyOrders, eligibleDeliveryPersons);
    const squareCostMatrix = toSquareMatrix(costMatrix);
    const assignmentIndexes = solveHungarian(squareCostMatrix);
    const assignments: OptimizeAssignmentResponseDto['assignments'] = [];
    const assignedOrderIds = new Set<string>();

    for (const [orderIndex, deliveryPersonIndex] of assignmentIndexes.entries()) {
      if (deliveryPersonIndex < 0 || deliveryPersonIndex >= eligibleDeliveryPersons.length) {
        continue;
      }

      const order = readyOrders[orderIndex];

      if (!order) {
        continue;
      }

      const deliveryPerson = eligibleDeliveryPersons[deliveryPersonIndex];
      const estimatedDistanceKm = roundDistance(costMatrix[orderIndex]?.[deliveryPersonIndex] ?? 0);

      assignments.push({
        deliveryPersonId: deliveryPerson.id,
        deliveryPersonName: deliveryPerson.name,
        estimatedDistanceKm,
        orderAddress: order.deliveryAddress,
        orderId: order.id,
      });
      assignedOrderIds.add(order.id);
    }

    const unassigned = readyOrders
      .filter((order) => !assignedOrderIds.has(order.id))
      .map((order) => ({
        orderAddress: order.deliveryAddress,
        orderId: order.id,
        reason: 'No available delivery person',
      }));

    return this.buildResponse(assignments, unassigned, startedAt);
  }

  private buildResponse(
    assignments: OptimizeAssignmentResponseDto['assignments'],
    unassigned: OptimizeAssignmentResponseDto['unassigned'],
    startedAt: number,
  ): OptimizeAssignmentResponseDto {
    const totalDistanceKm = roundDistance(
      assignments.reduce((sum, assignment) => sum + assignment.estimatedDistanceKm, 0),
    );

    return {
      algorithm: 'hungarian',
      assignments,
      executionTimeMs: Math.max(1, Math.round(performance.now() - startedAt)),
      totalDistanceKm,
      unassigned,
    };
  }
}

function buildCostMatrix(
  readyOrders: OptimizationOrderCandidate[],
  deliveryPersons: OptimizationDeliveryPersonCandidate[],
) {
  return readyOrders.map((order) =>
    deliveryPersons.map((deliveryPerson) =>
      haversineKm(
        Number(deliveryPerson.currentLatitude),
        Number(deliveryPerson.currentLongitude),
        Number(order.latitude),
        Number(order.longitude),
      ),
    ),
  );
}

function toSquareMatrix(matrix: number[][]) {
  const size = Math.max(matrix.length, matrix[0]?.length ?? 0);

  return Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, columnIndex) => matrix[rowIndex]?.[columnIndex] ?? 0),
  );
}

export function haversineKm(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const startLatitudeRadians = toRadians(startLatitude);
  const endLatitudeRadians = toRadians(endLatitude);

  const haversineValue =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversineValue));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function roundDistance(value: number) {
  return Math.round(value * 100) / 100;
}

function solveHungarian(costMatrix: number[][]) {
  const size = costMatrix.length;
  const rowPotentials = Array<number>(size + 1).fill(0);
  const columnPotentials = Array<number>(size + 1).fill(0);
  const columnMatches = Array<number>(size + 1).fill(0);
  const way = Array<number>(size + 1).fill(0);

  for (let row = 1; row <= size; row += 1) {
    columnMatches[0] = row;
    let column = 0;
    const minValues = Array<number>(size + 1).fill(Number.POSITIVE_INFINITY);
    const usedColumns = Array<boolean>(size + 1).fill(false);

    do {
      usedColumns[column] = true;
      const matchedRow = columnMatches[column] ?? 0;
      let delta = Number.POSITIVE_INFINITY;
      let nextColumn = 0;

      for (let candidateColumn = 1; candidateColumn <= size; candidateColumn += 1) {
        if (usedColumns[candidateColumn]) {
          continue;
        }

        const currentValue =
          costMatrix[matchedRow - 1]?.[candidateColumn - 1] -
          rowPotentials[matchedRow] -
          columnPotentials[candidateColumn];

        if (currentValue < minValues[candidateColumn]) {
          minValues[candidateColumn] = currentValue;
          way[candidateColumn] = column;
        }

        if (minValues[candidateColumn] < delta) {
          delta = minValues[candidateColumn];
          nextColumn = candidateColumn;
        }
      }

      for (let candidateColumn = 0; candidateColumn <= size; candidateColumn += 1) {
        const matchedCandidateRow = columnMatches[candidateColumn] ?? 0;

        if (usedColumns[candidateColumn]) {
          rowPotentials[matchedCandidateRow] += delta;
          columnPotentials[candidateColumn] -= delta;
          continue;
        }

        minValues[candidateColumn] -= delta;
      }

      column = nextColumn;
    } while ((columnMatches[column] ?? 0) !== 0);

    do {
      const previousColumn = way[column] ?? 0;
      columnMatches[column] = columnMatches[previousColumn] ?? 0;
      column = previousColumn;
    } while (column !== 0);
  }

  const assignment = Array<number>(size).fill(-1);

  for (let column = 1; column <= size; column += 1) {
    const row = columnMatches[column] ?? 0;

    if (row > 0) {
      assignment[row - 1] = column - 1;
    }
  }

  return assignment;
}
