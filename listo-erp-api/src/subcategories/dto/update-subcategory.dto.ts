import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSubcategoryDto {
  @ApiPropertyOptional({ description: 'Nombre de la subcategoría' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único de la subcategoría dentro de la categoría',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Subcategoría activa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
