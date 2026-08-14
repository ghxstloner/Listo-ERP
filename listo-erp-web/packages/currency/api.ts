import { getApiCompanyId, useApiMutation, useApiQuery } from "@config";
import type {
  CreateExchangeRateRequest,
  Currency,
  ExchangeRate,
  UpdateCurrencyConfigRequest,
} from "./types";

export const useGetCurrencies = () => {
  const companyId = getApiCompanyId();
  return useApiQuery<Currency[]>(
    ["currencies", companyId],
    "currencies",
    undefined,
    { enabled: Boolean(companyId) },
  );
};

export const useUpdateCurrencyConfig = (currencyId: number) =>
  useApiMutation<
    { message: string; data: Currency },
    UpdateCurrencyConfigRequest
  >(`currencies/${currencyId}/config`, "patch");

export const useGetExchangeRates = () =>
  useApiQuery<ExchangeRate[]>(["exchange-rates"], "exchange-rates");

export const useCreateExchangeRate = () =>
  useApiMutation<
    { message: string; data: ExchangeRate },
    CreateExchangeRateRequest
  >("exchange-rates", "post");

export const useDeleteExchangeRate = (rateId: number) =>
  useApiMutation<{ message: string }, void>(
    `exchange-rates/${rateId}`,
    "delete",
  );
