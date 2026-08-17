"use client";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { useTranslation } from "@/hooks/use-translation";
import { useCurrency } from "@/packages/currency/components/currency-provider";
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
import { useGetProductKardex } from "../api";
import type { ProductKardexMovement } from "../types";

const movementLabels: Record<string, string> = {
  PURCHASE_RECEIPT: "inventory.products.kardex.purchase",
  PURCHASE_INVOICE: "inventory.products.kardex.purchase",
  MANUAL_ENTRY: "inventory.products.kardex.entry",
  INVENTORY_ADJUSTMENT: "inventory.products.kardex.adjustment",
  TRANSFER_IN: "inventory.products.kardex.transferIn",
  TRANSFER_OUT: "inventory.products.kardex.transferOut",
  SALE: "inventory.products.kardex.sale",
  ORDER_RESERVE: "inventory.products.kardex.orderReserve",
  ORDER_CANCEL: "inventory.products.kardex.orderCancel",
};

function SortableHeader({
  column,
  children,
}: {
  column: Column<ProductKardexMovement, unknown>;
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

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

export function ProductKardexTab({ productId }: { productId: number }) {
  const t = useTranslation();
  const { formatMoney } = useCurrency();
  const [warehouses] = useGetWarehouses();
  const [filters, setFilters] = useState({
    warehouseId: undefined as number | undefined,
    dateFrom: "",
    dateTo: "",
  });
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [movements, loading, error] = useGetProductKardex(productId, filters);

  const columns = useMemo<ColumnDef<ProductKardexMovement>[]>(
    () => [
      {
        id: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.kardex.date")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        sortingFn: "datetime",
      },
      {
        id: "type",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.kardex.type")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.type,
        cell: ({ row }) =>
          movementLabels[row.original.type]
            ? t(movementLabels[row.original.type])
            : row.original.type,
        sortingFn: "alphanumeric",
      },
      {
        id: "warehouse",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.kardex.warehouse")}
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
            {t("inventory.products.kardex.quantity")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.quantity,
        cell: ({ row }) => {
          const quantity = row.original.quantity;
          return (
            <span
              className={quantity >= 0 ? "text-emerald-600" : "text-red-600"}
            >
              {quantity >= 0 ? "+" : ""}
              {quantity}
            </span>
          );
        },
        sortingFn: "basic",
      },
      {
        id: "unitCost",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.kardex.unitCost")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.unitCost,
        cell: ({ row }) => formatMoney(row.original.unitCost),
        sortingFn: "basic",
      },
      {
        id: "balanceAfter",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.kardex.resultingStock")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.balanceAfter,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.balanceAfter}</span>
        ),
        sortingFn: "basic",
      },
    ],
    [formatMoney, t],
  );

  const table = useReactTable({
    data: movements ?? [],
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
        row.original.type,
        row.original.warehouse.name,
        row.original.warehouse.code,
      ].some((item) => item.toLowerCase().includes(query));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 xl:flex-row xl:items-end">
        <div className="relative min-w-0 flex-1 xl:max-w-sm">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("inventory.products.kardex.search")}
          />
        </div>
        <Select
          value={filters.warehouseId?.toString() ?? "ALL"}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              warehouseId: value === "ALL" ? undefined : Number(value),
            }))
          }
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue
              placeholder={t("inventory.products.kardex.warehouse")}
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
        <DateRangePicker
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onChange={(range) =>
            setFilters((current) => ({ ...current, ...range }))
          }
          placeholder={t("inventory.products.kardex.dateRange")}
          clearLabel={t("inventory.products.kardex.clearFilters")}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch("");
            setFilters({ warehouseId: undefined, dateFrom: "", dateTo: "" });
          }}
        >
          {t("inventory.products.kardex.clearFilters")}
        </Button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-muted-foreground">
          {t("common.loading")}
        </p>
      ) : null}
      {error ? (
        <p className="py-8 text-center text-destructive">{error.message}</p>
      ) : null}
      {!loading && !error ? (
        <>
          <DataTable
            table={table}
            emptyMessage={t("inventory.products.kardex.empty")}
            className="overflow-x-auto"
            cellClassName={(cell) =>
              ["quantity", "unitCost", "balanceAfter"].includes(cell.column.id)
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
        </>
      ) : null}
    </div>
  );
}
