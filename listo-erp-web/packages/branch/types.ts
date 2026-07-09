export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  branchCode: string;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export type UpdateBranchRequest = Partial<CreateBranchRequest>;
