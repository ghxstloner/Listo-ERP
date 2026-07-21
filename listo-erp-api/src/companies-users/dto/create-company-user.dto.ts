import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateCompanyUserDto {
  @ApiProperty({ description: 'ID del usuario a agregar' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({
    type: [Number],
    description: 'IDs de roles personalizados de la empresa',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds?: number[];
}
