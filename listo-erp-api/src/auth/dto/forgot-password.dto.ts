import { IsEmail, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ForgotPasswordDto {
  @IsEmail(
    {},
    { message: i18nValidationMessage('common.validation.invalid_email') },
  )
  @IsNotEmpty()
  email: string;
}
