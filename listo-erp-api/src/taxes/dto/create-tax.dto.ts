import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaxDto {
  @ApiProperty({ description: 'Nombre del impuesto (ej. ITBMS 7%)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tasa o porcentaje (ej. 0.07 para 7%)' })
  @IsNumber()
  rate: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
