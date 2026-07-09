import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Nombre del departamento' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Código único del departamento dentro de la empresa',
  })
  @IsString()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: 'Departamento activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
