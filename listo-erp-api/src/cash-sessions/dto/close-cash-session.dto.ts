import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CloseCashSessionDto {
  @ApiProperty({ example: 250.75 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  declaredClosingAmount: number;

  @ApiPropertyOptional({ example: 'Cierre sin novedades' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  closingNote?: string;
}
