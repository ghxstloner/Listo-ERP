export interface InventoryBalance {
  id: number;
  productId: number;
  quantity: number;
  updatedAt: string;
  warehouse: { id: number; name: string; code: string };
  product: { id: number; sku: string; name: string; unit: string | null };
}

export interface BranchInventoryBalance {
  product: { id: number; sku: string; name: string; unit: string | null };
  quantity: number;
  updatedAt: string;
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
