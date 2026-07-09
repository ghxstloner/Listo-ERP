import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateWarehouseBranchDto {
  @ApiPropertyOptional({ description: 'ID del almacén' })
  @IsInt()
  @IsOptional()
  warehouseId?: number;

  @ApiPropertyOptional({ description: 'ID de la sucursal' })
  @IsInt()
  @IsOptional()
  branchId?: number;
}
