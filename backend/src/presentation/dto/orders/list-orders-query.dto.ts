import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { OrderStatusValue } from '../../../common/enums/order-status.enum';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { IsOrderedDateRange } from '../../../common/validators/date-range-order.validator';

export enum OrderSortBy {
  CREATED_AT = 'createdAt',
  TOTAL_AMOUNT = 'totalAmount',
}

export class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatusValue)
  status?: OrderStatusValue;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @IsOrderedDateRange('startDate')
  endDate?: string;

  @IsOptional()
  @IsEnum(OrderSortBy)
  sortBy: OrderSortBy = OrderSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
