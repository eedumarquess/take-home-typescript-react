import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  PatchProductUseCase,
  ToggleAvailabilityUseCase,
  UpdateProductUseCase,
} from '../../application/products/products.use-cases';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CreateProductDto } from '../dto/products/create-product.dto';
import { ListProductsQueryDto } from '../dto/products/list-products-query.dto';
import { PatchProductDto } from '../dto/products/patch-product.dto';
import { UpdateProductDto } from '../dto/products/update-product.dto';
import { UpdateProductAvailabilityDto } from '../dto/products/update-product-availability.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly patchProductUseCase: PatchProductUseCase,
    private readonly toggleAvailabilityUseCase: ToggleAvailabilityUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  list(@Query() query: ListProductsQueryDto) {
    return this.listProductsUseCase.execute(query);
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.getProductUseCase.execute(id);
  }

  @Post()
  @Roles(AppRole.ADMIN)
  create(@Body() body: CreateProductDto) {
    return this.createProductUseCase.execute(body);
  }

  @Put(':id')
  @Roles(AppRole.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateProductDto,
  ) {
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

  @Patch(':id')
  @Roles(AppRole.ADMIN)
  patch(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: PatchProductDto,
  ) {
    return this.patchProductUseCase.execute(id, body);
  }

  @Patch(':id/availability')
  @Roles(AppRole.ADMIN)
  updateAvailability(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateProductAvailabilityDto,
  ) {
    return this.toggleAvailabilityUseCase.execute(id, body.isAvailable);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    await this.deleteProductUseCase.execute(id);
  }
}
