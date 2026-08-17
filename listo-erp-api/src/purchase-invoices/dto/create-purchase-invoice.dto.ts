import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CreatePurchaseInvoiceItemDto {
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
  @Min(0.0001)
  unitCost: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  @IsOptional()
  taxRate?: number;
}

export class CreatePurchaseInvoiceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  supplierInvoiceNumber: string;

  @IsDateString()
  issueDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  purchaseOrderId?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseInvoiceItemDto)
  items: CreatePurchaseInvoiceItemDto[];
}

export { CreatePurchaseInvoiceItemDto };
