import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateSubcategoryDto {
  @ApiProperty({ description: 'Nombre de la subcategoría' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Código único de la subcategoría dentro de la categoría',
  })
  @IsString()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'ID de la categoría' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiPropertyOptional({ description: 'Subcategoría activa', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
