import { useApiMutation, useApiQuery } from "@config";
import type { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from "./types";

export const useCreateSupplier = () => {
  return useApiMutation<Supplier, CreateSupplierRequest>("suppliers", "post");
};

export const useGetSuppliers = () => {
  return useApiQuery<Supplier[]>(["suppliers"], "suppliers");
};

export const useGetSupplier = (id: Supplier["id"]) => {
  return useApiQuery<Supplier>(["suppliers", id], `suppliers/${id}`);
};

export const useUpdateSupplier = (id: Supplier["id"]) => {
  return useApiMutation<Supplier, UpdateSupplierRequest>(`suppliers/${id}`, "patch");
};

export const useDeleteSupplier = (id: Supplier["id"]) => {
  return useApiMutation<void, void>(`suppliers/${id}`, "delete");
};
