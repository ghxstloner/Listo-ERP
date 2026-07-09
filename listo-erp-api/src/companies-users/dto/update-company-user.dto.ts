import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateCompanyUserDto {
  @ApiProperty({
    enum: Role,
    description: 'Nuevo rol del usuario en la empresa',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
