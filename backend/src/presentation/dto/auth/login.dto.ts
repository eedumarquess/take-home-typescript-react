import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um email valido' })
  email!: string;

  @IsString({ message: 'A senha deve ser um texto valido' })
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres' })
  password!: string;
}
