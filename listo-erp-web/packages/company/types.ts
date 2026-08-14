export interface Company {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  companyLogo: string;
  address: string;
  city: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  countryId: number;
  defaultCustomerId: number | null;
  defaultSellerId: number | null;
  taxDocumentType: string;
  taxDocumentNumber: string;
  taxCheckDigit: string;
  fiscalName: string;
  defaultCurrencyId: number | null;
  defaultCurrency: CompanyCurrency | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCurrency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  format: "symbol_before" | "symbol_after" | "code_before" | "code_after";
  rounding: "half_up" | "half_even" | "up" | "down";
}

export interface UpdateCompanyResponse {
  message: string;
  data: Company;
}

export interface HierarchyConfig {
  id: number;
  companyId: number;
  level1Name: string;
  level2Name: string;
  level3Name: string;
  level4Name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateHierarchyConfigRequest {
  level1Name: string;
  level2Name: string;
  level3Name: string;
  level4Name: string;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface CompanyRole {
  id: number;
  companyId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: Array<{ permission: Permission }>;
}

export interface CompanyRoleRequest {
  name: string;
  description?: string;
  permissionCodes: string[];
  isActive?: boolean;
}
