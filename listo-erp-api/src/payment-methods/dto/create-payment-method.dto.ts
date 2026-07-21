import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty({ description: 'Nombre del método de pago' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description:
      'Código único del método dentro de la empresa (ej. EFECTIVO, TARJETA)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

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

  @ApiPropertyOptional({
    description:
      'Si requiere referencia (ej. número de transacción para transferencia)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresReference?: boolean;

  @ApiPropertyOptional({ description: 'Método activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
