import { api, getApiBaseUrl, useApiMutation, useApiQuery } from "@config";
import { useMutation } from "@tanstack/react-query";
import type {
  Product,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  ProductsApiResponse,
  ProductPrice,
  ProductKardexMovement,
  ProductKardexFilters,
  ProductPurchaseFilters,
  ProductSalesFilters,
  ProductOrdersFilters,
  ProductPurchase,
  ProductSale,
  ProductOrder,
} from "./types";

export interface ProductPricesResponse {
  data: ProductPrice[];
  meta: { entityName: string };
}

export interface CreateProductPriceRequest {
  name: string;
  amount: number;
  isActive?: boolean;
  sortOrder?: number;
}

export type ProductPriceRequest = CreateProductPriceRequest;

export interface UpdateProductPriceRequest {
  name?: string;
  amount?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductFilters {
  departmentId?: number;
  subdepartmentId?: number;
  categoryId?: number;
  subcategoryId?: number;
}

export const useCreateProduct = () => {
  return useApiMutation<CreateProductResponse, CreateProductRequest>("products", "post");
};

export const useGetProducts = (filters: ProductFilters = {}) => {
  return useApiQuery<ProductsApiResponse>(
    ["products", filters],
    "products",
    {
      params: Object.keys(filters).length > 0 ? filters as Record<string, number | undefined> : undefined
    }
  );
};

export const useGetProduct = (id: Product["id"]) => {
  return useApiQuery<Product>(["products", id], `products/${id}`);
};

const historyParams = (filters: object) => {
  const params: Record<string, string | number | undefined> = {};
  Object.entries(filters as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params[key] = value;
  });
  return Object.keys(params).length > 0 ? { params } : undefined;
};

export const useGetProductKardex = (
  id: Product["id"],
  filters: ProductKardexFilters,
) => {
  const params: Record<string, string | number | undefined> = {};
  if (filters.warehouseId) params.warehouseId = filters.warehouseId;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  return useApiQuery<ProductKardexMovement[]>(
    ["products", id, "kardex", filters],
    `inventory/products/${id}/movements`,
    Object.keys(params).length > 0 ? { params } : undefined,
    { enabled: id > 0 },
  );
};

export const useGetProductPurchases = (
  id: Product["id"],
  filters: ProductPurchaseFilters,
) =>
  useApiQuery<ProductPurchase[]>(
    ["products", id, "purchases", filters],
    `purchase-invoices/products/${id}`,
    historyParams(filters),
    { enabled: id > 0 },
  );

export const useGetProductSales = (
  id: Product["id"],
  filters: ProductSalesFilters,
) =>
  useApiQuery<ProductSale[]>(
    ["products", id, "sales", filters],
    `sales/products/${id}`,
    historyParams(filters),
    { enabled: id > 0 },
  );

export const useGetProductOrders = (
  id: Product["id"],
  filters: ProductOrdersFilters,
) =>
  useApiQuery<ProductOrder[]>(
    ["products", id, "orders", filters],
    `orders/products/${id}`,
    historyParams(filters),
    { enabled: id > 0 },
  );

export const useGetProductPrices = (
  id: Product["id"],
  includeInactive = true,
) =>
  useApiQuery<ProductPricesResponse>(
    ["products", id, "prices", includeInactive],
    `products/${id}/prices`,
    { params: { includeInactive } },
  );

export const useCreateProductPrice = (productId: Product["id"]) =>
  useApiMutation<
    { message: string; data: ProductPrice },
    CreateProductPriceRequest
  >(`products/${productId}/prices`, "post");

export const useUpdateProductPrice = (
  productId: Product["id"],
  priceId: ProductPrice["id"],
) =>
  useApiMutation<
    { message: string; data: ProductPrice },
    UpdateProductPriceRequest
  >(`products/${productId}/prices/${priceId}`, "patch");

export const useDeleteProductPrice = (
  productId: Product["id"],
  priceId: ProductPrice["id"],
) =>
  useApiMutation<{ message: string }, void>(
    `products/${productId}/prices/${priceId}`,
    "delete",
  );

export const useSetDefaultProductPrice = (
  productId: Product["id"],
  priceId: ProductPrice["id"],
) =>
  useApiMutation<{ message: string; data: Product }, void>(
    `products/${productId}/default-price/${priceId}`,
    "patch",
  );

export const useUpdateProduct = (id: Product["id"]) => {
  return useApiMutation<Product, UpdateProductRequest>(`products/${id}`, "patch");
};

export const useDeleteProduct = (id: Product["id"]) => {
  return useApiMutation<void, void>(`products/${id}`, "delete");
};

export const uploadProductImage = (id: Product["id"], file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.postFormData<Product>(`products/${id}/image`, formData);
};

export const useUploadProductImage = (id: Product["id"]) => {
  const mutation = useMutation({
    mutationFn: (file: File) => uploadProductImage(id, file),
  });

  const uploadImage = (file: File, onSuccess?: (data: Product) => void) => {
    mutation.mutate(file, { onSuccess });
  };

  return [uploadImage, mutation.isPending, mutation.error, mutation.data] as const;
};

export const getProductImageUrl = (productImage: string | null | undefined): string => {
  if (!productImage) return "";
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const path = productImage.startsWith("uploads/") ? productImage : `uploads/${productImage}`;
  return `${baseUrl}/${path}`;
};
