import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

class InventoryEntryItemDto {
  @Type(() => Number) @IsInt() @Min(1) productId: number;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  quantity: number;
}

export class CreateInventoryEntryDto {
  @Type(() => Number) @IsInt() @Min(1) warehouseId: number;
  @IsIn(['ENTRY', 'ADJUSTMENT']) type: 'ENTRY' | 'ADJUSTMENT';
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InventoryEntryItemDto)
  items: InventoryEntryItemDto[];
}
