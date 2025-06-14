import { IsArray, IsMongoId, IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';
import { IsEndTimeAfterStartTime } from '../validators/end-after-start.validator';

export class CreateShiftDto {
  @IsNotEmpty()
  @IsMongoId()
  dep: string;

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
  employees?: string[];
}
