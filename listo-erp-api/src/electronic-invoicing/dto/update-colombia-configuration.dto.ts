import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ElectronicInvoicingEnvironment,
  ElectronicInvoicingNumberingMode,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateColombiaConfigurationDto {
  @ApiPropertyOptional({ enum: ElectronicInvoicingEnvironment })
  @IsEnum(ElectronicInvoicingEnvironment)
  @IsOptional()
  environment?: ElectronicInvoicingEnvironment;

  @ApiPropertyOptional({ enum: ElectronicInvoicingNumberingMode })
  @IsEnum(ElectronicInvoicingNumberingMode)
  @IsOptional()
  numberingMode?: ElectronicInvoicingNumberingMode;

  @ApiPropertyOptional({
    description: 'URL base de TheFactory para esta empresa y ambiente',
    example: 'https://demoemision21-api.thefactoryhka.com.co',
  })
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  @IsOptional()
  providerBaseUrl?: string;

  @ApiPropertyOptional({ description: 'Token Empresa de TheFactory' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  tokenEmpresa?: string;

  @ApiPropertyOptional({ description: 'Token Contraseña de TheFactory' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  tokenPassword?: string;

  @ApiPropertyOptional({ example: 'DEMO-1' })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  rangoNumeracion?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  nextConsecutive?: number;
}
