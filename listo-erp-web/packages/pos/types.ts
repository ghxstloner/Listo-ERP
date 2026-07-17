import type { Product } from "@/packages/product/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
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
  items: Array<{ productId: number; quantity: number }>;
}

export interface Sale {
  id: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface ApiMessageResponse<T> {
  message: string;
  data: T;
}
