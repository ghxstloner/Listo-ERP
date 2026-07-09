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

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Código único de la categoría dentro del subdepartamento',
  })
  @IsString()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'ID del subdepartamento' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subdepartmentId: number;

  @ApiPropertyOptional({ description: 'Categoría activa', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
