import type { Department } from "../department/types";
import type { SubDepartment } from "../subdepartment/types";
import type { Category } from "../category/types";
import type { SubCategory } from "../subcategory/types";
import type { Supplier } from "../suppliers/types";

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  salePrice: number;
  costPrice: number | null;
  taxRate: number | null;
  unit: string | null;
  image: string | null;
  isActive: boolean;
  companyId: number;
  departmentId: number;
  subdepartmentId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  supplierId: number | null;
  department: Pick<Department, "id" | "name" | "code">;
  subdepartment: Pick<SubDepartment, "id" | "name" | "code"> | null;
  category: Pick<Category, "id" | "name" | "code"> | null;
  subcategory: Pick<SubCategory, "id" | "name" | "code"> | null;
  supplier: Pick<Supplier, "id" | "name" | "taxId"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice?: number;
  taxRate?: number;
  departmentId: number;
  subdepartmentId?: number;
  categoryId?: number;
  subcategoryId?: number;
  unit?: string;
  supplierId?: number;
  isActive?: boolean;
}

export interface CreateProductResponse {
  message: string;
  data: Product;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface ProductsResponseMeta {
  entityName: string;
}

export interface ProductsResponse {
  data: Product[];
  meta: ProductsResponseMeta;
}

export type ProductsApiResponse = ProductsResponse | Product[];
