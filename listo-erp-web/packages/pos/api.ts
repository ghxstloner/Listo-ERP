import { useApiMutation, useApiQuery } from "@config";
import type { ApiMessageResponse, CreateSaleRequest, PaymentMethod, Sale } from "./types";

export type { PaymentMethod } from "./types";

export const useGetPaymentMethods = () =>
  useApiQuery<PaymentMethod[]>(["payment-methods"], "payment-methods");

export const useCreateSale = () =>
  useApiMutation<ApiMessageResponse<Sale>, CreateSaleRequest>("sales", "post");
