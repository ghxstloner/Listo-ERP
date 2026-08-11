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

class CreateOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity: number;
}

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId: number;

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
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
