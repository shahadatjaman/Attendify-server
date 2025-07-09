import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
  ArrayNotEmpty,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  status?: string;

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
  @IsString()
  manager?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class DeleteManyDepartmentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}
