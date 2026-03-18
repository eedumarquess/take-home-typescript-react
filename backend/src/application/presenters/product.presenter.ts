import type { Product } from '../../domain/products/product';

export function toProductResponse(product: Product) {
  const props = product.toPrimitives();

  return {
    id: props.id,
    name: props.name,
    description: props.description,
    price: props.price.toNumber(),
    category: props.category,
    imageUrl: props.imageUrl,
    isAvailable: props.isAvailable,
    preparationTime: props.preparationTime,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}
