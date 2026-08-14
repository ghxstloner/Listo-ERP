import type { Product } from "@/packages/product/types";

export interface CartItem {
  product: Product;
  productPriceId: number;
  unitPrice: number;
  priceName?: string;
  quantity: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  dianCode: string | null;
  image: string | null;
  isActive: boolean;
  companyId: number;
}

export interface SalePaymentEntry {
  paymentMethodId: number;
  amount: number;
}

export interface LocalPaymentEntry extends SalePaymentEntry {
  localId: string;
}

export interface CreateSaleRequest {
  deviceKey: string;
  customerId: number;
  sellerId: number;
  orderId?: number;
  payments: SalePaymentEntry[];
  items?: Array<{ productId: number; productPriceId: number; quantity: number }>;
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

export interface SaleListItem {
  id: number;
  createdAt: string;
  total: number;
  customer: { name: string };
  seller: { name: string };
  electronicInvoice: {
    id: number;
    status: ElectronicInvoiceStatus;
    consecutive: string;
    canDownload: boolean;
  } | null;
}
