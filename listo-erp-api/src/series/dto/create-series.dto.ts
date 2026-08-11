import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { SeriesModule } from '@prisma/client';

export class CreateSeriesDto {
  @ApiProperty({ description: 'Descripcion de la serie' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description: string;

  @ApiProperty({ description: 'Formato de la serie (ej: FAC-{00000})' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  format: string;

  @ApiPropertyOptional({ description: 'Consecutivo actual', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  consecutive?: number;

  @ApiProperty({ description: 'Modulo al que pertenece la serie', enum: SeriesModule })
  @IsEnum(SeriesModule)
  module: SeriesModule;

  @ApiPropertyOptional({ description: 'Serie activa', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
