import { useApiMutation, useApiQuery } from "@config";
export interface InventoryBalance {
  id: number;
  productId: number;
  quantity: number;
  updatedAt: string;
  warehouse: { id: number; name: string; code: string };
  product: { id: number; sku: string; name: string; unit: string | null };
}
export interface InventoryMovement {
  id: number;
  type: string;
  quantity: number;
  unitCost: number;
  balanceAfter: number;
  createdAt: string;
  warehouse: { name: string; code: string };
  product: { sku: string; name: string };
}
export type InventoryEntryType = "ENTRY" | "ADJUSTMENT";
export interface CreateInventoryEntryRequest {
  warehouseId: number;
  type: InventoryEntryType;
  items: Array<{ productId: number; quantity: number }>;
}
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
export const useCreateInventoryEntry = () =>
  useApiMutation<{ message: string }, CreateInventoryEntryRequest>(
    "inventory/entries",
    "post",
  );
