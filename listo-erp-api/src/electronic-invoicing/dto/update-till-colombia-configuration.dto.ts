import { ApiPropertyOptional } from '@nestjs/swagger';
import { ElectronicInvoicingNumberingMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTillColombiaConfigurationDto {
  @ApiPropertyOptional({ enum: ElectronicInvoicingNumberingMode })
  @IsEnum(ElectronicInvoicingNumberingMode)
  @IsOptional()
  numberingMode?: ElectronicInvoicingNumberingMode;

  @ApiPropertyOptional({ example: 'A1-1' })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  rangoNumeracion?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  nextConsecutive?: number;
}
