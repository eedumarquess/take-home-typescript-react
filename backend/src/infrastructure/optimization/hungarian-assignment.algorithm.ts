import { Injectable } from '@nestjs/common';
import type {
  AssignmentDeliveryPersonCandidate,
  AssignmentOrderCandidate,
  AssignmentResult,
  IAssignmentAlgorithm,
} from '../../domain/optimization/assignment-algorithm';

@Injectable()
export class HungarianAssignmentAlgorithm implements IAssignmentAlgorithm {
  optimize(
    orders: AssignmentOrderCandidate[],
    deliveryPersons: AssignmentDeliveryPersonCandidate[],
  ): AssignmentResult {
    const costMatrix = orders.map((order) =>
      deliveryPersons.map((deliveryPerson) =>
        order.coordinates.haversineDistanceTo(deliveryPerson.coordinates),
      ),
    );
    const squareCostMatrix = toSquareMatrix(costMatrix);
    const assignmentIndexes = solveHungarian(squareCostMatrix);
    const assignments: AssignmentResult['assignments'] = [];
    const assignedOrderIds = new Set<string>();

    for (const [orderIndex, deliveryPersonIndex] of assignmentIndexes.entries()) {
      if (deliveryPersonIndex < 0 || deliveryPersonIndex >= deliveryPersons.length) {
        continue;
      }

      const order = orders[orderIndex];

      if (!order) {
        continue;
      }

      const deliveryPerson = deliveryPersons[deliveryPersonIndex];
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

    const unassigned = orders
      .filter((order) => !assignedOrderIds.has(order.id))
      .map((order) => ({
        orderAddress: order.deliveryAddress,
        orderId: order.id,
        reason: 'No available delivery person',
      }));

    return {
      assignments,
      totalDistanceKm: roundDistance(
        assignments.reduce((sum, assignment) => sum + assignment.estimatedDistanceKm, 0),
      ),
      unassigned,
    };
  }
}

function toSquareMatrix(matrix: number[][]) {
  const size = Math.max(matrix.length, matrix[0]?.length ?? 0);

  return Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, columnIndex) => matrix[rowIndex]?.[columnIndex] ?? 0),
  );
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
