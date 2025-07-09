// src/logs/dto/create-log.dto.ts
import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsBoolean } from 'class-validator';

export class CreateLogDto {
  @IsMongoId()
  @IsOptional()
  employee?: string;

  @IsString()
  @IsNotEmpty()
  logDate: string;

  @IsString()
  @IsOptional()
  checkInAt?: string;

  @IsString()
  @IsOptional()
  checkOutAt?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  verifyType?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsMongoId()
  @IsOptional()
  shiftId?: string;
}
