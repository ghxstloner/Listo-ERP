import type { CompanyCurrency } from "@/packages/company/types";

export const DEFAULT_CURRENCY: CompanyCurrency = {
  id: 0,
  code: "USD",
  name: "Dolar estadounidense",
  symbol: "$",
  decimalPlaces: 2,
  decimalSeparator: ".",
  thousandsSeparator: ",",
  format: "symbol_before",
  rounding: "half_up",
};

function roundValue(value: number, currency: CompanyCurrency): number {
  const factor = 10 ** currency.decimalPlaces;
  const scaled = value * factor;
  const sign = scaled < 0 ? -1 : 1;
  const absolute = Math.abs(scaled);

  let rounded: number;
  switch (currency.rounding) {
    case "up":
      rounded = Math.ceil(absolute);
      break;
    case "down":
      rounded = Math.floor(absolute);
      break;
    case "half_even": {
      const lower = Math.floor(absolute);
      const remainder = absolute - lower;
      rounded =
        remainder > 0.5 || (remainder === 0.5 && lower % 2 !== 0)
          ? lower + 1
          : lower;
      break;
    }
    case "half_up":
    default:
      rounded = Math.floor(absolute + 0.5);
      break;
  }

  return (sign * rounded) / factor;
}

export function formatMoney(
  value: number | string | null | undefined,
  currency: CompanyCurrency = DEFAULT_CURRENCY,
): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";

  const rounded = roundValue(amount, currency);
  const sign = rounded < 0 ? "-" : "";
  const fixed = Math.abs(rounded).toFixed(currency.decimalPlaces);
  const [integerPart, decimalPart] = fixed.split(".");
  const groupedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.thousandsSeparator,
  );
  const number = decimalPart
    ? `${groupedInteger}${currency.decimalSeparator}${decimalPart}`
    : groupedInteger;
  const token = currency.format.startsWith("code")
    ? currency.code
    : currency.symbol;
  const tokenFirst = currency.format.endsWith("before");

  return tokenFirst ? `${sign}${token} ${number}` : `${sign}${number} ${token}`;
}

export function parseMoney(
  value: string | number | null | undefined,
  currency: CompanyCurrency = DEFAULT_CURRENCY,
): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value?.trim()) return 0;

  const token = currency.format.startsWith("code")
    ? currency.code
    : currency.symbol;
  const normalized = value
    .trim()
    .replaceAll(token, "")
    .replaceAll(currency.thousandsSeparator, "")
    .replace(currency.decimalSeparator, ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}
