import {
  IsBoolean,
  IsEmail,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserDto {
  @IsEmail(
    {},
    { message: i18nValidationMessage('common.validation.invalid_email') },
  )
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds?: number[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
