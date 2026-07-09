import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ description: 'Nombre del almacén' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único del almacén dentro de la empresa',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Dirección del almacén' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Almacén activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
