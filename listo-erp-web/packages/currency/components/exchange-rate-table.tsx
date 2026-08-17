"use client";

import { DataTable, DataTablePagination } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useDeleteExchangeRate } from "@/packages/currency/api";
import type { ExchangeRate } from "@/packages/currency/types";
import { useQueryClient } from "@tanstack/react-query";
import { type Column, type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { Plus, Trash } from "@phosphor-icons/react";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ExchangeRateTableProps { rates: ExchangeRate[]; isLoading: boolean; onAdd: () => void; }

function SortableHeader({ column, children }: { column: Column<ExchangeRate, unknown>; children: React.ReactNode }) {
  return <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>;
}

export function ExchangeRateTable({ rates, isLoading, onAdd }: ExchangeRateTableProps) {
  const t = useTranslation();
  const [rateToDelete, setRateToDelete] = useState<ExchangeRate | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo<ColumnDef<ExchangeRate>[]>(() => [
    { id: "from", accessorFn: (row) => row.fromCurrency.code, header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.from")}</SortableHeader>, cell: ({ row }) => <span className="font-medium">{row.original.fromCurrency.code}</span> },
    { id: "to", accessorFn: (row) => row.toCurrency.code, header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.to")}</SortableHeader>, cell: ({ row }) => row.original.toCurrency.code },
    { id: "date", accessorKey: "date", header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.date")}</SortableHeader>, cell: ({ row }) => <span className="text-muted-foreground">{row.original.date.slice(0, 10)}</span>, sortingFn: "datetime" },
    { id: "rate", accessorKey: "rate", header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.rate")}</SortableHeader>, cell: ({ row }) => <span className="font-mono text-sm">{row.original.rate}</span> },
    { id: "actions", header: () => <div className="text-right">{t("administration.currencies.actions")}</div>, cell: ({ row }) => <div className="flex justify-end"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setRateToDelete(row.original)}><span className="sr-only">{t("common.delete")}</span><Trash className="h-4 w-4 text-destructive" /></Button></div>, enableSorting: false },
  ], [t]);
  const table = useReactTable({ data: rates, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });
  return <Card>
    <CardHeader className="flex flex-row align-right"><Button size="sm" onClick={onAdd} className="ml-auto"><Plus className="mr-2 h-4 w-4" />{t("administration.currencies.addRate")}</Button></CardHeader>
    <CardContent>
      <DataTable table={table} loading={isLoading} loadingMessage={t("common.loading")} emptyMessage={t("administration.currencies.noRates")} />
      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </CardContent>
    <RateDeleteDialog rate={rateToDelete} onClose={() => setRateToDelete(null)} />
  </Card>;
}

function RateDeleteDialog({ rate, onClose }: { rate: ExchangeRate | null; onClose: () => void }) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deleteRate, isDeleting, error] = useDeleteExchangeRate(rate?.id ?? 0);
  useEffect(() => { if (error) showToast({ type: "error", message: error.message || t("common.error") }); }, [error, t]);
  return <ConfirmDialog open={!!rate} onOpenChange={(open) => !open && onClose()} onConfirm={() => deleteRate(undefined, () => { queryClient.invalidateQueries({ queryKey: ["exchange-rates"] }); onClose(); showToast({ type: "success", message: t("administration.currencies.rateDeleted") }); })} title={t("administration.currencies.deleteRate")} description={t("administration.currencies.deleteRateMessage")} confirmText={t("common.delete")} cancelText={t("common.cancel")} severity="destructive" isLoading={isDeleting} />;
}
