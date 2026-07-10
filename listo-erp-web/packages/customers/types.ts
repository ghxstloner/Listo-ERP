export interface Customer {
  id: number;
  name: string;
  taxDocumentType: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  taxDocumentType?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  isActive: boolean;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;
