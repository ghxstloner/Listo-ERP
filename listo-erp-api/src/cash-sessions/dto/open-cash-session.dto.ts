import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class OpenCashSessionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  tillId: number;

  @ApiProperty({ example: '6e2f7df3-0d31-4903-a013-d430d6307d2e' })
  @IsString()
  @MaxLength(100)
  deviceKey: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  openingAmount: number;

  @ApiPropertyOptional({ example: 'Turno de la mañana' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  openingNote?: string;
}
