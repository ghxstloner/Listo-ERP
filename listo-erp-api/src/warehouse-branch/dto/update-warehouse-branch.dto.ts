import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateWarehouseBranchDto {
  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsInt()
  @IsOptional()
  warehouseId?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsInt()
  @IsOptional()
  branchId?: number;
}
