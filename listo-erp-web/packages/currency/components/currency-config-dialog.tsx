"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useUpdateCurrencyConfig } from "@/packages/currency/api";
import type {
  Currency,
  CurrencyFormat,
  CurrencyRounding,
} from "@/packages/currency/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const formats: CurrencyFormat[] = [
  "symbol_before",
  "symbol_after",
  "code_before",
  "code_after",
];
const roundings: CurrencyRounding[] = ["half_up", "half_even", "up", "down"];

export function CurrencyConfigDialog({
  currency,
  onOpenChange,
}: {
  currency: Currency | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [updateCurrency, isSaving, error] = useUpdateCurrencyConfig(
    currency?.id ?? 0,
  );
  const [symbol, setSymbol] = useState(currency?.symbol ?? "");
  const [decimalPlaces, setDecimalPlaces] = useState(
    currency?.decimalPlaces ?? 2,
  );
  const [decimalSeparator, setDecimalSeparator] = useState(
    currency?.decimalSeparator ?? ".",
  );
  const [thousandsSeparator, setThousandsSeparator] = useState(
    currency?.thousandsSeparator ?? ",",
  );
  const [format, setFormat] = useState<CurrencyFormat>(
    currency?.format ?? "symbol_before",
  );
  const [rounding, setRounding] = useState<CurrencyRounding>(
    currency?.rounding ?? "half_up",
  );

  useEffect(() => {
    if (error)
      showToast({ type: "error", message: error.message || t("common.error") });
  }, [error, t]);

  if (!currency) return null;

  const save = () => {
    if (!symbol.trim()) return;
    updateCurrency(
      {
        symbol: symbol.trim(),
        decimalPlaces,
        decimalSeparator,
        thousandsSeparator,
        format,
        rounding,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["currencies"] });
        onOpenChange(false);
        showToast({
          type: "success",
          message: t("administration.currencies.currencyUpdated"),
        });
      },
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>
            {t("administration.currencies.editCurrency")}
          </DialogTitle>
          <DialogDescription>
            {currency.code} · {currency.name}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-4 p-4 py-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currency-symbol">
                {t("administration.currencies.symbol")}
              </Label>
              <Input
                id="currency-symbol"
                className="w-full"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-decimals">
                {t("administration.currencies.decimals")}
              </Label>
              <Input
                id="currency-decimals"
                className="w-full"
                type="number"
                min={0}
                max={4}
                value={decimalPlaces}
                onChange={(event) =>
                  setDecimalPlaces(Number(event.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("administration.currencies.decimalSeparator")}</Label>
              <Select
                value={decimalSeparator}
                onValueChange={setDecimalSeparator}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=".">. (1.25)</SelectItem>
                  <SelectItem value=",">, (1,25)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("administration.currencies.thousandsSeparator")}</Label>
              <Select
                value={thousandsSeparator}
                onValueChange={setThousandsSeparator}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">, (1,000)</SelectItem>
                  <SelectItem value=".">. (1.000)</SelectItem>
                  <SelectItem value=" ">Espacio (1 000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("administration.currencies.format")}</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as CurrencyFormat)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`administration.currencies.formats.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("administration.currencies.rounding")}</Label>
              <Select
                value={rounding}
                onValueChange={(value) =>
                  setRounding(value as CurrencyRounding)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roundings.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`administration.currencies.roundings.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={isSaving || !symbol.trim()}>
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
