import type { Branch } from "../branch/types";
import type { Warehouse } from "../warehouse/types";

export interface WarehouseBranch {
  id: number;
  warehouseId: number;
  branchId: number;
  createdAt: string;
}

export interface WarehouseBranchWithBranch extends WarehouseBranch {
  branch: Pick<Branch, "id" | "name" | "branchCode" | "isActive">;
}

export interface WarehouseBranchWithWarehouse extends WarehouseBranch {
  warehouse: Pick<Warehouse, "id" | "name" | "code" | "isActive">;
}

export interface CreateWarehouseBranchRequest {
  warehouseId: number;
  branchId: number;
}

export type UpdateWarehouseBranchRequest = Partial<CreateWarehouseBranchRequest>;

export interface CreateWarehouseBranchResponse {
  message: string;
  data: WarehouseBranch;
}
