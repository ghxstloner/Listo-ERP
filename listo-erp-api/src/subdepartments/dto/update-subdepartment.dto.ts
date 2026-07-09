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

export class UpdateSubdepartmentDto {
  @ApiPropertyOptional({ description: 'Nombre del subdepartamento' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único del subdepartamento dentro del departamento',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'ID del departamento' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Subdepartamento activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
