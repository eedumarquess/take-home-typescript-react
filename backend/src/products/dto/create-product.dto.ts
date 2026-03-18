import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategoryValue } from '../../common/enums/product-category.enum';

export class CreateProductDto {
  @IsString({ message: 'O nome deve ser um texto valido' })
  @Length(3, 120, { message: 'O nome deve ter entre 3 e 120 caracteres' })
  name!: string;

  @IsString({ message: 'A descricao deve ser um texto valido' })
  @Length(10, 500, { message: 'A descricao deve ter entre 10 e 500 caracteres' })
  description!: string;

  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'O preco deve ser maior que zero e ter no maximo 2 casas decimais' },
  )
  @Min(0.01, { message: 'O preco deve ser maior que zero' })
  @Max(99999999.99, { message: 'O preco informado e invalido' })
  price!: number;

  @IsEnum(ProductCategoryValue, {
    message: 'A categoria deve ser meal, drink, dessert ou side',
  })
  category!: ProductCategoryValue;

  @IsOptional()
  @MaxLength(500, { message: 'A imagem deve ter no maximo 500 caracteres' })
  @IsUrl({}, { message: 'A imagem deve ser uma URL valida' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'A disponibilidade deve ser booleana' })
  isAvailable = true;

  @IsInt({ message: 'O tempo de preparo deve ser um numero inteiro entre 1 e 120' })
  @Min(1, { message: 'O tempo de preparo deve ser um numero inteiro entre 1 e 120' })
  @Max(120, { message: 'O tempo de preparo deve ser um numero inteiro entre 1 e 120' })
  preparationTime!: number;
}
