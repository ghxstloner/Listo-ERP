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

export class CreateSubdepartmentDto {
  @ApiProperty({ description: 'Nombre del subdepartamento' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Código único del subdepartamento dentro del departamento',
  })
  @IsString()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'ID del departamento' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId: number;

  @ApiPropertyOptional({ description: 'Subdepartamento activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
