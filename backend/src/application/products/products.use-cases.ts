import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { AppErrorCode } from '../../common/errors/app-error-code.enum';
import { Product } from '../../domain/products/product';
import type {
  IProductRepository,
  ListProductsQuery,
  SaveProductInput,
} from '../../domain/products/product.repository';
import { Money } from '../../domain/shared/money';
import { toProductResponse } from '../presenters/product.presenter';

type SaveProductCommand = {
  name: string;
  description: string;
  price: number;
  category: SaveProductInput['category'];
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
};

type PatchProductCommand = Partial<SaveProductCommand>;

@Injectable()
export class ListProductsUseCase {
  constructor(private readonly productsRepository: IProductRepository) {}

  async execute(query: ListProductsQuery) {
    const [items, total] = await Promise.all([
      this.productsRepository.findMany(query),
      this.productsRepository.count(query),
    ]);

    return {
      data: items.map(toProductResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }
}

@Injectable()
export class GetProductUseCase {
  constructor(private readonly productsRepository: IProductRepository) {}

  async execute(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw productNotFound();
    }

    return toProductResponse(product);
  }
}

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly productsRepository: IProductRepository) {}

  async execute(input: SaveProductCommand) {
    Product.create(toProductDraft(input));
    const product = await this.productsRepository.create(toSaveProductInput(input));

    return toProductResponse(product);
  }
}

@Injectable()
export class UpdateProductUseCase {
  constructor(private readonly productsRepository: IProductRepository) {}

  async execute(id: string, input: SaveProductCommand) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw productNotFound();
    }

    product.update(toProductDraft(input));
    const updatedProduct = await this.productsRepository.update(id, toSaveProductInput(input));

    return toProductResponse(updatedProduct);
  }
}

@Injectable()
export class PatchProductUseCase {
  constructor(private readonly productsRepository: IProductRepository) {}

  async execute(id: string, input: PatchProductCommand) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw productNotFound();
    }

    const currentProduct = product.toPrimitives();
    const nextProduct = {
      category: input.category ?? currentProduct.category,
      description: input.description ?? currentProduct.description,
      imageUrl: input.imageUrl ?? currentProduct.imageUrl ?? undefined,
      isAvailable: input.isAvailable ?? currentProduct.isAvailable,
      name: input.name ?? currentProduct.name,
      preparationTime: input.preparationTime ?? currentProduct.preparationTime,
      price: input.price ?? currentProduct.price.toNumber(),
    };

    product.update(toProductDraft(nextProduct));
    const updatedProduct = await this.productsRepository.update(
      id,
      toSaveProductInput(nextProduct),
    );

    return toProductResponse(updatedProduct);
  }
}

@Injectable()
export class DeleteProductUseCase {
  constructor(private readonly productsRepository: IProductRepository) {}

  async execute(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw productNotFound();
    }

    const activeLinks = await this.productsRepository.countActiveOrderLinks(id);

    if (activeLinks > 0) {
      throw new AppException(
        409,
        AppErrorCode.PRODUCT_IN_USE,
        "Nao e possivel deletar este produto pois ele esta vinculado a pedidos com status 'pending' ou 'preparing'",
        [],
      );
    }

    await this.productsRepository.delete(id);
  }
}

@Injectable()
export class ToggleAvailabilityUseCase {
  constructor(private readonly productsRepository: IProductRepository) {}

  async execute(id: string, isAvailable: boolean) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw productNotFound();
    }

    const currentProduct = product.toPrimitives();
    const nextProduct = product.update({
      category: currentProduct.category,
      description: currentProduct.description,
      imageUrl: currentProduct.imageUrl,
      isAvailable,
      name: currentProduct.name,
      preparationTime: currentProduct.preparationTime,
      price: currentProduct.price,
    });
    const updatedProduct = await this.productsRepository.update(id, {
      category: nextProduct.toPrimitives().category,
      description: nextProduct.toPrimitives().description,
      imageUrl: nextProduct.toPrimitives().imageUrl ?? undefined,
      isAvailable: nextProduct.toPrimitives().isAvailable,
      name: nextProduct.toPrimitives().name,
      preparationTime: nextProduct.toPrimitives().preparationTime,
      price: nextProduct.toPrimitives().price,
    });

    return toProductResponse(updatedProduct);
  }
}

function toSaveProductInput(input: SaveProductCommand): SaveProductInput {
  return {
    ...input,
    price: Money.fromNumber(input.price),
  };
}

function toProductDraft(input: SaveProductCommand) {
  return {
    ...input,
    imageUrl: input.imageUrl ?? null,
    price: Money.fromNumber(input.price),
  };
}

function productNotFound() {
  return new AppException(404, AppErrorCode.PRODUCT_NOT_FOUND, 'Produto nao encontrado', []);
}
