export interface Supplier {
  id: number;
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  contactName: string;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  contactName: string;
  isActive: boolean;
}

export type UpdateSupplierRequest = Partial<CreateSupplierRequest>;
