export interface Customer {
  id: number;
  name: string;
  taxDocumentType: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  isFinalConsumer: boolean;
  fiscalPersonType: string | null;
  taxCheckDigit: string | null;
  rutResponsibilities: string[];
  taxRegime: string | null;
  fiscalAddress: string | null;
  fiscalCountryCode: string | null;
  fiscalDepartmentCode: string | null;
  fiscalDepartment: string | null;
  fiscalCityCode: string | null;
  fiscalCity: string | null;
  fiscalTaxCodes: string[];
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  taxDocumentType?: string;
  taxId?: string;
  isFinalConsumer?: boolean;
  fiscalPersonType?: string;
  taxCheckDigit?: string;
  isActive: boolean;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;
