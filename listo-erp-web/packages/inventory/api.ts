import { useApiQuery } from "@config";
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
  warehouse: { name: string; code: string } | null;
  branch: { name: string; branchCode: string | null } | null;
  product: { sku: string; name: string };
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
export const useGetBranchInventoryBalances = (branchId: number) =>
  useApiQuery<InventoryBalance[]>(
    ["inventory", "branches", branchId, "balances"],
    `inventory/branches/${branchId}/balances`,
  );
export const useGetWarehouseInventoryBalances = (warehouseId: number) =>
  useApiQuery<InventoryBalance[]>(
    ["inventory", "warehouses", warehouseId, "balances"],
    "inventory/balances",
    { params: { warehouseId } },
  );
