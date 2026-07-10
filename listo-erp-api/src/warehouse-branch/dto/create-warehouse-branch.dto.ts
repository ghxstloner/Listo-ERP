import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateWarehouseBranchDto {
  @ApiProperty({ description: 'Warehouse ID' })
  @IsInt()
  warehouseId: number;

  @ApiProperty({ description: 'Branch ID' })
  @IsInt()
  branchId: number;
}
