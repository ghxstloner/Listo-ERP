"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { useGetBranches } from "@/packages/branch/api";
import { useCurrency } from "@/packages/currency/components/currency-provider";
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
import { useGetProductOrders } from "../api";
import type { ProductOrder } from "../types";
import { ProductHistoryFilterBar } from "./product-history-filter-bar";

function SortableHeader({
  column,
  children,
}: {
  column: Column<ProductOrder, unknown>;
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
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

export function ProductOrdersTab({ productId }: { productId: number }) {
  const t = useTranslation();
  const { formatMoney } = useCurrency();
  const [branches] = useGetBranches();
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    branchId: undefined as number | undefined,
    status: undefined as ProductOrder["status"] | undefined,
  });
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [orders, loading, error] = useGetProductOrders(productId, filters);

  const columns = useMemo<ColumnDef<ProductOrder>[]>(
    () => [
      {
        id: "document",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.document")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.orderNumber ?? `#${row.id}`,
        cell: ({ row }) => row.original.orderNumber ?? `#${row.original.id}`,
        sortingFn: "alphanumeric",
      },
      {
        id: "date",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.date")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => formatDate(row.original.createdAt),
        sortingFn: "datetime",
      },
      {
        id: "status",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.status")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">
            {t(
              `inventory.products.history.statuses.${row.original.status.toLowerCase()}`,
            )}
          </span>
        ),
        sortingFn: "alphanumeric",
      },
      {
        id: "customer",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.customer")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.customer.name,
        cell: ({ row }) => row.original.customer.name,
        sortingFn: "alphanumeric",
      },
      {
        id: "branch",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.branch")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.branch?.name ?? "",
        cell: ({ row }) => row.original.branch?.name ?? "-",
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
        id: "unitPrice",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("inventory.products.history.unitPrice")}
          </SortableHeader>
        ),
        accessorFn: (row) => row.unitPrice,
        cell: ({ row }) => formatMoney(row.original.unitPrice),
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
    data: orders ?? [],
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
        row.original.orderNumber ?? "",
        String(row.original.id),
        row.original.customer.name,
        row.original.seller?.name ?? "",
        row.original.branch?.name ?? "",
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
      branchId: undefined,
      status: undefined,
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
        searchPlaceholder={t("inventory.products.history.searchOrders")}
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
          value={filters.status ?? "ALL"}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              status:
                value === "ALL" ? undefined : (value as ProductOrder["status"]),
            }))
          }
        >
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue placeholder={t("inventory.products.history.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              {t("inventory.products.history.allStatuses")}
            </SelectItem>
            <SelectItem value="PENDING">
              {t("inventory.products.history.statuses.pending")}
            </SelectItem>
            <SelectItem value="PAID">
              {t("inventory.products.history.statuses.paid")}
            </SelectItem>
            <SelectItem value="CANCELLED">
              {t("inventory.products.history.statuses.cancelled")}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.branchId?.toString() ?? "ALL"}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              branchId: value === "ALL" ? undefined : Number(value),
            }))
          }
        >
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue placeholder={t("inventory.products.history.branch")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              {t("inventory.products.history.allBranches")}
            </SelectItem>
            {(branches ?? [])
              .filter((branch) => branch.isActive)
              .map((branch) => (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                  {branch.name}
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
          ["quantity", "unitPrice", "total"].includes(cell.column.id)
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
