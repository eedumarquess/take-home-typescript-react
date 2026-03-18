import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { VehicleTypeValue } from '../../common/enums/vehicle-type.enum';

export class CreateDeliveryPersonDto {
  @IsString({ message: 'O nome deve ser um texto valido' })
  @Length(3, 100, { message: 'O nome deve ter entre 3 e 100 caracteres' })
  name!: string;

  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'O telefone deve seguir o formato (11) 91234-5678',
  })
  phone!: string;

  @IsEnum(VehicleTypeValue, {
    message: 'O tipo de veiculo deve ser bicycle, motorcycle ou car',
  })
  vehicleType!: VehicleTypeValue;

  @IsOptional()
  @IsBoolean({ message: 'O status ativo deve ser booleano' })
  isActive = true;

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 8 },
    { message: 'A latitude atual deve ser um numero valido' },
  )
  @Min(-90, { message: 'A latitude atual deve estar entre -90 e 90' })
  @Max(90, { message: 'A latitude atual deve estar entre -90 e 90' })
  currentLatitude?: number;

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 8 },
    { message: 'A longitude atual deve ser um numero valido' },
  )
  @Min(-180, { message: 'A longitude atual deve estar entre -180 e 180' })
  @Max(180, { message: 'A longitude atual deve estar entre -180 e 180' })
  currentLongitude?: number;
}
