import { api, getApiBaseUrl, useApiMutation, useApiQuery } from "@config";
import { useMutation } from "@tanstack/react-query";
import type {
  Product,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  ProductsApiResponse,
} from "./types";

export const useCreateProduct = () => {
  return useApiMutation<CreateProductResponse, CreateProductRequest>("products", "post");
};

export const useGetProducts = (departmentId?: number) => {
  return useApiQuery<ProductsApiResponse>(
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
