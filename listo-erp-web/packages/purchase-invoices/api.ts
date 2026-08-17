import { api, useApiMutation, useApiQuery } from "@config";
import type { CreatePurchaseInvoiceRequest, PurchaseInvoice } from "./types";

export const useGetPurchaseInvoices = () =>
  useApiQuery<PurchaseInvoice[]>(["purchase-invoices"], "purchase-invoices");

export const useCreatePurchaseInvoice = () =>
  useApiMutation<
    { message: string; data: PurchaseInvoice },
    CreatePurchaseInvoiceRequest
  >("purchase-invoices", "post");

export const downloadPurchaseInvoiceReceipt = (id: number) =>
  api.getBlob(`purchase-invoices/${id}/receipt`);
