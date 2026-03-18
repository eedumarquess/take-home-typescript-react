import type { Coordinates } from '../shared/coordinates';

export type AssignmentOrderCandidate = {
  id: string;
  deliveryAddress: string;
  coordinates: Coordinates;
};

export type AssignmentDeliveryPersonCandidate = {
  id: string;
  name: string;
  coordinates: Coordinates;
};

export type AssignmentResult = {
  assignments: Array<{
    orderId: string;
    orderAddress: string;
    deliveryPersonId: string;
    deliveryPersonName: string;
    estimatedDistanceKm: number;
  }>;
  unassigned: Array<{
    orderId: string;
    orderAddress: string;
    reason: string;
  }>;
  totalDistanceKm: number;
};

export interface IAssignmentAlgorithm {
  optimize(
    orders: AssignmentOrderCandidate[],
    deliveryPersons: AssignmentDeliveryPersonCandidate[],
  ): AssignmentResult;
}
