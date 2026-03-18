import { requestJson } from '../../services/api';
import { buildQueryString } from '../../services/query-string';
import type { Product, ProductListQuery, ProductListResponse, SaveProductInput } from './types';

export async function listProducts(query: ProductListQuery = {}) {
  return requestJson<ProductListResponse>(`/products${buildQueryString(query)}`);
}

export async function getProduct(id: string) {
  return requestJson<Product>(`/products/${id}`);
}

export async function createProduct(payload: SaveProductInput) {
  return requestJson<Product>('/products', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function updateProduct(id: string, payload: SaveProductInput) {
  return requestJson<Product>(`/products/${id}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

export async function patchProduct(id: string, payload: Partial<SaveProductInput>) {
  return requestJson<Product>(`/products/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

export async function updateProductAvailability(id: string, isAvailable: boolean) {
  return requestJson<Product>(`/products/${id}/availability`, {
    body: JSON.stringify({ isAvailable }),
    method: 'PATCH',
  });
}

export async function deleteProduct(id: string) {
  return requestJson<void>(`/products/${id}`, {
    method: 'DELETE',
  });
}
