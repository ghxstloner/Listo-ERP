import { api, useApiMutation, useApiQuery } from "@config";
import type { ApiMessageResponse, CreateSaleRequest, ElectronicInvoiceStatusResponse, PaymentMethod, Sale } from "./types";

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
