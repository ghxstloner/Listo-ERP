export interface TillBranchSummary {
  id: number;
  name: string;
  branchCode: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  image: string | null;
  requiresReference: boolean;
  isActive: boolean;
  companyId: number;
}

export interface TillPaymentMethod {
  paymentMethod: PaymentMethod;
}

export interface Till {
  id: number;
  tillCode: string;
  tillName: string;
  isActive: boolean;
  companyId: number;
  branchId: number;
  branch: TillBranchSummary;
  paymentMethods?: TillPaymentMethod[];
  posAssociationType: "IP" | "USER_SESSION" | null;
  createdAt: string;
  updatedAt: string;
}

export type TillPosAssociationType = "IP" | "USER_SESSION";

export interface PosAssociationResponse {
  message: string;
  data: Till;
}

export interface CreateTillRequest {
  tillName: string;
  tillCode: string;
  branchId: number;
  isActive: boolean;
  paymentMethodIds?: number[];
}

export type UpdateTillRequest = Partial<
  Pick<CreateTillRequest, "tillName" | "tillCode" | "isActive" | "paymentMethodIds">
>;
