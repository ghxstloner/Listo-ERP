import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ description: 'Nombre del método de pago' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único del método dentro de la empresa',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    description:
      'Código DIAN del medio de pago para facturación electrónica en Colombia',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  dianCode?: string | null;

  @ApiPropertyOptional({ description: 'Si requiere referencia' })
  @IsBoolean()
  @IsOptional()
  requiresReference?: boolean;

  @ApiPropertyOptional({ description: 'Método activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
