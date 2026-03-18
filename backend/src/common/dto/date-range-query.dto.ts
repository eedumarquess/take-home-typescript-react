import { IsDateString, IsOptional } from 'class-validator';
import { IsOrderedDateRange } from '../validators/date-range-order.validator';

export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @IsOrderedDateRange('startDate')
  endDate?: string;
}
