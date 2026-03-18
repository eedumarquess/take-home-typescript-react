import { SortOrder } from '../../common/enums/sort-order.enum';
import type { Money } from '../shared/money';
import type { Product } from './product';
import type { ProductCategoryValue } from './product-category.enum';

export type ListProductsQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: ProductCategoryValue;
  isAvailable?: boolean;
  sortBy: 'createdAt' | 'name' | 'price';
  sortOrder: SortOrder;
};

export type SaveProductInput = {
  name: string;
  description: string;
  price: Money;
  category: ProductCategoryValue;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
};

export interface IProductRepository {
  findMany(query: ListProductsQuery): Promise<Product[]>;
  count(query: ListProductsQuery): Promise<number>;
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  create(input: SaveProductInput): Promise<Product>;
  update(id: string, input: SaveProductInput): Promise<Product>;
  delete(id: string): Promise<void>;
  countActiveOrderLinks(productId: string): Promise<number>;
}
