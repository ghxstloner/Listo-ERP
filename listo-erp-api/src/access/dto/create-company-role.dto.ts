import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyRoleDto {
  @ApiProperty({ example: 'Cajero' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ type: [String], example: ['sales.pos', 'sales.customers'] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes: string[];
}
