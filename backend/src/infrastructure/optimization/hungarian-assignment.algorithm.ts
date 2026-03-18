import { Injectable } from '@nestjs/common';
import type {
  AssignmentDeliveryPersonCandidate,
  AssignmentOrderCandidate,
  AssignmentResult,
  IAssignmentAlgorithm,
} from '../../domain/optimization/assignment-algorithm';

const MAX_ASSIGNMENT_DISTANCE_KM = 10;
const DUMMY_ASSIGNMENT_COST = 1000;
const UNASSIGNABLE_COST = 1000000;
const ORDER_TIE_BREAK_WEIGHT = 1e-6;
const DELIVERY_TIE_BREAK_WEIGHT = 1e-9;

@Injectable()
export class HungarianAssignmentAlgorithm implements IAssignmentAlgorithm {
  optimize(
    orders: AssignmentOrderCandidate[],
    deliveryPersons: AssignmentDeliveryPersonCandidate[],
  ): AssignmentResult {
    const sortedOrders = [...orders].sort(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id),
    );
    const sortedDeliveryPersons = [...deliveryPersons].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    const rawDistanceMatrix = sortedOrders.map((order) =>
      sortedDeliveryPersons.map((deliveryPerson) =>
        order.coordinates.haversineDistanceTo(deliveryPerson.coordinates),
      ),
    );
    const costMatrix = sortedOrders.map((_, orderIndex) => [
      ...sortedDeliveryPersons.map((__, deliveryPersonIndex) =>
        toAssignmentCost(
          rawDistanceMatrix[orderIndex]?.[deliveryPersonIndex] ?? UNASSIGNABLE_COST,
          {
            deliveryPersonIndex,
            orderIndex,
          },
        ),
      ),
      ...Array.from({ length: sortedOrders.length }, () => DUMMY_ASSIGNMENT_COST),
    ]);
    const squareCostMatrix = toSquareMatrix(costMatrix, DUMMY_ASSIGNMENT_COST);
    const assignmentIndexes = solveHungarian(squareCostMatrix);
    const assignments: AssignmentResult['assignments'] = [];
    const assignedOrderIds = new Set<string>();

    for (const [orderIndex, deliveryPersonIndex] of assignmentIndexes.entries()) {
      if (deliveryPersonIndex < 0 || deliveryPersonIndex >= sortedDeliveryPersons.length) {
        continue;
      }

      const order = sortedOrders[orderIndex];

      if (!order) {
        continue;
      }

      const deliveryPerson = sortedDeliveryPersons[deliveryPersonIndex];
      const estimatedDistanceKm = roundDistance(
        rawDistanceMatrix[orderIndex]?.[deliveryPersonIndex] ?? UNASSIGNABLE_COST,
      );

      if (estimatedDistanceKm > MAX_ASSIGNMENT_DISTANCE_KM) {
        continue;
      }

      assignments.push({
        deliveryPersonId: deliveryPerson.id,
        deliveryPersonName: deliveryPerson.name,
        estimatedDistanceKm,
        orderAddress: order.deliveryAddress,
        orderId: order.id,
      });
      assignedOrderIds.add(order.id);
    }

    const orderedAssignments = assignments.sort(
      (left, right) =>
        left.estimatedDistanceKm - right.estimatedDistanceKm ||
        (sortedOrders.find((order) => order.id === left.orderId)?.createdAt.getTime() ?? 0) -
          (sortedOrders.find((order) => order.id === right.orderId)?.createdAt.getTime() ?? 0) ||
        left.deliveryPersonId.localeCompare(right.deliveryPersonId),
    );
    const unassigned = sortedOrders
      .filter((order) => !assignedOrderIds.has(order.id))
      .map((order) => ({
        orderAddress: order.deliveryAddress,
        orderId: order.id,
        reason: 'No available delivery person',
      }));

    return {
      assignments: orderedAssignments,
      totalDistanceKm: roundDistance(
        orderedAssignments.reduce((sum, assignment) => sum + assignment.estimatedDistanceKm, 0),
      ),
      unassigned,
    };
  }
}

function toSquareMatrix(matrix: number[][], fillValue: number) {
  const size = Math.max(matrix.length, matrix[0]?.length ?? 0);

  return Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, columnIndex) => matrix[rowIndex]?.[columnIndex] ?? fillValue),
  );
}

function roundDistance(value: number) {
  return Math.round(value * 100) / 100;
}

function toAssignmentCost(
  distanceKm: number,
  tieBreak: { orderIndex: number; deliveryPersonIndex: number },
) {
  if (distanceKm > MAX_ASSIGNMENT_DISTANCE_KM) {
    return UNASSIGNABLE_COST;
  }

  return (
    distanceKm +
    tieBreak.orderIndex * ORDER_TIE_BREAK_WEIGHT +
    tieBreak.deliveryPersonIndex * DELIVERY_TIE_BREAK_WEIGHT
  );
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
