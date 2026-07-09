import { useApiMutation, useApiQuery } from "@config";
import type {
  WarehouseBranch,
  WarehouseBranchWithBranch,
  WarehouseBranchWithWarehouse,
  CreateWarehouseBranchRequest,
  UpdateWarehouseBranchRequest,
  CreateWarehouseBranchResponse,
} from "./types";

export const useCreateWarehouseBranch = () => {
  return useApiMutation<CreateWarehouseBranchResponse, CreateWarehouseBranchRequest>("warehouse-branches", "post");
};

export const useGetWarehouseBranches = () => {
  return useApiQuery<WarehouseBranch[]>(["warehouse-branches"], "warehouse-branches");
};

export const useGetWarehouseBranch = (id: WarehouseBranch["id"]) => {
  return useApiQuery<WarehouseBranch>(["warehouse-branches", id], `warehouse-branches/${id}`);
};

export const useUpdateWarehouseBranch = (id: WarehouseBranch["id"]) => {
  return useApiMutation<WarehouseBranch, UpdateWarehouseBranchRequest>(`warehouse-branches/${id}`, "patch");
};

export const useDeleteWarehouseBranch = (id: WarehouseBranch["id"]) => {
  return useApiMutation<void, void>(`warehouse-branches/${id}`, "delete");
};

export const useGetWarehouseBranchesByBranch = (branchId: number) => {
  return useApiQuery<WarehouseBranchWithWarehouse[]>(
    ["warehouse-branches", "by-branch", branchId],
    `warehouse-branches/by-branch/${branchId}`
  );
};

export const useGetWarehouseBranchesByWarehouse = (warehouseId: number) => {
  return useApiQuery<WarehouseBranchWithBranch[]>(
    ["warehouse-branches", "by-warehouse", warehouseId],
    `warehouse-branches/by-warehouse/${warehouseId}`
  );
};
