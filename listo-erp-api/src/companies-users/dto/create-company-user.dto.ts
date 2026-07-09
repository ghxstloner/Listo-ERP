import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCompanyUserDto {
  @ApiProperty({ description: 'ID del usuario a agregar' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({
    enum: Role,
    description: 'Rol del usuario en la empresa',
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
