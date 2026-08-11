import type { Product } from "@/packages/product/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CreateOrderRequest {
  customerId: number;
  branchId?: number;
  sellerId?: number;
  notes?: string;
  items: Array<{ productId: number; quantity: number }>;
}

export interface UpdateOrderRequest {
  customerId?: number;
  branchId?: number;
  sellerId?: number;
  notes?: string;
  items?: Array<{ productId: number; quantity: number }>;
}

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  product: {
    id: number;
    sku: string;
    name: string;
  };
}

export interface Order {
  id: number;
  companyId: number;
  branchId: number;
  customerId: number;
  sellerId: number;
  createdByUserId: number;
  status: OrderStatus;
  notes: string | null;
  saleId: number | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    name: string;
    taxId: string | null;
  };
  seller: {
    id: number;
    code: string;
    name: string;
  };
  branch: {
    id: number;
    name: string;
  };
  items: OrderItem[];
}

export interface OrderListItem {
  id: number;
  status: OrderStatus;
  createdAt: string;
  total: number;
  customer: {
    id: number;
    name: string;
  };
  seller: {
    id: number;
    name: string;
  };
  branch: {
    id: number;
    name: string;
  };
  itemsCount: number;
  items: Array<{
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      sku: string;
    };
  }>;
}

export interface ApiMessageResponse<T = undefined> {
  message: string;
  data: T;
}
