import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsPhoneNumber,
  MinLength,
  IsEmail,
  IsMongoId,
} from 'class-validator';

export class UserDto {
  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  blood?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  avatarPath?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsNotEmpty()
  @IsMongoId()
  dept: string;

  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateUserDto extends PartialType(UserDto) {}
