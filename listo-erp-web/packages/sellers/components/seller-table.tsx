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
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { Seller } from "../types";

type TFunction = (key: string) => string;

interface SellerTableProps {
  sellers: Seller[];
  onEdit: (seller: Seller) => void;
  onDelete: (seller: Seller) => void;
  isDeleting: boolean;
  deletingSellerId: number | null;
  t: TFunction;
  action?: React.ReactNode;
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
      {isActive ? t("sales.sellers.active") : t("sales.sellers.inactive")}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<Seller, unknown>;
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
  onEdit,
  onDelete,
  isDeleting,
  deletingSellerId,
}: Pick<
  SellerTableProps,
  "t" | "onEdit" | "onDelete" | "isDeleting" | "deletingSellerId"
>): ColumnDef<Seller>[] {
  return [
    {
      id: "code",
      accessorKey: "code",
      header: ({ column }) => <SortableHeader column={column}>{t("sales.sellers.code")}</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>{t("sales.sellers.name")}</SortableHeader>,
      cell: ({ row }) => <div className="truncate font-medium">{row.original.name}</div>,
    },
    {
      id: "status",
      accessorFn: (row) => (row.isActive ? "ACTIVE" : "INACTIVE"),
      header: ({ column }) => <SortableHeader column={column}>{t("sales.sellers.status")}</SortableHeader>,
      cell: ({ row }) => <StatusPill isActive={row.original.isActive} t={t} />,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>{t("sales.sellers.createdAt")}</SortableHeader>,
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("sales.sellers.actions")}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">{t("sales.sellers.actions")}</span>
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
                disabled={isDeleting && deletingSellerId === row.original.id}
              >
                <Trash className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
    },
  ];
}

export function SellerTable({
  sellers,
  onEdit,
  onDelete,
  isDeleting,
  deletingSellerId,
  t,
  action,
}: SellerTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredSellers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sellers.filter((seller) => {
      if (status === "ACTIVE" && !seller.isActive) return false;
      if (status === "INACTIVE" && seller.isActive) return false;
      if (!q) return true;
      return [
        seller.code,
        seller.name,
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [sellers, search, status]);

  const columns = useMemo(
    () => buildColumns({ t, onEdit, onDelete, isDeleting, deletingSellerId }),
    [t, onEdit, onDelete, isDeleting, deletingSellerId],
  );
  const table = useReactTable({
    data: filteredSellers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("sales.sellers.searchSellers")}
            className="sm:max-w-sm"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger size="default" className="min-w-40">
              <SelectValue placeholder={t("sales.sellers.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("sales.sellers.allStatuses")}
              </SelectItem>
              <SelectItem value="ACTIVE">
                {t("sales.sellers.active")}
              </SelectItem>
              <SelectItem value="INACTIVE">
                {t("sales.sellers.inactive")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {action}
        </div>
      </div>

      <DataTable table={table} emptyMessage={t("sales.sellers.noSellers")} />
      <DataTablePagination table={table} pageLabel={t("common.page")} previousLabel={t("common.previous")} nextLabel={t("common.next")} />
    </div>
  );
}
