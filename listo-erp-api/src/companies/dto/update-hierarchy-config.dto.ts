import { IsString, MaxLength } from 'class-validator';

export class UpdateHierarchyConfigDto {
  @IsString()
  @MaxLength(50)
  level1Name: string;

  @IsString()
  @MaxLength(50)
  level2Name: string;

  @IsString()
  @MaxLength(50)
  level3Name: string;

  @IsString()
  @MaxLength(50)
  level4Name: string;
}
