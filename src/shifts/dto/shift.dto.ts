import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  ArrayNotEmpty,
} from 'class-validator';
import { IsEndTimeAfterStartTime } from '../validators/end-after-start.validator';
import { PartialType } from '@nestjs/mapped-types';
import { Types } from 'mongoose';
import { ObjectId } from 'mongoose';

export class CreateShiftDto {
  @IsNotEmpty()
  @IsMongoId({ each: true })
  dept: ObjectId;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startAt must be in HH:mm format' })
  startAt: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endAt must be in HH:mm format' })
  @IsEndTimeAfterStartTime('startAt', { message: 'endAt must be later than startAt' })
  endAt: string;

  @IsNotEmpty()
  @IsString()
  shiftName: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  employees?: Types.ObjectId[];

  @IsNotEmpty()
  @IsArray()
  days: string[];
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {}

export class DeleteManyDepartmentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}
