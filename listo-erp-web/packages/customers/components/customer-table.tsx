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
import { DotsThreeVertical, Pencil, Trash } from "@phosphor-icons/react";
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
import type { Customer } from "../types";

type TFunction = (key: string) => string;

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  isDeleting: boolean;
  deletingCustomerId: number | null;
  t: TFunction;
  action?: React.ReactNode;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<Customer, unknown>;
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

function StatusPill({ isActive, t }: { isActive: boolean; t: TFunction }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-muted text-muted-foreground"
        }`}
    >
      {isActive ? t("sales.customers.active") : t("sales.customers.inactive")}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function buildColumns({
  t,
  onEdit,
  onDelete,
  isDeleting,
  deletingCustomerId,
}: Pick<
  CustomerTableProps,
  "t" | "onEdit" | "onDelete" | "isDeleting" | "deletingCustomerId"
>): ColumnDef<Customer>[] {
  return [
    {
      id: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.customers.name")}</SortableHeader>
      ),
      accessorFn: (row) => row.name ?? "",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="text-muted-foreground truncate text-sm">
            {row.original.isFinalConsumer
              ? "Consumidor Final"
              : [row.original.taxDocumentType, row.original.taxId].filter(Boolean).join(" ") || "-"}
          </div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "contact",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.customers.contact")}</SortableHeader>
      ),
      accessorFn: (row) => row.contactName ?? "",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate text-sm">{row.original.contactName || "-"}</div>
          <div className="text-muted-foreground truncate text-xs">
            {row.original.email || "-"}
          </div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "phone",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.customers.phone")}</SortableHeader>
      ),
      accessorFn: (row) => row.phone ?? "",
      cell: ({ row }) => <span className="text-sm">{row.original.phone || "-"}</span>,
      sortingFn: "alphanumeric",
    },
    {
      id: "address",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.customers.address")}</SortableHeader>
      ),
      accessorFn: (row) => row.address ?? "",
      cell: ({ row }) => (
        <span className="text-sm max-w-[200px] truncate block">
          {row.original.address || "-"}
        </span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.customers.status")}</SortableHeader>
      ),
      accessorFn: (row) => (row.isActive ? "ACTIVE" : "INACTIVE"),
      cell: ({ row }) => <StatusPill isActive={row.original.isActive} t={t} />,
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        return filterValue === "ACTIVE" ? row.original.isActive : !row.original.isActive;
      },
    },
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("sales.customers.createdAt")}</SortableHeader>
      ),
      accessorFn: (row) => row.createdAt ?? "",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("sales.customers.actions")}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">{t("sales.customers.actions")}</span>
                <DotsThreeVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original)}
                className="text-destructive focus:text-destructive"
                disabled={isDeleting && deletingCustomerId === row.original.id}
              >
                <Trash className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  isDeleting,
  deletingCustomerId,
  t,
  action,
}: CustomerTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t, onEdit, onDelete, isDeleting, deletingCustomerId }),
    [t, onEdit, onDelete, isDeleting, deletingCustomerId]
  );

  const table = useReactTable({
    data: customers ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;
      return [
        row.original.name,
        row.original.taxDocumentType,
        row.original.taxId,
        row.original.address,
        row.original.phone,
        row.original.email,
        row.original.contactName,
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
            placeholder={t("sales.customers.searchCustomers")}
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
              <SelectValue placeholder={t("sales.customers.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("sales.customers.allStatuses")}</SelectItem>
              <SelectItem value="ACTIVE">{t("sales.customers.active")}</SelectItem>
              <SelectItem value="INACTIVE">{t("sales.customers.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">{action}</div>
      </div>

      <DataTable table={table} emptyMessage={t("sales.customers.noCustomers")} />

      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}
