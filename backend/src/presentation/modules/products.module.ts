import { Module } from '@nestjs/common';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  ToggleAvailabilityUseCase,
  UpdateProductUseCase,
} from '../../application/products/products.use-cases';
import { APPLICATION_TOKENS } from '../../application/tokens';
import { PrismaProductRepository } from '../../infrastructure/prisma/prisma-product.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductsController } from '../controllers/products.controller';

@Module({
  controllers: [ProductsController],
  imports: [PrismaModule],
  providers: [
    {
      provide: APPLICATION_TOKENS.PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: ListProductsUseCase,
      useFactory: (productsRepository: PrismaProductRepository) =>
        new ListProductsUseCase(productsRepository),
      inject: [APPLICATION_TOKENS.PRODUCT_REPOSITORY],
    },
    {
      provide: GetProductUseCase,
      useFactory: (productsRepository: PrismaProductRepository) =>
        new GetProductUseCase(productsRepository),
      inject: [APPLICATION_TOKENS.PRODUCT_REPOSITORY],
    },
    {
      provide: CreateProductUseCase,
      useFactory: (productsRepository: PrismaProductRepository) =>
        new CreateProductUseCase(productsRepository),
      inject: [APPLICATION_TOKENS.PRODUCT_REPOSITORY],
    },
    {
      provide: UpdateProductUseCase,
      useFactory: (productsRepository: PrismaProductRepository) =>
        new UpdateProductUseCase(productsRepository),
      inject: [APPLICATION_TOKENS.PRODUCT_REPOSITORY],
    },
    {
      provide: DeleteProductUseCase,
      useFactory: (productsRepository: PrismaProductRepository) =>
        new DeleteProductUseCase(productsRepository),
      inject: [APPLICATION_TOKENS.PRODUCT_REPOSITORY],
    },
    {
      provide: ToggleAvailabilityUseCase,
      useFactory: (productsRepository: PrismaProductRepository) =>
        new ToggleAvailabilityUseCase(productsRepository),
      inject: [APPLICATION_TOKENS.PRODUCT_REPOSITORY],
    },
  ],
})
export class ProductsModule {}
