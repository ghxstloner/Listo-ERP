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

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Nombre de la categoría' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único de la categoría dentro del subdepartamento',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'ID del subdepartamento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subdepartmentId?: number;

  @ApiPropertyOptional({ description: 'Categoría activa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
