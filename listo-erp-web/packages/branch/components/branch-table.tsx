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
import type { Branch } from "../types";

type TFunction = (key: string) => string;

interface BranchTableProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  isDeleting: boolean;
  deletingBranchId: number | null;
  t: TFunction;
  action?: React.ReactNode;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<Branch, unknown>;
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
      {isActive ? t("company.branches.active") : t("company.branches.inactive")}
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
  deletingBranchId,
}: Pick<
  BranchTableProps,
  "t" | "onEdit" | "onDelete" | "isDeleting" | "deletingBranchId"
>): ColumnDef<Branch>[] {
  return [
    {
      id: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.branches.name")}</SortableHeader>
      ),
      accessorFn: (row) => row.name ?? "",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="text-muted-foreground truncate text-sm">
            {row.original.branchCode}
          </div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "address",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.branches.address")}</SortableHeader>
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
      id: "phone",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.branches.phone")}</SortableHeader>
      ),
      accessorFn: (row) => row.phone ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone || "-"}</span>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.branches.status")}</SortableHeader>
      ),
      accessorFn: (row) => (row.isActive ? "ACTIVE" : "INACTIVE"),
      cell: ({ row }) => (
        <StatusPill isActive={row.original.isActive} t={t} />
      ),
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        const isActive = row.original.isActive;
        return filterValue === "ACTIVE" ? isActive : !isActive;
      },
    },
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>
          {t("company.branches.createdAt")}
        </SortableHeader>
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
      header: () => (
        <div className="text-right">{t("company.branches.actions")}</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">{t("company.branches.actions")}</span>
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
                disabled={isDeleting && deletingBranchId === row.original.id}
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

export function BranchTable({
  branches,
  onEdit,
  onDelete,
  isDeleting,
  deletingBranchId,
  t,
  action,
}: BranchTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t, onEdit, onDelete, isDeleting, deletingBranchId }),
    [t, onEdit, onDelete, isDeleting, deletingBranchId]
  );

  // eslint-disable-next-line
  const table = useReactTable({
    data: branches ?? [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase();
      if (!q) return true;
      const name = row.original.name?.toLowerCase() ?? "";
      const address = row.original.address?.toLowerCase() ?? "";
      const phone = row.original.phone?.toLowerCase() ?? "";
      const code = row.original.branchCode?.toLowerCase() ?? "";
      return (
        name.includes(q) ||
        address.includes(q) ||
        phone.includes(q) ||
        code.includes(q)
      );
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
            placeholder={t("company.branches.searchBranches")}
            className="sm:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
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
                  <SelectValue placeholder={t("company.branches.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("company.branches.allStatuses")}
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    {t("company.branches.active")}
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    {t("company.branches.inactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {action}
        </div>
      </div>

      <DataTable table={table} emptyMessage={t("company.branches.noBranches")} />

      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}
