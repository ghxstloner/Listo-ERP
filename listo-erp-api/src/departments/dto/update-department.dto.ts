import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ description: 'Nombre del departamento' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único del departamento dentro de la empresa',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Departamento activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
