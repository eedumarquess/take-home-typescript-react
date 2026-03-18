export type OptimizationAssignmentDto = {
  orderId: string;
  deliveryPersonId: string;
  estimatedDistanceKm: number;
  orderAddress: string;
  deliveryPersonName: string;
};

export type OptimizationUnassignedDto = {
  orderId: string;
  orderAddress: string;
  reason: string;
};

export type OptimizeAssignmentResponseDto = {
  assignments: OptimizationAssignmentDto[];
  unassigned: OptimizationUnassignedDto[];
  totalDistanceKm: number;
  algorithm: 'hungarian';
  executionTimeMs: number;
};
