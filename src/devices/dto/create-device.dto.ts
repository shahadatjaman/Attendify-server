import { IsNotEmpty, IsString, IsIP, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty()
  @IsString()
  deviceName: string;

  @IsNotEmpty()
  @IsIP()
  deviceIp: string;

  @IsNotEmpty()
  @IsString()
  devicePort: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  users?: string[];
}
