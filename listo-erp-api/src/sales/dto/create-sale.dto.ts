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
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class CreateSaleItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  productPriceId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity: number;
}

class CreateSalePaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  amount: number;
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
  @IsOptional()
  orderId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  paymentReference?: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  payments: CreateSalePaymentDto[];

  @IsArray()
  @IsNotEmpty()
  @IsOptional()
  @ValidateIf((dto: { orderId?: number }) => !dto.orderId)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items?: CreateSaleItemDto[];
}
