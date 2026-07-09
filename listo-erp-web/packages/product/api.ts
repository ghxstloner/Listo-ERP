import { useApiMutation, useApiQuery } from "@config";
import type { Product, CreateProductRequest, UpdateProductRequest, ProductsResponse } from "./types";

export const useCreateProduct = () => {
  return useApiMutation<Product, CreateProductRequest>("products", "post");
};

export const useGetProducts = (departmentId?: number) => {
  return useApiQuery<ProductsResponse>(
    ["products", departmentId],
    "products",
    {
      params: departmentId !== undefined ? { departmentId } : undefined
    }
  );
};

export const useGetProduct = (id: Product["id"]) => {
  return useApiQuery<Product>(["products", id], `products/${id}`);
};

export const useUpdateProduct = (id: Product["id"]) => {
  return useApiMutation<Product, UpdateProductRequest>(`products/${id}`, "patch");
};

export const useDeleteProduct = (id: Product["id"]) => {
  return useApiMutation<void, void>(`products/${id}`, "delete");
};

export const useUploadProductImage = (id: Product["id"]) => {
  return useApiMutation<Product, FormData>(`products/${id}/image`, "post", {
    transformRequest: (data) => data,
  });
};
