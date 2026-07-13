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

export interface SupplierProduct {
  id: number;
  supplierId: number;
  productId: number;
  supplierSku: string | null;
  referenceCost: number | null;
  currencyId: number | null;
  minimumQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;
  product: { id: number; sku: string; name: string };
}

export interface CreateSupplierProductRequest {
  productId: number;
  supplierSku?: string;
  referenceCost?: number;
  minimumQuantity?: number;
  leadTimeDays?: number;
  isPreferred?: boolean;
  isActive?: boolean;
}
