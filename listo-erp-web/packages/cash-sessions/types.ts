export type CashSessionStatus = "OPEN" | "EXPIRED" | "CLOSED";

export interface CashSessionParty {
  id: number;
  name: string;
  email?: string;
}

export interface CashSessionTill {
  id: number;
  tillCode: string;
  tillName: string;
  branch?: CashSessionBranch;
}

export interface CashSessionBranch {
  id: number;
  name: string;
  branchCode: string | null;
}

export interface CashSession {
  id: number;
  companyId: number;
  branchId: number;
  tillId: number;
  deviceKey: string;
  openedByUserId: number;
  closedByUserId: number | null;
  status: CashSessionStatus;
  openedAt: string;
  expiresAt: string;
  closedAt: string | null;
  openingAmount: string;
  expectedClosingAmount: string | null;
  declaredClosingAmount: string | null;
  differenceAmount: string | null;
  openingNote: string | null;
  closingNote: string | null;
  branch: CashSessionBranch;
  till: CashSessionTill;
  openedByUser: CashSessionParty;
  closedByUser: CashSessionParty | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpenCashSessionRequest {
  tillId: number;
  deviceKey: string;
  openingAmount: number;
  openingNote?: string;
}

export interface CloseCashSessionRequest {
  declaredClosingAmount: number;
  closingNote?: string;
}

export interface ApiMessageResponse<T> {
  message: string;
  data: T;
}
