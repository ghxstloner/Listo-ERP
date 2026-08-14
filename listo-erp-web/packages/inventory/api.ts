import { useApiMutation, useApiQuery } from "@config";
import type {
  InventoryBalance,
  BranchInventoryBalance,
  InventoryMovement,
  InventoryEntryType,
  CreateInventoryEntryRequest,
} from "./types";

export type { InventoryBalance, BranchInventoryBalance, InventoryMovement, InventoryEntryType, CreateInventoryEntryRequest };
export const useGetInventoryBalances = () =>
  useApiQuery<InventoryBalance[]>(
    ["inventory", "balances"],
    "inventory/balances",
  );
export const useGetInventoryMovements = () =>
  useApiQuery<InventoryMovement[]>(
    ["inventory", "movements"],
    "inventory/movements",
  );
export const useGetWarehouseInventoryBalances = (warehouseId: number) =>
  useApiQuery<InventoryBalance[]>(
    ["inventory", "warehouses", warehouseId, "balances"],
    "inventory/balances",
    { params: { warehouseId } },
  );
export const useGetBranchInventoryBalances = (branchId?: number) =>
  useApiQuery<BranchInventoryBalance[]>(
    ["inventory", "branches", branchId, "balances"],
    `inventory/branches/${branchId}/balances`,
    undefined,
    { enabled: branchId != null },
  );
export const useCreateInventoryEntry = () =>
  useApiMutation<{ message: string }, CreateInventoryEntryRequest>(
    "inventory/entries",
    "post",
  );
