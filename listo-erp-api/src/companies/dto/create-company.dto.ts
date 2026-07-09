import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'primaryColor debe ser un color hexadecimal válido (ej: #ff6600)',
  })
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message:
      'secondaryColor debe ser un color hexadecimal válido (ej: #180900)',
  })
  @IsOptional()
  secondaryColor?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Contact information
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  phone1?: string;

  @IsString()
  @IsOptional()
  phone2?: string;

  @IsEmail()
  @IsOptional()
  email1?: string;

  @IsEmail()
  @IsOptional()
  email2?: string;

  // Country and tax information
  @IsInt()
  @IsOptional()
  countryId?: number;

  @IsString()
  @IsOptional()
  taxDocumentType?: string;

  @IsString()
  @IsOptional()
  taxDocumentNumber?: string;

  @IsString()
  @IsOptional()
  taxCheckDigit?: string;

  @IsString()
  @IsOptional()
  fiscalName?: string;
}
