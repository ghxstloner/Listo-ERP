import { useApiMutation, useApiQuery } from "@config";
import type {
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  CreateWarehouseResponse,
  WarehouseBranchesResponse,
} from "./types";

export const useCreateWarehouse = () => {
  return useApiMutation<CreateWarehouseResponse, CreateWarehouseRequest>("warehouses", "post");
};

export const useGetWarehouses = () => {
  return useApiQuery<Warehouse[]>(["warehouses"], "warehouses");
};

export const useGetWarehouse = (id: Warehouse["id"]) => {
  return useApiQuery<Warehouse>(["warehouses", id], `warehouses/${id}`);
};

export const useUpdateWarehouse = (id: Warehouse["id"]) => {
  return useApiMutation<Warehouse, UpdateWarehouseRequest>(`warehouses/${id}`, "patch");
};

export const useDeleteWarehouse = (id: Warehouse["id"]) => {
  return useApiMutation<void, void>(`warehouses/${id}`, "delete");
};

export const useGetWarehouseBranches = (id: Warehouse["id"]) => {
  return useApiQuery<WarehouseBranchesResponse>(["warehouses", id, "branches"], `warehouses/${id}/branches`);
};
