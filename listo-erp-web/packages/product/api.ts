import { api, getApiBaseUrl, useApiMutation, useApiQuery } from "@config";
import { useMutation } from "@tanstack/react-query";
import type {
  Product,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  ProductsApiResponse,
  ProductPrice,
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
