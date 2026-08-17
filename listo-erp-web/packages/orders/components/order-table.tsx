"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
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
import { DotsThreeVertical, Eye, XCircle } from "@phosphor-icons/react";
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
import * as React from "react";
import type { OrderListItem, OrderStatus } from "../types";

type TFunction = (key: string) => string;

interface OrderTableProps {
  orders: OrderListItem[];
  onView: (order: OrderListItem) => void;
  onCancel: (order: OrderListItem) => void;
  isCancelling: boolean;
  cancellingOrderId: number | null;
  t: TFunction;
  action?: React.ReactNode;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<OrderListItem, unknown>;
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

function StatusPill({ status, t }: { status: OrderStatus; t: TFunction }) {
  const statusClass = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  };

  const statusLabel = {
    PENDING: t("sales.orders.statusLabels.pending"),
    PAID: t("sales.orders.statusLabels.paid"),
    CANCELLED: t("sales.orders.statusLabels.cancelled"),
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function buildColumns({
  t,
  onView,
  onCancel,
  isCancelling,
  cancellingOrderId,
  formatMoney,
}: Pick<
  OrderTableProps,
  "t" | "onView" | "onCancel" | "isCancelling" | "cancellingOrderId"
> & {
  formatMoney: (value: number | string | null | undefined) => string;
}): ColumnDef<OrderListItem>[] {
  return [
    {
      id: "orderNumber",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.orderNumber")}</SortableHeader>
      ),
      accessorFn: (row) => row.orderNumber ?? `#${row.id}`,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">
            {row.original.orderNumber ?? `#${row.original.id}`}
          </div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.date")}</SortableHeader>
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
      id: "customer",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.customer")}</SortableHeader>
      ),
      accessorFn: (row) => row.customer?.name ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.customer.name}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "seller",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.seller")}</SortableHeader>
      ),
      accessorFn: (row) => row.seller?.name ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.seller.name}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "branch",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.branch")}</SortableHeader>
      ),
      accessorFn: (row) => row.branch?.name ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.branch.name}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "itemsCount",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.items")}</SortableHeader>
      ),
      accessorFn: (row) => row.itemsCount ?? 0,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.itemsCount}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "total",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.total")}</SortableHeader>
      ),
      accessorFn: (row) => row.total ?? 0,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{formatMoney(row.original.total)}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.orders.status")}</SortableHeader>
      ),
      accessorFn: (row) => row.status ?? "",
      cell: ({ row }) => (
        <StatusPill status={row.original.status} t={t} />
      ),
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return row.original.status === filterValue;
      },
      sortingFn: "alphanumeric",
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("sales.orders.actions")}</div>,
      cell: ({ row }) => {
        const order = row.original;
        const canCancel = order.status === "PENDING";

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("sales.orders.actions")}</span>
                  <DotsThreeVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(order)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("sales.orders.view")}
                </DropdownMenuItem>
                {canCancel && (
                  <DropdownMenuItem
                    onClick={() => onCancel(order)}
                    className="text-destructive focus:text-destructive"
                    disabled={isCancelling && cancellingOrderId === order.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t("sales.orders.cancel")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function OrderTable({
  orders,
  onView,
  onCancel,
  isCancelling,
  cancellingOrderId,
  t,
  action,
}: OrderTableProps) {
  const { formatMoney } = useCurrency();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t, onView, onCancel, isCancelling, cancellingOrderId, formatMoney }),
    [t, onView, onCancel, isCancelling, cancellingOrderId, formatMoney]
  );

  const table = useReactTable({
    data: orders ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;
      return [
        row.original.orderNumber,
        `#${row.original.id}`,
        row.original.customer?.name,
        row.original.seller?.name,
        row.original.branch?.name,
      ].some((value) => value?.toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t("sales.orders.searchPlaceholder")}
            className="sm:max-w-sm"
          />
          <Select
            value={statusValue}
            onValueChange={(value) => {
              if (value === "ALL") {
                table.getColumn("status")?.setFilterValue(undefined);
                setStatusValue("");
                return;
              }
              setStatusValue(value);
              table.getColumn("status")?.setFilterValue(value);
            }}
          >
            <SelectTrigger size="default" className="min-w-40">
              <SelectValue placeholder={t("sales.orders.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("sales.orders.allStatuses")}</SelectItem>
              <SelectItem value="PENDING">{t("sales.orders.statusLabels.pending")}</SelectItem>
              <SelectItem value="PAID">{t("sales.orders.statusLabels.paid")}</SelectItem>
              <SelectItem value="CANCELLED">{t("sales.orders.statusLabels.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">{action}</div>
      </div>

      <DataTable table={table} emptyMessage={t("sales.orders.noOrders")} />

      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}
