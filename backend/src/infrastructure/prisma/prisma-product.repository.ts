import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { SortOrder } from '../../common/enums/sort-order.enum';
import type {
  IProductRepository,
  ListProductsQuery,
  SaveProductInput,
} from '../../domain/products/product.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { productCategoryToPrisma, toDecimal, toProductDomain } from './prisma.mappers';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(query: ListProductsQuery) {
    const products = await this.prismaService.product.findMany({
      orderBy: this.buildOrderBy(query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: this.buildWhere(query),
    });

    return products.map(toProductDomain);
  }

  count(query: ListProductsQuery) {
    return this.prismaService.product.count({
      where: this.buildWhere(query),
    });
  }

  async findById(id: string) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });

    return product ? toProductDomain(product) : null;
  }

  async findByIds(ids: string[]) {
    const products = await this.prismaService.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return products.map(toProductDomain);
  }

  async create(input: SaveProductInput) {
    const product = await this.prismaService.product.create({
      data: {
        category: productCategoryToPrisma[input.category],
        description: input.description,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable,
        name: input.name,
        preparationTime: input.preparationTime,
        price: toDecimal(input.price.toNumber()),
      },
    });

    return toProductDomain(product);
  }

  async update(id: string, input: SaveProductInput) {
    const product = await this.prismaService.product.update({
      data: {
        category: productCategoryToPrisma[input.category],
        description: input.description,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable,
        name: input.name,
        preparationTime: input.preparationTime,
        price: toDecimal(input.price.toNumber()),
      },
      where: { id },
    });

    return toProductDomain(product);
  }

  delete(id: string) {
    return this.prismaService.product
      .delete({
        where: { id },
      })
      .then(() => undefined);
  }

  countActiveOrderLinks(productId: string) {
    return this.prismaService.orderItem.count({
      where: {
        order: {
          status: {
            in: [OrderStatus.PENDING, OrderStatus.PREPARING],
          },
        },
        productId,
      },
    });
  }

  private buildWhere(query: ListProductsQuery): Prisma.ProductWhereInput {
    return {
      category: query.category ? productCategoryToPrisma[query.category] : undefined,
      isAvailable: query.isAvailable,
      name: query.search
        ? {
            contains: query.search.trim(),
            mode: 'insensitive',
          }
        : undefined,
    };
  }

  private buildOrderBy(query: ListProductsQuery): Prisma.ProductOrderByWithRelationInput {
    const direction =
      query.sortOrder === SortOrder.ASC ? Prisma.SortOrder.asc : Prisma.SortOrder.desc;

    switch (query.sortBy) {
      case 'name':
        return { name: direction };
      case 'price':
        return { price: direction };
      default:
        return { createdAt: direction };
    }
  }
}
