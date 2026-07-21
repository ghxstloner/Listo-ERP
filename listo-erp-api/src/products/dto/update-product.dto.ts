import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'SKU único del producto dentro de la empresa',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ description: 'Nombre del producto' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Precio de venta' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({
    description: 'Tasa de impuesto como fracción: 0.12 equivale a 12%',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'ID del departamento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @ApiPropertyOptional({ description: 'ID del subdepartamento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subdepartmentId?: number | null;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number | null;

  @ApiPropertyOptional({ description: 'ID de la subcategoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subcategoryId?: number | null;

  @ApiPropertyOptional({
    description: 'Código de unidad de medida DIAN. Se usa ZZ si no se informa.',
    example: 'UND',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  dianCode?: string | null;

  @ApiPropertyOptional({ description: 'Producto activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
