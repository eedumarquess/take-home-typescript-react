import { requestJson } from '../../services/api';
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

function buildQueryString(query: DeliveryPersonListQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : '';
}
