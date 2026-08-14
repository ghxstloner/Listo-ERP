export type ElectronicInvoiceStatus =
  | "PENDING"
  | "PROCESSING"
  | "ACCEPTED"
  | "REJECTED"
  | "FAILED";

export interface ElectronicInvoice {
  id: number;
  status: ElectronicInvoiceStatus;
  consecutive: string;
  canDownload: boolean;
}

export interface ElectronicInvoiceListItem {
  id: number;
  createdAt: string;
  total: number;
  customer: { name: string };
  seller: { name: string };
  electronicInvoice: ElectronicInvoice | null;
}
