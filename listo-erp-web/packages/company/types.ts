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
  taxDocumentType: string;
  taxDocumentNumber: string;
  taxCheckDigit: string;
  fiscalName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyResponse {
  message: string;
  company: Company;
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
