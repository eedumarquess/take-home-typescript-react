import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProductCategoryValue } from '../../common/enums/product-category.enum';
import { SortOrder } from '../../common/enums/sort-order.enum';
import { toBoolean } from '../../common/utils/transforms.util';

export enum ProductSortBy {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
}

export class ListProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(ProductCategoryValue)
  category?: ProductCategoryValue;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy: ProductSortBy = ProductSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
