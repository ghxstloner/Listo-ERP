import { api, useApiMutation, useApiQuery } from "@config";
import type { ApiMessageResponse, CreateSaleRequest, ElectronicInvoiceStatus, ElectronicInvoiceStatusResponse, PaymentMethod, Sale, SaleListItem } from "./types";

export type { PaymentMethod } from "./types";

export const useGetPaymentMethods = () =>
  useApiQuery<PaymentMethod[]>(["payment-methods"], "payment-methods");

export const useCreateSale = () =>
  useApiMutation<ApiMessageResponse<Sale>, CreateSaleRequest>("sales", "post");

export const useGetElectronicInvoiceStatus = (
  saleId: number | null,
  shouldPoll: boolean,
) =>
  useApiQuery<ElectronicInvoiceStatusResponse>(
    ["electronic-invoices", saleId],
    `electronic-invoicing/sales/${saleId ?? 0}/invoice`,
    undefined,
    {
      enabled: saleId != null,
      refetchInterval: (query) =>
        shouldPoll && ["PENDING", "PROCESSING"].includes(query.state.data?.status ?? "")
          ? 3000
          : false,
      refetchOnWindowFocus: true,
    },
  );

export const downloadElectronicInvoiceReceipt = async (saleId: number) =>
  api.getBlob(`electronic-invoicing/sales/${saleId}/invoice/receipt`);

export const useGetSales = (filters: {
  status?: ElectronicInvoiceStatus | "all";
  dateFrom?: string;
  dateTo?: string;
}) => {
  const params: Record<string, string | undefined> = {};
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  return useApiQuery<SaleListItem[]>(
    ["sales", filters.status ?? "all", filters.dateFrom ?? "", filters.dateTo ?? ""],
    "sales",
    Object.keys(params).length > 0 ? { params } : undefined,
  );
};
