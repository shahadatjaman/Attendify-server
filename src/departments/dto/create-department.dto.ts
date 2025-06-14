import { IsNotEmpty, IsOptional, IsString, IsArray, IsMongoId } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  deptName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  manager?: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  employees?: string[];
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  deptName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  manager?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  employees?: string[];
}
