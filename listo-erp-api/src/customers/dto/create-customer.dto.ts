import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name or legal name' })
  @IsString({
    message: i18nValidationMessage('common.validation.invalid_string', {
      field: 'name',
    }),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('common.validation.required_field', {
      field: 'name',
    }),
  })
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
  name: string;

  @ApiPropertyOptional({ description: 'Tax document type' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxDocumentType?: string;

  @ApiPropertyOptional({ description: 'Tax identifier' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Indicates a final consumer',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFinalConsumer?: boolean;

  @ApiPropertyOptional({
    description: 'DIAN person type: 1 legal, 2 natural',
    enum: ['1', '2'],
  })
  @IsString()
  @IsIn(['1', '2'])
  @IsOptional()
  fiscalPersonType?: string;

  @ApiPropertyOptional({ description: 'NIT verification digit' })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  taxCheckDigit?: string;

  @ApiPropertyOptional({ description: 'Active customer', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
