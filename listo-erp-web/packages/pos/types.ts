import type { Product } from "@/packages/product/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  dianCode: string | null;
  image: string | null;
  requiresReference: boolean;
  isActive: boolean;
  companyId: number;
}

export interface CreateSaleRequest {
  deviceKey: string;
  customerId: number;
  sellerId: number;
  paymentMethodId: number;
  paymentReference?: string;
  items: Array<{ productId: number; quantity: number }>;
}

export interface Sale {
  id: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  electronicInvoice: {
    id: number;
    status: ElectronicInvoiceStatus;
    consecutive: string;
  } | null;
}

export type ElectronicInvoiceStatus =
  | "PENDING"
  | "PROCESSING"
  | "ACCEPTED"
  | "REJECTED"
  | "FAILED";

export interface ElectronicInvoiceStatusResponse {
  id: number;
  saleId: number;
  consecutive: string;
  status: ElectronicInvoiceStatus;
  cufe: string | null;
  qr: string | null;
  acceptedAt: string | null;
  lastError: string | null;
  canDownload: boolean;
}

export interface ApiMessageResponse<T> {
  message: string;
  data: T;
}
