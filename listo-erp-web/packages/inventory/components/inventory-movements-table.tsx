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
import type { InventoryMovement } from "../types";

type TFunction = (key: string) => string;

interface InventoryMovementsTableProps {
  movements: InventoryMovement[];
  t: TFunction;
  embedded?: boolean;
  action?: React.ReactNode;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<InventoryMovement, unknown>;
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

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getMovementTypeLabel(type: string, t: TFunction): string {
  const typeMap: Record<string, string> = {
    PURCHASE_RECEIPT: t("inventory.control.purchase"),
    MANUAL_ENTRY: t("inventory.control.generalEntry"),
    INVENTORY_ADJUSTMENT: t("inventory.control.adjustment"),
    TRANSFER_IN: t("inventory.control.transferIn"),
    TRANSFER_OUT: t("inventory.control.transferOut"),
  };
  return typeMap[type] || type;
}

function buildColumns({
  t,
}: Pick<InventoryMovementsTableProps, "t">): ColumnDef<InventoryMovement>[] {
  return [
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("inventory.control.date")}</SortableHeader>
      ),
      accessorFn: (row) => row.createdAt ?? "",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      id: "type",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("inventory.control.type")}</SortableHeader>
      ),
      accessorFn: (row) => row.type ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{getMovementTypeLabel(row.original.type, t)}</span>
      ),
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return row.original.type === filterValue;
      },
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
      id: "location",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("inventory.control.location")}</SortableHeader>
      ),
      accessorFn: (row) => `${row.warehouse?.code ?? ""} ${row.warehouse?.name ?? ""}`,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate text-sm">{row.original.warehouse.code}</div>
          <div className="text-muted-foreground truncate text-xs">{row.original.warehouse.name}</div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "quantity",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("inventory.control.quantity")}</SortableHeader>
      ),
      accessorFn: (row) => row.quantity ?? 0,
      cell: ({ row }) => {
        const qty = row.original.quantity;
        const isPositive = qty > 0;
        return (
          <div className={`text-right font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {isPositive ? "+" : ""}{qty}
          </div>
        );
      },
      sortingFn: "alphanumeric",
    },
  ];
}

export function InventoryMovementsTable({
  movements,
  t,
  embedded = false,
  action,
}: InventoryMovementsTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [typeValue, setTypeValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t }),
    [t]
  );

  const movementTypes = React.useMemo(() => {
    const unique = new Set<string>();
    movements.forEach((movement) => {
      if (movement.type) unique.add(movement.type);
    });
    return Array.from(unique).sort();
  }, [movements]);

  const table = useReactTable({
    data: movements ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;
      return [
        row.original.product?.sku,
        row.original.product?.name,
        row.original.warehouse?.code,
        row.original.warehouse?.name,
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
            placeholder={t("inventory.control.searchMovements")}
            className="sm:max-w-sm"
          />
          <Select
            value={typeValue}
            onValueChange={(value) => {
              if (value === "ALL") {
                table.getColumn("type")?.setFilterValue(undefined);
                setTypeValue("");
                return;
              }
              setTypeValue(value);
              table.getColumn("type")?.setFilterValue(value);
            }}
          >
            <SelectTrigger size="default" className="min-w-40">
              <SelectValue placeholder={t("inventory.control.filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("inventory.control.allTypes")}</SelectItem>
              {movementTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getMovementTypeLabel(type, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">{action}</div>
      </div>

      <DataTable table={table} emptyMessage={t("inventory.control.noMovements")} />

      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}
