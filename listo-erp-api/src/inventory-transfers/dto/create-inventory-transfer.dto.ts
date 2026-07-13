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

class TransferItemDto {
  @Type(() => Number) @IsInt() @Min(1) productId: number;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity: number;
}

export class CreateInventoryTransferDto {
  @Type(() => Number) @IsInt() @Min(1) sourceWarehouseId: number;
  @Type(() => Number) @IsInt() @Min(1) destinationBranchId: number;
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
  @IsOptional() @IsString() notes?: string;
}
