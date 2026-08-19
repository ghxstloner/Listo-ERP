export interface PurchaseInvoiceItem {
  id: number;
  productId: number;
  quantity: number;
  unitCost: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  product: { id: number; sku: string; name: string; unit: string | null };
}

export interface PurchaseInvoice {
  id: number;
  supplierId: number;
  warehouseId: number;
  purchaseOrderId: number | null;
  seriesId: number;
  consecutive: number;
  documentNumber: string;
  supplierInvoiceNumber: string;
  issueDate: string;
  status: "POSTED" | "CANCELLED";
  subtotal: number;
  taxAmount: number;
  total: number;
  postedAt: string;
  createdAt: string;
  supplier: { id: number; name: string; taxId: string | null };
  warehouse: { id: number; name: string; code: string };
  items: PurchaseInvoiceItem[];
}

export interface CreatePurchaseInvoiceRequest {
  supplierId: number;
  warehouseId: number;
  issueDate: string;
  purchaseOrderId: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitCost: number;
    taxRate?: number;
  }>;
}
