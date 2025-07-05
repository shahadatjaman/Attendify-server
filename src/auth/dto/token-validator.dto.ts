import { IsString, MinLength } from 'class-validator';

export class TokenValidatorDto {
  @IsString({ message: 'Token must be a string' })
  token: string;
}
