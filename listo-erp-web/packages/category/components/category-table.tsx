"use client";

import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DotsThreeVertical, Pencil, Trash, CaretRight } from "@phosphor-icons/react";
import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import * as React from "react";
import type { Category } from "../types";

type TFunction = (key: string) => string;

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onViewChildren: (category: Category) => void;
  isDeleting: boolean;
  deletingCategoryId: number | null;
  t: TFunction;
  action?: React.ReactNode;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<Category, unknown>;
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? t("company.categories.active") : t("company.categories.inactive")}
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
  onViewChildren,
  isDeleting,
  deletingCategoryId,
}: Pick<
  CategoryTableProps,
  "t" | "onEdit" | "onDelete" | "onViewChildren" | "isDeleting" | "deletingCategoryId"
>): ColumnDef<Category>[] {
  return [
    {
      id: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.categories.name")}</SortableHeader>
      ),
      accessorFn: (row) => row.name ?? "",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="text-muted-foreground truncate text-sm">
            {row.original.code}
          </div>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      id: "subdepartment",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.categories.subdepartment")}</SortableHeader>
      ),
      accessorFn: (row) => row.subdepartment?.name ?? "",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.subdepartment?.name || "-"}</span>
      ),
      sortingFn: "alphanumeric",
    },

    {
      id: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>{t("company.categories.status")}</SortableHeader>
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
          {t("company.categories.createdAt")}
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
        <div className="text-right">{t("company.categories.actions")}</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">{t("company.categories.actions")}</span>
                <DotsThreeVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewChildren(row.original)}>
                <CaretRight className="mr-2 h-4 w-4" />
                {t("company.categories.viewSubCategories")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original)}
                className="text-destructive focus:text-destructive"
                disabled={isDeleting && deletingCategoryId === row.original.id}
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

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
  onViewChildren,
  isDeleting,
  deletingCategoryId,
  t,
  action,
}: CategoryTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState<string>("");

  const columns = React.useMemo(
    () => buildColumns({ t, onEdit, onDelete, onViewChildren, isDeleting, deletingCategoryId }),
    [t, onEdit, onDelete, onViewChildren, isDeleting, deletingCategoryId]
  );

  // eslint-disable-next-line
  const table = useReactTable({
    data: categories ?? [],
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
      const code = row.original.code?.toLowerCase() ?? "";
      return (
        name.includes(q) ||
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
            placeholder={t("company.categories.searchCategories")}
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
                  <SelectValue placeholder={t("company.categories.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("company.categories.allStatuses")}
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    {t("company.categories.active")}
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    {t("company.categories.inactive")}
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center"
                >
                  {t("company.categories.noCategories")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          {t("common.page")} {table.getState().pagination.pageIndex + 1} /{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
