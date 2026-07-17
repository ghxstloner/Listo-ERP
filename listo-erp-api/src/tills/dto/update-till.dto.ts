import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ArrayUnique,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateTillDto {
  @ApiPropertyOptional({ description: 'Nombre de la caja' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  tillName?: string;

  @ApiPropertyOptional({
    description: 'Código único de la caja dentro de la sucursal',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  tillCode?: string;

  @ApiPropertyOptional({
    description: 'ID de la sucursal donde se ubica la caja',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  branchId?: number;

  @ApiPropertyOptional({ description: 'Caja activa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'IDs de los métodos de pago habilitados para la caja',
    type: [Number],
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  paymentMethodIds?: number[];
}
