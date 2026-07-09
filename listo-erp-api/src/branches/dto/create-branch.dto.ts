import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'Nombre de la sucursal' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Dirección de la sucursal' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Teléfono de la sucursal' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description:
      'Código único de la sucursal dentro de la empresa. Si no se envía, se genera automáticamente.',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  branchCode?: string;

  @ApiPropertyOptional({ description: 'Sucursal activa', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
