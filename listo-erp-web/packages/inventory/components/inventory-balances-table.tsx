"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import * as React from "react";
import type { InventoryBalance } from "../types";

type TFunction = (key: string) => string;

interface InventoryBalancesTableProps {
  balances: InventoryBalance[];
  t: TFunction;
  embedded?: boolean;
  action?: React.ReactNode;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<InventoryBalance, unknown>;
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
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

function buildColumns({
  t,
}: Pick<InventoryBalancesTableProps, "t">): ColumnDef<InventoryBalance>[] {
  return [
    {
      id: "warehouse",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("inventory.control.warehouse")}</SortableHeader>
      ),
      accessorFn: (row) => row.warehouse?.name ?? "",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{row.original.warehouse.name}</div>
          <div className="text-muted-foreground truncate text-xs">{row.original.warehouse.code}</div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "product",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("inventory.control.product")}</SortableHeader>
      ),
      accessorFn: (row) => `${row.product?.sku ?? ""} ${row.product?.name ?? ""}`,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate text-sm">{row.original.product.sku}</div>
          <div className="text-muted-foreground truncate text-xs">{row.original.product.name}</div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "quantity",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("inventory.control.currentStock")}</SortableHeader>
      ),
      accessorFn: (row) => row.quantity ?? 0,
      cell: ({ row }) => (
        <div className="text-right font-medium">{row.original.quantity}</div>
      ),
      sortingFn: "alphanumeric",
    },
  ];
}

export function InventoryBalancesTable({
  balances,
  t,
  embedded = false,
  action,
}: InventoryBalancesTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [warehouseValue, setWarehouseValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t }),
    [t]
  );

  const warehouses = React.useMemo(() => {
    const unique = new Map<string, string>();
    balances.forEach((balance) => {
      unique.set(String(balance.warehouse.id), balance.warehouse.name);
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [balances]);

  const table = useReactTable({
    data: balances ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;
      return [
        row.original.warehouse?.name,
        row.original.warehouse?.code,
        row.original.product?.sku,
        row.original.product?.name,
      ].some((value) => value?.toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className={embedded ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t("inventory.control.searchBalances")}
            className="sm:max-w-sm"
          />
          <Select
            value={warehouseValue}
            onValueChange={(value) => {
              if (value === "ALL") {
                table.getColumn("warehouse")?.setFilterValue(undefined);
                setWarehouseValue("");
                return;
              }
              setWarehouseValue(value);
              table.getColumn("warehouse")?.setFilterValue(value);
            }}
          >
            <SelectTrigger size="default" className="min-w-40">
              <SelectValue placeholder={t("inventory.control.filterByWarehouse")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("inventory.control.allWarehouses")}</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.name}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">{action}</div>
      </div>

      <DataTable table={table} emptyMessage={t("inventory.control.noStock")} />

      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}
