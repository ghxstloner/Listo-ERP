"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { ProductHistoryFilterBar } from "@/packages/product/components/product-history-filter-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useGetSuppliers } from "@/packages/suppliers/api";
import { useGetWarehouses } from "@/packages/warehouse/api";
import {
  type Column,
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useGetProductPurchases } from "../api";
import type { ProductPurchase } from "../types";

function SortableHeader({
  column,
  children,
}: {
  column: Column<ProductPurchase, unknown>;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2"
      onClick={column.getToggleSortingHandler()}
    >
      {children}
      <ArrowUpDown className="ml-2 size-4" />
    </Button>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

export function ProductPurchasesTab({ productId }: { productId: number }) {
  const t = useTranslation();
  const { formatMoney } = useCurrency();
  const [suppliers] = useGetSuppliers();
  const [warehouses] = useGetWarehouses();
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    supplierId: undefined as number | undefined,
    warehouseId: undefined as number | undefined,
  });
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [purchases, loading, error] = useGetProductPurchases(
    productId,
    filters,
  );

  const columns = useMemo<ColumnDef<ProductPurchase>[]>(
    () => [
      {
        id: "document",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.document")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.id,
        cell: ({ row }) => row.original.documentNumber,
        sortingFn: "basic",
      },
      {
        id: "date",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.date")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.issueDate,
        cell: ({ row }) => formatDate(row.original.issueDate),
        sortingFn: "datetime",
      },
      {
        id: "supplier",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.supplier")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.supplier.name,
        cell: ({ row }) => row.original.supplier.name,
        sortingFn: "alphanumeric",
      },
      {
        id: "warehouse",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.warehouse")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.warehouse.name,
        cell: ({ row }) => row.original.warehouse.name,
        sortingFn: "alphanumeric",
      },
      {
        id: "quantity",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.quantity")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.quantity,
        cell: ({ row }) => row.original.quantity,
        sortingFn: "basic",
      },
      {
        id: "unitCost",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.unitCost")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.unitCost,
        cell: ({ row }) => formatMoney(row.original.unitCost),
        sortingFn: "basic",
      },
      {
        id: "total",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.total")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.total,
        cell: ({ row }) => (
          <span className="font-medium">{formatMoney(row.original.total)}</span>
        ),
        sortingFn: "basic",
      },
    ],
    [formatMoney, t],
  );

  const table = useReactTable({
    data: purchases ?? [],
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, value) => {
      const query = String(value ?? "")
        .trim()
        .toLowerCase();
      if (!query) return true;
      return [
        row.original.documentNumber,
        row.original.supplierInvoiceNumber,
        row.original.supplier.name,
        row.original.warehouse.name,
      ].some((item) => item.toLowerCase().includes(query));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const clear = () => {
    setSearch("");
    setFilters({
      dateFrom: "",
      dateTo: "",
      supplierId: undefined,
      warehouseId: undefined,
    });
  };

  if (loading)
    return (
      <p className="py-8 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  if (error)
    return <p className="py-8 text-center text-destructive">{error.message}</p>;

  return (
    <div className="space-y-4">
      <ProductHistoryFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("inventory.products.history.searchPurchases")}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onDateChange={(range) =>
          setFilters((current) => ({ ...current, ...range }))
        }
        datePlaceholder={t("inventory.products.history.dateRange")}
        clearLabel={t("inventory.products.history.clearFilters")}
        onClear={clear}
      >
        <Select
          value={filters.supplierId?.toString() ?? "ALL"}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              supplierId: value === "ALL" ? undefined : Number(value),
            }))
          }
        >
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue
              placeholder={t("inventory.products.history.supplier")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              {t("inventory.products.history.allSuppliers")}
            </SelectItem>
            {(suppliers ?? [])
              .filter((supplier) => supplier.isActive)
              .map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.warehouseId?.toString() ?? "ALL"}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              warehouseId: value === "ALL" ? undefined : Number(value),
            }))
          }
        >
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue
              placeholder={t("inventory.products.history.warehouse")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              {t("inventory.products.kardex.allWarehouses")}
            </SelectItem>
            {(warehouses ?? [])
              .filter((warehouse) => warehouse.isActive)
              .map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </ProductHistoryFilterBar>
      <DataTable
        table={table}
        emptyMessage={t("inventory.products.history.empty")}
        className="overflow-x-auto"
        cellClassName={(cell) =>
          ["quantity", "unitCost", "total"].includes(cell.column.id)
            ? "text-right"
            : undefined
        }
      />
      <DataTablePagination
        table={table}
        pageLabel={t("common.page")}
        previousLabel={t("common.previous")}
        nextLabel={t("common.next")}
        className="items-center"
      />
    </div>
  );
}
