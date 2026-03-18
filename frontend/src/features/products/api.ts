import { requestJson } from '../../services/api';
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

export async function deleteProduct(id: string) {
  return requestJson<void>(`/products/${id}`, {
    method: 'DELETE',
  });
}

function buildQueryString(query: ProductListQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') {
      continue;
    }

    params.set(key, String(value));
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : '';
}
