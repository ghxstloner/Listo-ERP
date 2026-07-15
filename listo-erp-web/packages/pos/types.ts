import type { Product } from "@/packages/product/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  requiresReference: boolean;
  isActive: boolean;
  companyId: number;
}
