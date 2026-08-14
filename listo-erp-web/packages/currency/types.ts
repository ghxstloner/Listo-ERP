export type CurrencyFormat =
  "symbol_before" | "symbol_after" | "code_before" | "code_after";

export type CurrencyRounding = "half_up" | "half_even" | "up" | "down";

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  format: CurrencyFormat;
  rounding: CurrencyRounding;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCurrencyConfigRequest {
  isActive?: boolean;
  symbol?: string;
  decimalPlaces?: number;
  decimalSeparator?: string;
  thousandsSeparator?: string;
  format?: CurrencyFormat;
  rounding?: CurrencyRounding;
}

export interface ExchangeRate {
  id: number;
  companyId: number;
  fromCurrencyId: number;
  toCurrencyId: number;
  date: string;
  rate: number;
  fromCurrency: Pick<Currency, "id" | "code" | "name" | "symbol">;
  toCurrency: Pick<Currency, "id" | "code" | "name" | "symbol">;
}

export interface CreateExchangeRateRequest {
  fromCurrencyId: number;
  toCurrencyId: number;
  date: string;
  rate: number;
}
