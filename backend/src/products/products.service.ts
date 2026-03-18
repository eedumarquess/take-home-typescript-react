import { Injectable } from '@nestjs/common';
import { AppException } from '../common/errors/app.exception';
import { AppErrorCode } from '../common/errors/app-error-code.enum';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ListProductsQueryDto } from './dto/list-products-query.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { toProductResponse } from './products.mapper';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async list(query: ListProductsQueryDto) {
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

  async getById(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppException(404, AppErrorCode.PRODUCT_NOT_FOUND, 'Produto nao encontrado', []);
    }

    return toProductResponse(product);
  }

  async create(input: CreateProductDto) {
    const product = await this.productsRepository.create({
      category: input.category,
      description: input.description,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
      name: input.name,
      preparationTime: input.preparationTime,
      price: input.price,
    });

    return toProductResponse(product);
  }

  async update(id: string, input: UpdateProductDto) {
    await this.ensureExists(id);

    const product = await this.productsRepository.update(id, {
      category: input.category,
      description: input.description,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
      name: input.name,
      preparationTime: input.preparationTime,
      price: input.price,
    });

    return toProductResponse(product);
  }

  async remove(id: string) {
    await this.ensureExists(id);

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

  private async ensureExists(id: string) {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new AppException(404, AppErrorCode.PRODUCT_NOT_FOUND, 'Produto nao encontrado', []);
    }

    return product;
  }
}
