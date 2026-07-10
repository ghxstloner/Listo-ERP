import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ description: 'Warehouse name' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Unique warehouse code within the company',
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Code cannot be empty' })
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Warehouse address' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Active warehouse' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
