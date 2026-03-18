import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from '../../common/utils/transforms.util';

export class ListDeliveryPersonsQueryDto {
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  available?: boolean;
}
