"use client";

import type { CompanyCurrency } from "@/packages/company/types";
import { createContext, useContext } from "react";
import { DEFAULT_CURRENCY, formatMoney, parseMoney } from "../format";

interface CurrencyContextValue {
  currency: CompanyCurrency;
  formatMoney: (value: number | string | null | undefined) => string;
  parseMoney: (value: string | number | null | undefined) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  formatMoney: (value) => formatMoney(value, DEFAULT_CURRENCY),
  parseMoney: (value) => parseMoney(value, DEFAULT_CURRENCY),
});

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: CompanyCurrency | null | undefined;
  children: React.ReactNode;
}) {
  const activeCurrency = currency ?? DEFAULT_CURRENCY;

  return (
    <CurrencyContext.Provider
      value={{
        currency: activeCurrency,
        formatMoney: (value) => formatMoney(value, activeCurrency),
        parseMoney: (value) => parseMoney(value, activeCurrency),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
