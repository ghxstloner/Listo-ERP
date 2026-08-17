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
import type { CompanyUserWithUser } from "../types";

type TFunction = (key: string) => string;

interface CompanyUserTableProps {
  users: CompanyUserWithUser[];
  onEdit: (user: CompanyUserWithUser) => void;
  onDelete: (user: CompanyUserWithUser) => void;
  isDeleting: boolean;
  deletingUserId: number | null;
  t: TFunction;
  action?: React.ReactNode;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<CompanyUserWithUser, unknown>;
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

function RolePill({ roles }: { roles: CompanyUserWithUser["roles"] }) {
  if (roles.length === 0) return <span className="text-sm text-muted-foreground">Sin roles</span>;
  return <div className="flex flex-wrap gap-1">{roles.map(({ role }) => <span key={role.id} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{role.name}</span>)}</div>;
}

function StatusPill({ isActive, t }: { isActive: boolean; t: TFunction }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? t("company.users.active") : t("company.users.inactive")}
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
  deletingUserId,
}: Pick<
  CompanyUserTableProps,
  "t" | "onEdit" | "onDelete" | "isDeleting" | "deletingUserId"
>): ColumnDef<CompanyUserWithUser>[] {
  return [
    {
      id: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.users.fullName")}</SortableHeader>
      ),
      accessorFn: (row) => row.user?.name ?? "",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.user.name}</div>
          <div className="text-muted-foreground truncate text-sm">
            {row.original.user.email}
          </div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "email",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.users.email")}</SortableHeader>
      ),
      accessorFn: (row) => row.user?.email ?? "",
      cell: ({ row }) => <span className="text-sm">{row.original.user.email}</span>,
      sortingFn: "alphanumeric",
    },
    {
      id: "role",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.users.role")}</SortableHeader>
      ),
      accessorFn: (row) => row.roles.map(({ role }) => role.name).join(", "),
      cell: ({ row }) => <RolePill roles={row.original.roles} />,
    },
    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.users.status")}</SortableHeader>
      ),
      accessorFn: (row) => (row.user?.isActive ? "ACTIVE" : "INACTIVE"),
      cell: ({ row }) => <StatusPill isActive={row.original.user.isActive} t={t} />,
      filterFn: (row, _id, filterValue) => {
        if (!filterValue || filterValue === "ALL") return true;
        const isActive = row.original.user.isActive;
        return filterValue === "ACTIVE" ? isActive : !isActive;
      },
    },
    {
      id: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.users.createdAt")}</SortableHeader>
      ),
      accessorFn: (row) => row.user?.createdAt ?? "",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm">
          {formatDate(row.original.user.createdAt)}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("company.users.actions")}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">{t("company.users.actions")}</span>
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
                disabled={isDeleting && deletingUserId === row.original.id}
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

export function CompanyUserTable({
  users,
  onEdit,
  onDelete,
  isDeleting,
  deletingUserId,
  t,
  action,
}: CompanyUserTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t, onEdit, onDelete, isDeleting, deletingUserId }),
    [t, onEdit, onDelete, isDeleting, deletingUserId]
  );
  // eslint-disable-next-line
  const table = useReactTable({
    data: users ?? [],
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
      const name = row.original.user?.name?.toLowerCase() ?? "";
      const email = row.original.user?.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
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
            placeholder={t("company.users.searchUsers")}
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
                  <SelectValue placeholder={t("company.users.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("company.users.allStatuses")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("company.users.active")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("company.users.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {action}
        </div>
      </div>

      <DataTable table={table} emptyMessage={t("company.users.noUsers")} />

      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}

