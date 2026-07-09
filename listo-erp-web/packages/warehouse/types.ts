export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  address: string;
  isActive: boolean;
}

export type UpdateWarehouseRequest = Partial<CreateWarehouseRequest>;

export interface CreateWarehouseResponse {
  message: string;
  data: Warehouse;
}

export interface WarehouseBranchesResponse {
  message: string;
  data: {
    id: number;
    name: string;
    branchCode: string;
    isActive: boolean;
    companyId: number;
    createdAt: string;
    updatedAt: string;
  }[];
}
