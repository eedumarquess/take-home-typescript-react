import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { ProductCategoryValue } from '../common/enums/product-category.enum';
import { SortOrder } from '../common/enums/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { type ListProductsQueryDto, ProductSortBy } from './dto/list-products-query.dto';
import { productCategoryToPrisma } from './products.mapper';

export type SaveProductInput = {
  name: string;
  description: string;
  price: number;
  category: ProductCategoryValue;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findMany(query: ListProductsQueryDto) {
    return this.prismaService.product.findMany({
      orderBy: this.buildOrderBy(query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: this.buildWhere(query),
    });
  }

  count(query: ListProductsQueryDto) {
    return this.prismaService.product.count({
      where: this.buildWhere(query),
    });
  }

  findById(id: string) {
    return this.prismaService.product.findUnique({
      where: { id },
    });
  }

  create(input: SaveProductInput) {
    return this.prismaService.product.create({
      data: this.toPersistenceInput(input),
    });
  }

  update(id: string, input: SaveProductInput) {
    return this.prismaService.product.update({
      data: this.toPersistenceInput(input),
      where: { id },
    });
  }

  delete(id: string) {
    return this.prismaService.product.delete({
      where: { id },
    });
  }

  countActiveOrderLinks(productId: string) {
    return this.prismaService.orderItem.count({
      where: {
        productId,
        order: {
          status: {
            in: [OrderStatus.PENDING, OrderStatus.PREPARING],
          },
        },
      },
    });
  }

  private buildWhere(query: ListProductsQueryDto): Prisma.ProductWhereInput {
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

  private buildOrderBy(query: ListProductsQueryDto): Prisma.ProductOrderByWithRelationInput {
    const direction =
      query.sortOrder === SortOrder.ASC ? Prisma.SortOrder.asc : Prisma.SortOrder.desc;

    switch (query.sortBy) {
      case ProductSortBy.NAME:
        return { name: direction };
      case ProductSortBy.PRICE:
        return { price: direction };
      default:
        return { createdAt: direction };
    }
  }

  private toPersistenceInput(input: SaveProductInput): Prisma.ProductUncheckedCreateInput {
    return {
      category: productCategoryToPrisma[input.category],
      description: input.description,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
      name: input.name,
      preparationTime: input.preparationTime,
      price: new Prisma.Decimal(input.price),
    };
  }
}
