import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Nombre del proveedor' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'NIT, RUC o identificador tributario' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico' })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Nombre del contacto' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contactName?: string;

  @ApiPropertyOptional({ description: 'Proveedor activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
