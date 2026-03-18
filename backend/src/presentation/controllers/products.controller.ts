import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from '../../application/products/products.use-cases';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CreateProductDto } from '../dto/products/create-product.dto';
import { ListProductsQueryDto } from '../dto/products/list-products-query.dto';
import { UpdateProductDto } from '../dto/products/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  list(@Query() query: ListProductsQueryDto) {
    return this.listProductsUseCase.execute(query);
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  getById(@Param('id') id: string) {
    return this.getProductUseCase.execute(id);
  }

  @Post()
  @Roles(AppRole.ADMIN)
  create(@Body() body: CreateProductDto) {
    return this.createProductUseCase.execute(body);
  }

  @Put(':id')
  @Roles(AppRole.ADMIN)
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.updateProductUseCase.execute(id, {
      category: body.category,
      description: body.description,
      imageUrl: body.imageUrl,
      isAvailable: body.isAvailable,
      name: body.name,
      preparationTime: body.preparationTime,
      price: body.price,
    });
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteProductUseCase.execute(id);
  }
}
