"use client";

import { Button } from "@/components/ui/button";
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
import { useTranslation } from "@/hooks/use-translation";
import { useCreateExchangeRate } from "@/packages/currency/api";
import type { Currency } from "@/packages/currency/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function ExchangeRateDialog({
  currencies,
  open,
  onOpenChange,
}: {
  currencies: Currency[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [createRate, isSaving, error] = useCreateExchangeRate();
  const [fromCurrencyId, setFromCurrencyId] = useState("");
  const [toCurrencyId, setToCurrencyId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (error)
      showToast({ type: "error", message: error.message || t("common.error") });
  }, [error, t]);

  const save = () => {
    const numericRate = Number(rate);
    if (
      !fromCurrencyId ||
      !toCurrencyId ||
      fromCurrencyId === toCurrencyId ||
      !date ||
      !Number.isFinite(numericRate) ||
      numericRate <= 0
    )
      return;
    createRate(
      {
        fromCurrencyId: Number(fromCurrencyId),
        toCurrencyId: Number(toCurrencyId),
        date,
        rate: numericRate,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
        onOpenChange(false);
        setRate("");
        showToast({
          type: "success",
          message: t("administration.currencies.rateCreated"),
        });
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{t("administration.currencies.addRate")}</DialogTitle>
          <DialogDescription>
            {t("administration.currencies.rateDescription")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-4 p-4 py-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exchange-rate-from">
                {t("administration.currencies.from")}
              </Label>
              <Select value={fromCurrencyId} onValueChange={setFromCurrencyId}>
                <SelectTrigger id="exchange-rate-from" className="w-full">
                  <SelectValue
                    placeholder={t("administration.currencies.selectCurrency")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={String(currency.id)}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-rate-to">
                {t("administration.currencies.to")}
              </Label>
              <Select value={toCurrencyId} onValueChange={setToCurrencyId}>
                <SelectTrigger id="exchange-rate-to" className="w-full">
                  <SelectValue
                    placeholder={t("administration.currencies.selectCurrency")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={String(currency.id)}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-rate-date">
                {t("administration.currencies.date")}
              </Label>
              <Input
                id="exchange-rate-date"
                className="w-full"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-rate-value">
                {t("administration.currencies.rate")}
              </Label>
              <Input
                id="exchange-rate-value"
                className="w-full"
                type="number"
                min="0.000001"
                step="0.000001"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder="1.000000"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={save}
            disabled={isSaving || !fromCurrencyId || !toCurrencyId || !rate}
          >
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
