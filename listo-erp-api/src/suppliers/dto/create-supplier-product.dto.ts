import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateSupplierProductDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;
}
