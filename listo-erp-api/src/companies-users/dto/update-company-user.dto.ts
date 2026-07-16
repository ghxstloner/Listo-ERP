import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class UpdateCompanyUserDto {
  @ApiProperty({ type: [Number], description: 'IDs de roles personalizados de la empresa' })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds: number[];
}
