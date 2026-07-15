import { useApiQuery } from "@config";
import type { PaymentMethod } from "./types";

export type { PaymentMethod } from "./types";

export const useGetPaymentMethods = () =>
  useApiQuery<PaymentMethod[]>(["payment-methods"], "payment-methods");
