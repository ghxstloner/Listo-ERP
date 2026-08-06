import { ApiPropertyOptional } from '@nestjs/swagger';
import { ElectronicInvoicingEnvironment } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateColombiaConfigurationDto {
  @ApiPropertyOptional({ enum: ElectronicInvoicingEnvironment })
  @IsEnum(ElectronicInvoicingEnvironment)
  @IsOptional()
  environment?: ElectronicInvoicingEnvironment;

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
}
