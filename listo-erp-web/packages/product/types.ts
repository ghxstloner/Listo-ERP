import type { Department } from "../department/types";
import type { SubDepartment } from "../subdepartment/types";
import type { Category } from "../category/types";
import type { SubCategory } from "../subcategory/types";

export interface ProductPrice {
  id: number;
  productId: number;
  name: string;
  amount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductType = "PRODUCT" | "SERVICE";

export function getProductDefaultPrice(product: Product): ProductPrice | null {
  if (product.defaultPrice?.isActive) return product.defaultPrice;
  if (product.defaultPriceId != null) {
    const selected = product.prices.find(
      (price) => price.id === product.defaultPriceId && price.isActive,
    );
    if (selected) return selected;
  }
  return product.prices.find((price) => price.isActive) ?? null;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  salePrice: number;
  defaultPriceId: number | null;
  prices: ProductPrice[];
  defaultPrice: ProductPrice | null;
  costPrice: number | null;
  taxId: number | null;
  tax: { id: number; name: string; rate: number } | null;
  isExempt: boolean;
  productType: ProductType;
  unit: string | null;
  dianCode: string | null;
  image: string | null;
  isActive: boolean;
  companyId: number;
  departmentId: number;
  subdepartmentId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  department: Pick<Department, "id" | "name" | "code">;
  subdepartment: Pick<SubDepartment, "id" | "name" | "code"> | null;
  category: Pick<Category, "id" | "name" | "code"> | null;
  subcategory: Pick<SubCategory, "id" | "name" | "code"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  salePrice: number;
  costPrice?: number | null;
  taxId?: number | null;
  isExempt?: boolean;
  departmentId: number;
  subdepartmentId?: number | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  dianCode?: string | null;
  isActive?: boolean;
  productType?: ProductType;
}

export interface CreateProductResponse {
  message: string;
  data: Product;
}

export type UpdateProductRequest = Partial<CreateProductRequest> & {
  defaultPriceId?: number | null;
};

export interface ProductsResponseMeta {
  entityName: string;
}

export interface ProductsResponse {
  data: Product[];
  meta: ProductsResponseMeta;
}

export type ProductsApiResponse = ProductsResponse | Product[];

export interface ProductKardexMovement {
  id: number;
  warehouseId: number;
  productId: number;
  type: string;
  quantity: number;
  unitCost: number;
  balanceAfter: number;
  purchaseOrderId: number | null;
  purchaseInvoiceId: number | null;
  purchaseInvoiceItemId: number | null;
  purchaseInvoice: {
    documentNumber: string;
    supplierInvoiceNumber: string;
  } | null;
  saleItemId: number | null;
  orderItemId: number | null;
  createdAt: string;
  warehouse: { id: number; name: string; code: string };
}

export interface ProductKardexFilters {
  warehouseId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductPurchaseFilters extends ProductHistoryFilters {
  warehouseId?: number;
  supplierId?: number;
}

export interface ProductSalesFilters extends ProductHistoryFilters {
  branchId?: number;
  status?: string;
}

export interface ProductOrdersFilters extends ProductHistoryFilters {
  branchId?: number;
  status?: "PENDING" | "PAID" | "CANCELLED";
}

export interface ProductPurchase {
  id: number;
  itemId: number;
  documentNumber: string;
  supplierInvoiceNumber: string;
  status: "POSTED" | "CANCELLED";
  createdAt: string;
  issueDate: string;
  supplier: { id: number; name: string; taxId: string | null };
  warehouse: { id: number; name: string; code: string };
  quantity: number;
  unitCost: number;
  taxAmount: number;
  total: number;
}

export interface ProductSale {
  id: number;
  itemId: number;
  createdAt: string;
  customer: { id: number; name: string; taxId: string | null };
  seller: { id: number; name: string };
  branch: { id: number; name: string };
  electronicInvoice: {
    id: number;
    status: string;
    consecutive: string;
  } | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  total: number;
}

export interface ProductOrder {
  id: number;
  itemId: number;
  orderNumber: string | null;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  customer: { id: number; name: string };
  seller: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
  quantity: number;
  unitPrice: number;
  total: number;
}
