"use client";

import { PageLoading } from "@/components/page-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { useGetCurrencies, useGetExchangeRates } from "@/packages/currency/api";
import { CurrencyConfigDialog } from "@/packages/currency/components/currency-config-dialog";
import { CurrencyTable } from "@/packages/currency/components/currency-table";
import { ExchangeRateDialog } from "@/packages/currency/components/exchange-rate-dialog";
import { ExchangeRateTable } from "@/packages/currency/components/exchange-rate-table";
import type { Currency } from "@/packages/currency/types";
import { Spinner } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

export function CurrencyManagement() {
  const t = useTranslation();
  const [currencies, isLoadingCurrencies, currenciesError] = useGetCurrencies();
  const [rates, isLoadingRates] = useGetExchangeRates();
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [isRateDialogOpen, setRateDialogOpen] = useState(false);

  const activeCurrencies = useMemo(
    () => (currencies ?? []).filter((currency) => currency.isActive),
    [currencies],
  );

  useEffect(() => {
    if (currenciesError) {
      showToast({
        type: "error",
        message: currenciesError.message || t("common.error"),
      });
    }
  }, [currenciesError, t]);

  if (isLoadingCurrencies) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin
      />
    );
  }

  if (currenciesError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {t("common.error")}: {currenciesError.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList>
          <TabsTrigger value="catalog">
            {t("administration.currencies.catalog")}
          </TabsTrigger>
          <TabsTrigger value="rates">
            {t("administration.currencies.ratesTitle")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="mt-2 w-full">
          <Card>
            <CardContent>
              <CurrencyTable
                currencies={currencies ?? []}
                onEdit={setEditingCurrency}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rates" className="mt-2 w-full">
          <ExchangeRateTable
            rates={rates ?? []}
            isLoading={isLoadingRates}
            onAdd={() => setRateDialogOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {editingCurrency && (
        <CurrencyConfigDialog
          key={editingCurrency.id}
          currency={editingCurrency}
          onOpenChange={(open) => !open && setEditingCurrency(null)}
        />
      )}
      <ExchangeRateDialog
        currencies={activeCurrencies}
        open={isRateDialogOpen}
        onOpenChange={setRateDialogOpen}
      />
    </div>
  );
}
