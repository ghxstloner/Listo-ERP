"use client";

import { Input } from "@/components/ui/input";
import { useCurrency } from "./currency-provider";

export function MoneyInput({
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const { currency } = useCurrency();
  const placeholder = currency.decimalPlaces
    ? `0${currency.decimalSeparator}${"0".repeat(currency.decimalPlaces)}`
    : "0";

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={value}
      placeholder={props.placeholder ?? placeholder}
      onChange={(event) => {
        const nextValue = event.target.value;
        const separatorIndex = nextValue.indexOf(currency.decimalSeparator);
        const decimalDigits =
          separatorIndex === -1
            ? 0
            : nextValue
                .slice(separatorIndex + currency.decimalSeparator.length)
                .replace(/\D/g, "").length;

        if (
          decimalDigits > currency.decimalPlaces ||
          (currency.decimalPlaces === 0 && separatorIndex !== -1)
        ) {
          return;
        }

        onValueChange(nextValue);
      }}
    />
  );
}
