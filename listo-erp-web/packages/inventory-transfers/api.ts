import { useApiMutation, useApiQuery } from "@config";

export type TransferStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "CANCELLED";

export interface InventoryTransferListItem {
  id: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  status: { code: TransferStatus; label: string };
  documentNumber: string | null;
  consecutive: number | null;
  seriesId: number | null;
  controlStock: boolean;
  notes: string | null;
  createdAt: string;
  createdByUser: { name: string };
  sourceWarehouse: { name: string; code: string };
  destinationWarehouse: { name: string; code: string };
}

export interface InventoryTransfer extends InventoryTransferListItem {
  items: Array<{
    productId: number;
    quantity: number;
    product: {
      sku: string;
      name: string;
      barcode: string | null;
      reference: string | null;
      image?: string | null;
    };
  }>;
}

export interface CreateInventoryTransfer {
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  items: Array<{ productId: number; quantity: number }>;
  notes?: string;
  controlStock?: boolean;
}

export const useGetInventoryTransfers = () =>
  useApiQuery<InventoryTransferListItem[]>(
    ["inventory-transfers"],
    "inventory-transfers",
  );

export const useGetInventoryTransfer = (id: number) =>
  useApiQuery<InventoryTransfer>(
    ["inventory-transfers", id],
    `inventory-transfers/${id}`,
  );

export const useCreateInventoryTransfer = () =>
  useApiMutation<InventoryTransfer, CreateInventoryTransfer>(
    "inventory-transfers",
    "post",
  );
