export type VehicleType = 'bicycle' | 'motorcycle' | 'car';

export type DeliveryPerson = {
  id: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  isActive: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentOrderId: string | null;
};

export type DeliveryPersonListResponse = {
  data: DeliveryPerson[];
};

export type DeliveryPersonListQuery = {
  isActive?: boolean;
  available?: boolean;
};

export type SaveDeliveryPersonInput = {
  name: string;
  phone: string;
  vehicleType: VehicleType;
  isActive?: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
};
