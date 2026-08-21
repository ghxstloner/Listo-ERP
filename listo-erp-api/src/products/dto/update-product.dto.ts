import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
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

  @ApiPropertyOptional({ description: 'Precio de costo del producto' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  costPrice?: number | null;

  @ApiPropertyOptional({
    description: 'Indica si el producto está exento de impuesto',
  })
  @IsOptional()
  @IsBoolean()
  isExempt?: boolean;

  @ApiPropertyOptional({
    description: 'ID del precio predeterminado del producto; null lo desasigna',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  defaultPriceId?: number | null;

  @ApiPropertyOptional({
    description: 'ID del impuesto asignado',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taxId?: number;

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

  @ApiPropertyOptional({
    description: 'Código de barras del producto',
    example: '7701234567890',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string | null;

  @ApiPropertyOptional({
    description: 'Referencia del producto o código de fabricante',
    example: 'REF-1234',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference?: string | null;

  @ApiPropertyOptional({ description: 'Producto activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;
}
