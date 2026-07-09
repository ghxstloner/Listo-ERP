import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  confirmPassword: string;
}
