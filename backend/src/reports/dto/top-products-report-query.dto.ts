import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';
import { toNumber } from '../../common/utils/transforms.util';

export class TopProductsReportQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(10)
  limit = 10;
}
