import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class UpdateOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity: number;
}

export class UpdateOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  customerId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  branchId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  sellerId?: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  items?: UpdateOrderItemDto[];
}
