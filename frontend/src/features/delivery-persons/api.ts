import { requestJson } from '../../services/api';
import { buildQueryString } from '../../services/query-string';
import type {
  DeliveryPerson,
  DeliveryPersonListQuery,
  DeliveryPersonListResponse,
  SaveDeliveryPersonInput,
} from './types';

export async function listDeliveryPersons(query: DeliveryPersonListQuery = {}) {
  return requestJson<DeliveryPersonListResponse>(`/delivery-persons${buildQueryString(query)}`);
}

export async function createDeliveryPerson(payload: SaveDeliveryPersonInput) {
  return requestJson<DeliveryPerson>('/delivery-persons', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function updateDeliveryPerson(id: string, payload: SaveDeliveryPersonInput) {
  return requestJson<DeliveryPerson>(`/delivery-persons/${id}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

export async function deleteDeliveryPerson(id: string) {
  return requestJson<void>(`/delivery-persons/${id}`, {
    method: 'DELETE',
  });
}
