"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { showToast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/use-translation";
import { useDeleteExchangeRate } from "@/packages/currency/api";
import type { ExchangeRate } from "@/packages/currency/types";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface ExchangeRateTableProps {
  rates: ExchangeRate[];
  isLoading: boolean;
  onAdd: () => void;
}

export function ExchangeRateTable({
  rates,
  isLoading,
  onAdd,
}: ExchangeRateTableProps) {
  const t = useTranslation();
  const [rateToDelete, setRateToDelete] = useState<ExchangeRate | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row align-right">
        <Button size="sm" onClick={onAdd} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("administration.currencies.addRate")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>{t("administration.currencies.from")}</TableHead>
                <TableHead>{t("administration.currencies.to")}</TableHead>
                <TableHead>{t("administration.currencies.date")}</TableHead>
                <TableHead>{t("administration.currencies.rate")}</TableHead>
                <TableHead className="w-20 text-right">
                  {t("administration.currencies.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : rates.length ? (
                rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">
                      {rate.fromCurrency.code}
                    </TableCell>
                    <TableCell>{rate.toCurrency.code}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {rate.date.slice(0, 10)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {rate.rate}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setRateToDelete(rate)}
                        >
                          <span className="sr-only">{t("common.delete")}</span>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t("administration.currencies.noRates")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <RateDeleteDialog
        rate={rateToDelete}
        onClose={() => setRateToDelete(null)}
      />
    </Card>
  );
}

function RateDeleteDialog({
  rate,
  onClose,
}: {
  rate: ExchangeRate | null;
  onClose: () => void;
}) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deleteRate, isDeleting, error] = useDeleteExchangeRate(rate?.id ?? 0);

  useEffect(() => {
    if (error)
      showToast({ type: "error", message: error.message || t("common.error") });
  }, [error, t]);

  return (
    <ConfirmDialog
      open={!!rate}
      onOpenChange={(open) => !open && onClose()}
      onConfirm={() =>
        deleteRate(undefined, () => {
          queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
          onClose();
          showToast({
            type: "success",
            message: t("administration.currencies.rateDeleted"),
          });
        })
      }
      title={t("administration.currencies.deleteRate")}
      description={t("administration.currencies.deleteRateMessage")}
      confirmText={t("common.delete")}
      cancelText={t("common.cancel")}
      severity="destructive"
      isLoading={isDeleting}
    />
  );
}
