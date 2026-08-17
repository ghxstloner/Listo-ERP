"use client";

import { DataTable, DataTablePagination } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/sonner";
import { useUpdateCurrencyConfig } from "@/packages/currency/api";
import type { Currency } from "@/packages/currency/types";
import { DotsThreeVertical, Pencil, Power } from "@phosphor-icons/react";
import {
  type Column,
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TFunction = (key: string) => string;

interface CurrencyTableProps {
  currencies: Currency[];
  onEdit: (currency: Currency) => void;
  t: TFunction;
}

function StatusPill({ isActive, t }: { isActive: boolean; t: TFunction }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
      {isActive ? t("administration.currencies.active") : t("administration.currencies.inactive")}
    </span>
  );
}

function SortableHeader({ column, children }: { column: Column<Currency, unknown>; children: React.ReactNode }) {
  return <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>;
}

function buildColumns({ onEdit, t }: CurrencyTableProps): ColumnDef<Currency>[] {
  return [
    { id: "code", accessorKey: "code", header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.code")}</SortableHeader>, cell: ({ row }) => <><div className="font-medium">{row.original.code}</div><div className="text-muted-foreground text-sm">{row.original.name}</div></> },
    { id: "symbol", accessorKey: "symbol", header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.symbol")}</SortableHeader>, cell: ({ row }) => <span className="font-medium">{row.original.symbol}</span> },
    { id: "decimalPlaces", accessorKey: "decimalPlaces", header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.decimals")}</SortableHeader> },
    { id: "separators", accessorFn: (row) => `${row.decimalSeparator} / ${row.thousandsSeparator}`, header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.separators")}</SortableHeader>, cell: ({ row }) => <span className="font-mono text-xs">{row.original.decimalSeparator} / {row.original.thousandsSeparator}</span> },
    { id: "status", accessorFn: (row) => (row.isActive ? "ACTIVE" : "INACTIVE"), header: ({ column }) => <SortableHeader column={column}>{t("administration.currencies.status")}</SortableHeader>, cell: ({ row }) => <StatusPill isActive={row.original.isActive} t={t} /> },
    { id: "actions", header: () => <div className="text-right">{t("administration.currencies.actions")}</div>, cell: ({ row }) => <div className="flex justify-end"><CurrencyActions currency={row.original} onEdit={onEdit} t={t} /></div>, enableSorting: false },
  ];
}

export function CurrencyTable({ currencies, onEdit, t }: CurrencyTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return currencies.filter((currency) => {
      const matchesSearch = !query || currency.code.toLowerCase().includes(query) || currency.name.toLowerCase().includes(query) || currency.symbol.toLowerCase().includes(query);
      const matchesStatus = status === "all" || (status === "ACTIVE" && currency.isActive) || (status === "INACTIVE" && !currency.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [currencies, search, status]);
  const columns = useMemo(() => buildColumns({ currencies, onEdit, t }), [currencies, onEdit, t]);
  const table = useReactTable({
    data: filteredCurrencies,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("administration.currencies.searchCurrencies")} className="sm:max-w-sm" />
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="min-w-40"><SelectValue placeholder={t("administration.currencies.status")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("administration.currencies.allStatuses")}</SelectItem><SelectItem value="ACTIVE">{t("administration.currencies.active")}</SelectItem><SelectItem value="INACTIVE">{t("administration.currencies.inactive")}</SelectItem></SelectContent></Select>
    </div>
    <DataTable table={table} emptyMessage={t("administration.currencies.noCurrencies")} />
    <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
  </div>;
}

function CurrencyActions({ currency, onEdit, t }: { currency: Currency; onEdit: (currency: Currency) => void; t: TFunction }) {
  const queryClient = useQueryClient();
  const [updateCurrency, isUpdating, error] = useUpdateCurrencyConfig(currency.id);
  const toggle = () => updateCurrency({ isActive: !currency.isActive }, () => {
    queryClient.invalidateQueries({ queryKey: ["currencies"] });
    showToast({ type: "success", message: t("administration.currencies.currencyUpdated") });
  });
  useEffect(() => { if (error) showToast({ type: "error", message: error.message || t("common.error") }); }, [error, t]);
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><span className="sr-only">{t("administration.currencies.actions")}</span><DotsThreeVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onEdit(currency)}><Pencil className="mr-2 h-4 w-4" />{t("administration.currencies.edit")}</DropdownMenuItem><DropdownMenuItem onClick={toggle} disabled={isUpdating} className={currency.isActive ? "text-destructive focus:text-destructive" : ""}><Power className="mr-2 h-4 w-4" />{currency.isActive ? t("administration.currencies.deactivate") : t("administration.currencies.activate")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
