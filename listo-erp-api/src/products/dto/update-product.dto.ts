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

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Precio de venta' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({ description: 'Precio de costo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Tasa de impuesto (ej. 0.12 para 12%)' })
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
  subdepartmentId?: number;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'ID de la subcategoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subcategoryId?: number;

  @ApiPropertyOptional({ description: 'Unidad de medida (texto libre)' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ description: 'ID del proveedor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Producto activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
