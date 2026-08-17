"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useGetBranches } from "@/packages/branch/api";
import { type Column, type ColumnDef, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useGetProductSales } from "../api";
import { ProductHistoryFilterBar } from "./product-history-filter-bar";
import type { ProductSale } from "../types";

function SortableHeader({ column, children }: { column: Column<ProductSale, unknown>; children: React.ReactNode }) {
  return <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 size-4" /></Button>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

export function ProductSalesTab({ productId }: { productId: number }) {
  const t = useTranslation();
  const { formatMoney } = useCurrency();
  const [branches] = useGetBranches();
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", branchId: undefined as number | undefined, status: undefined as string | undefined });
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [sales, loading, error] = useGetProductSales(productId, filters);

  const columns = useMemo<ColumnDef<ProductSale>[]>(() => [
    { id: "document", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.document")}</SortableHeader>, accessorFn: (row) => row.electronicInvoice?.consecutive ?? `#${row.id}`, cell: ({ row }) => row.original.electronicInvoice?.consecutive ?? `#${row.original.id}`, sortingFn: "alphanumeric" },
    { id: "date", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.date")}</SortableHeader>, accessorFn: (row) => row.createdAt, cell: ({ row }) => formatDate(row.original.createdAt), sortingFn: "datetime" },
    { id: "status", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.invoiceStatus")}</SortableHeader>, accessorFn: (row) => row.electronicInvoice?.status ?? "", cell: ({ row }) => row.original.electronicInvoice ? t(`sales.electronicInvoices.statusLabels.${row.original.electronicInvoice.status.toLowerCase()}`) : "-", sortingFn: "alphanumeric" },
    { id: "customer", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.customer")}</SortableHeader>, accessorFn: (row) => row.customer.name, cell: ({ row }) => row.original.customer.name, sortingFn: "alphanumeric" },
    { id: "seller", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.seller")}</SortableHeader>, accessorFn: (row) => row.seller.name, cell: ({ row }) => row.original.seller.name, sortingFn: "alphanumeric" },
    { id: "branch", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.branch")}</SortableHeader>, accessorFn: (row) => row.branch.name, cell: ({ row }) => row.original.branch.name, sortingFn: "alphanumeric" },
    { id: "quantity", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.quantity")}</SortableHeader>, accessorFn: (row) => row.quantity, cell: ({ row }) => row.original.quantity, sortingFn: "basic" },
    { id: "unitPrice", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.unitPrice")}</SortableHeader>, accessorFn: (row) => row.unitPrice, cell: ({ row }) => formatMoney(row.original.unitPrice), sortingFn: "basic" },
    { id: "total", header: ({ column }) => <SortableHeader column={column}>{t("inventory.products.history.total")}</SortableHeader>, accessorFn: (row) => row.total, cell: ({ row }) => <span className="font-medium">{formatMoney(row.original.total)}</span>, sortingFn: "basic" },
  ], [formatMoney, t]);

  const table = useReactTable({
    data: sales ?? [], columns, state: { sorting, globalFilter: search }, onSortingChange: setSorting, onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, value) => {
      const query = String(value ?? "").trim().toLowerCase();
      if (!query) return true;
      return [row.original.electronicInvoice?.consecutive ?? "", String(row.original.id), row.original.customer.name, row.original.seller.name, row.original.branch.name].some((item) => item.toLowerCase().includes(query));
    },
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
  });

  const clear = () => { setSearch(""); setFilters({ dateFrom: "", dateTo: "", branchId: undefined, status: undefined }); };

  if (loading) return <p className="py-8 text-center text-muted-foreground">{t("common.loading")}</p>;
  if (error) return <p className="py-8 text-center text-destructive">{error.message}</p>;

  return (
    <div className="space-y-4">
      <ProductHistoryFilterBar search={search} onSearchChange={setSearch} searchPlaceholder={t("inventory.products.history.searchSales")} dateFrom={filters.dateFrom} dateTo={filters.dateTo} onDateChange={(range) => setFilters((current) => ({ ...current, ...range }))} datePlaceholder={t("inventory.products.history.dateRange")} clearLabel={t("inventory.products.history.clearFilters")} onClear={clear}>
        <Select value={filters.status ?? "ALL"} onValueChange={(value) => setFilters((current) => ({ ...current, status: value === "ALL" ? undefined : value }))}>
          <SelectTrigger className="w-full xl:w-52"><SelectValue placeholder={t("inventory.products.history.invoiceStatus")} /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">{t("inventory.products.history.allStatuses")}</SelectItem><SelectItem value="ACCEPTED">{t("sales.electronicInvoices.statusLabels.accepted")}</SelectItem><SelectItem value="PENDING">{t("sales.electronicInvoices.statusLabels.pending")}</SelectItem><SelectItem value="PROCESSING">{t("sales.electronicInvoices.statusLabels.processing")}</SelectItem><SelectItem value="REJECTED">{t("sales.electronicInvoices.statusLabels.rejected")}</SelectItem><SelectItem value="FAILED">{t("sales.electronicInvoices.statusLabels.failed")}</SelectItem></SelectContent>
        </Select>
        <Select value={filters.branchId?.toString() ?? "ALL"} onValueChange={(value) => setFilters((current) => ({ ...current, branchId: value === "ALL" ? undefined : Number(value) }))}>
          <SelectTrigger className="w-full xl:w-52"><SelectValue placeholder={t("inventory.products.history.branch")} /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">{t("inventory.products.history.allBranches")}</SelectItem>{(branches ?? []).filter((branch) => branch.isActive).map((branch) => <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>)}</SelectContent>
        </Select>
      </ProductHistoryFilterBar>
      <DataTable table={table} emptyMessage={t("inventory.products.history.empty")} className="overflow-x-auto" cellClassName={(cell) => ["quantity", "unitPrice", "total"].includes(cell.column.id) ? "text-right" : undefined} />
      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} className="items-center" />
    </div>
  );
}
