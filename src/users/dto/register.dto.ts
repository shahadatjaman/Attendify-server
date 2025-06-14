import { IsNotEmpty, IsOptional, IsString, IsPhoneNumber, MinLength } from 'class-validator';

export class RegisterDto {

  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  blood?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
