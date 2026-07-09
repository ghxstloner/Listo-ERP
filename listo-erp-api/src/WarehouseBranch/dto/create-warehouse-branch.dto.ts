import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateWarehouseBranchDto {
  @ApiProperty({ description: 'ID del almacén' })
  @IsInt()
  warehouseId: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsInt()
  branchId: number;
}
