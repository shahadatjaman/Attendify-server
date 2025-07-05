import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
