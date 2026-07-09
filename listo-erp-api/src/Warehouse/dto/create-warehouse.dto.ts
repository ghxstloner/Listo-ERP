import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ description: 'Nombre del almacén' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Código único del almacén dentro de la empresa',
  })
  @IsString()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: 'Dirección del almacén' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Almacén activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
