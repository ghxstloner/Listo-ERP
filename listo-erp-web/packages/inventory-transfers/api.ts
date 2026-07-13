import { useApiMutation, useApiQuery } from "@config";
export type TransferStatus =
  "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
export interface InventoryTransfer {
  id: number;
  sourceWarehouseId: number;
  destinationBranchId: number;
  status: { code: TransferStatus; label: string };
  sourceWarehouse: { name: string; code: string };
  destinationBranch: { name: string; branchCode: string };
  items: Array<{
    productId: number;
    quantity: number;
    product: { sku: string; name: string };
  }>;
}
export interface CreateInventoryTransfer {
  sourceWarehouseId: number;
  destinationBranchId: number;
  items: Array<{ productId: number; quantity: number }>;
  notes?: string;
}
export const useGetInventoryTransfers = () =>
  useApiQuery<InventoryTransfer[]>(
    ["inventory-transfers"],
    "inventory-transfers",
  );
export const useCreateInventoryTransfer = () =>
  useApiMutation<InventoryTransfer, CreateInventoryTransfer>(
    "inventory-transfers",
    "post",
  );
export const useDispatchTransfer = (id: number) =>
  useApiMutation<InventoryTransfer, void>(
    `inventory-transfers/${id}/dispatch`,
    "patch",
  );
export const useReceiveTransfer = (id: number) =>
  useApiMutation<InventoryTransfer, void>(
    `inventory-transfers/${id}/receive`,
    "patch",
  );
