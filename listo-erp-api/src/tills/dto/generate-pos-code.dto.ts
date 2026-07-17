import { ApiProperty } from '@nestjs/swagger';
import { TillPosAssociationType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class GeneratePosCodeDto {
  @ApiProperty({ enum: TillPosAssociationType })
  @IsEnum(TillPosAssociationType)
  type: TillPosAssociationType;
}
