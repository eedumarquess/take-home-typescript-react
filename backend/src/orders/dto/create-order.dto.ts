import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateOrderItemDto {
  @IsUUID('4', { message: 'O produto informado e invalido' })
  productId!: string;

  @IsInt({ message: 'A quantidade deve ser um numero inteiro maior que zero' })
  @Min(1, { message: 'A quantidade deve ser um numero inteiro maior que zero' })
  quantity!: number;
}

export class CreateOrderDto {
  @IsString({ message: 'O nome do cliente deve ser um texto valido' })
  @Length(3, 100, { message: 'O nome do cliente deve ter entre 3 e 100 caracteres' })
  customerName!: string;

  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'O telefone deve seguir o formato (11) 91234-5678',
  })
  customerPhone!: string;

  @IsString({ message: 'O endereco de entrega deve ser um texto valido' })
  @Length(10, 300, { message: 'O endereco de entrega deve ter entre 10 e 300 caracteres' })
  deliveryAddress!: string;

  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 8 },
    { message: 'A latitude deve ser um numero valido' },
  )
  @Min(-90, { message: 'A latitude deve estar entre -90 e 90' })
  @Max(90, { message: 'A latitude deve estar entre -90 e 90' })
  latitude!: number;

  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 8 },
    { message: 'A longitude deve ser um numero valido' },
  )
  @Min(-180, { message: 'A longitude deve estar entre -180 e 180' })
  @Max(180, { message: 'A longitude deve estar entre -180 e 180' })
  longitude!: number;

  @IsArray({ message: 'Os itens do pedido devem ser enviados em uma lista' })
  @ArrayMinSize(1, { message: 'O pedido deve conter ao menos um item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export type CreateOrderItemInput = CreateOrderItemDto;
