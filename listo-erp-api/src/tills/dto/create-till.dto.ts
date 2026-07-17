import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateTillDto {
  @ApiProperty({ description: 'Nombre de la caja' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  tillName: string;

  @ApiPropertyOptional({
    description:
      'Código único de la caja dentro de la sucursal. Si no se envía, se genera automáticamente.',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  tillCode?: string;

  @ApiProperty({ description: 'ID de la sucursal donde se ubica la caja' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branchId: number;

  @ApiPropertyOptional({ description: 'Caja activa', default: true })
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
