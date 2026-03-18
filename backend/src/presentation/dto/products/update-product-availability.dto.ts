import { IsBoolean } from 'class-validator';

export class UpdateProductAvailabilityDto {
  @IsBoolean({ message: 'A disponibilidade deve ser booleana' })
  isAvailable!: boolean;
}
