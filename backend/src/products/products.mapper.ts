import type { Product } from '@prisma/client';
import { ProductCategory } from '@prisma/client';
import { ProductCategoryValue } from '../common/enums/product-category.enum';

export type ProductResponse = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategoryValue;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: Date;
  updatedAt: Date;
};

export const productCategoryToPrisma: Record<ProductCategoryValue, ProductCategory> = {
  [ProductCategoryValue.MEAL]: ProductCategory.MEAL,
  [ProductCategoryValue.DRINK]: ProductCategory.DRINK,
  [ProductCategoryValue.DESSERT]: ProductCategory.DESSERT,
  [ProductCategoryValue.SIDE]: ProductCategory.SIDE,
};

const productCategoryFromPrisma: Record<ProductCategory, ProductCategoryValue> = {
  [ProductCategory.MEAL]: ProductCategoryValue.MEAL,
  [ProductCategory.DRINK]: ProductCategoryValue.DRINK,
  [ProductCategory.DESSERT]: ProductCategoryValue.DESSERT,
  [ProductCategory.SIDE]: ProductCategoryValue.SIDE,
};

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category: productCategoryFromPrisma[product.category],
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    preparationTime: product.preparationTime,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
