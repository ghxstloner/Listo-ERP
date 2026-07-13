import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CreatePurchaseOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  @IsNotEmpty()
  items: CreatePurchaseOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
