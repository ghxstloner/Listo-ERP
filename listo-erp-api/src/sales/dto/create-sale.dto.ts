import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateSaleItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity: number;
}

export class CreateSaleDto {
  @IsString()
  @MaxLength(100)
  deviceKey: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sellerId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId: number;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
