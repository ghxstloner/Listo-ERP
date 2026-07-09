export interface TillBranchSummary {
  id: number;
  name: string;
  branchCode: string;
}

export interface Till {
  id: number;
  tillCode: string;
  tillName: string;
  isActive: boolean;
  companyId: number;
  branchId: number;
  branch: TillBranchSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTillRequest {
  tillName: string;
  tillCode: string;
  branchId: number;
  isActive: boolean;
}

export type UpdateTillRequest = Partial<Pick<CreateTillRequest, "tillName" | "tillCode" | "isActive">>;
