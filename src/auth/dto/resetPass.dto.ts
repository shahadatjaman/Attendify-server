import { IsNotEmpty, IsEmail } from 'class-validator';

export class ResetPassDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
