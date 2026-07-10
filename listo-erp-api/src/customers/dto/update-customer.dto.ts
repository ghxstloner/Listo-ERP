import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'Customer name' })
  @IsString({
    message: i18nValidationMessage('common.validation.invalid_string', {
      field: 'name',
    }),
  })
  @IsOptional()
  @MinLength(1, {
    message: i18nValidationMessage('common.validation.min_length', {
      field: 'name',
      min: 1,
    }),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('common.validation.max_length', {
      field: 'name',
      max: 255,
    }),
  })
  name?: string;

  @ApiPropertyOptional({ description: 'Tax document type' })
  @IsString({
    message: i18nValidationMessage('common.validation.invalid_string', {
      field: 'taxDocumentType',
    }),
  })
  @IsOptional()
  @MaxLength(50, {
    message: i18nValidationMessage('common.validation.max_length', {
      field: 'taxDocumentType',
      max: 50,
    }),
  })
  taxDocumentType?: string;

  @ApiPropertyOptional({ description: 'NIT, RUC, RIF, or tax identifier' })
  @IsString({
    message: i18nValidationMessage('common.validation.invalid_string', {
      field: 'taxId',
    }),
  })
  @IsOptional()
  @MaxLength(50, {
    message: i18nValidationMessage('common.validation.max_length', {
      field: 'taxId',
      max: 50,
    }),
  })
  taxId?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsString({
    message: i18nValidationMessage('common.validation.invalid_string', {
      field: 'address',
    }),
  })
  @IsOptional()
  @MaxLength(500, {
    message: i18nValidationMessage('common.validation.max_length', {
      field: 'address',
      max: 500,
    }),
  })
  address?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString({
    message: i18nValidationMessage('common.validation.invalid_string', {
      field: 'phone',
    }),
  })
  @IsOptional()
  @MaxLength(50, {
    message: i18nValidationMessage('common.validation.max_length', {
      field: 'phone',
      max: 50,
    }),
  })
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsEmail(
    {},
    { message: i18nValidationMessage('common.validation.invalid_email') },
  )
  @IsOptional()
  @MaxLength(255, {
    message: i18nValidationMessage('common.validation.max_length', {
      field: 'email',
      max: 255,
    }),
  })
  email?: string;

  @ApiPropertyOptional({ description: 'Contact name' })
  @IsString({
    message: i18nValidationMessage('common.validation.invalid_string', {
      field: 'contactName',
    }),
  })
  @IsOptional()
  @MaxLength(255, {
    message: i18nValidationMessage('common.validation.max_length', {
      field: 'contactName',
      max: 255,
    }),
  })
  contactName?: string;

  @ApiPropertyOptional({ description: 'Active customer' })
  @IsBoolean({
    message: i18nValidationMessage('common.validation.invalid_boolean', {
      field: 'isActive',
    }),
  })
  @IsOptional()
  isActive?: boolean;
}
