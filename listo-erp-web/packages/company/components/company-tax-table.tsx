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
import type { Tax } from "@/packages/company/types";
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

interface CompanyTaxTableProps {
  taxes: Tax[];
  onEdit: (tax: Tax) => void;
  onDelete: (tax: Tax) => void;
  isDeleting?: boolean;
  deletingTaxId?: number | null;
  action?: React.ReactNode;
  loading?: boolean;
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<Tax, unknown>;
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

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}

function buildColumns({
  onEdit,
  onDelete,
  isDeleting,
  deletingTaxId,
}: Pick<
  CompanyTaxTableProps,
  "onEdit" | "onDelete" | "isDeleting" | "deletingTaxId"
>): ColumnDef<Tax>[] {
  return [
    {
      id: "name",
      header: ({ column }) => <SortableHeader column={column}>Nombre</SortableHeader>,
      accessorFn: (tax) => tax.name,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      sortingFn: "alphanumeric",
    },
    {
      id: "rate",
      header: ({ column }) => <SortableHeader column={column}>Tasa (%)</SortableHeader>,
      accessorFn: (tax) => tax.rate,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {(Number(row.original.rate) > 1 ? Number(row.original.rate) : Number(row.original.rate) * 100).toFixed(2)}%
        </span>
      ),
      sortingFn: "basic",
    },
    {
      id: "status",
      header: ({ column }) => <SortableHeader column={column}>Estado</SortableHeader>,
      accessorFn: (tax) => (tax.isActive ? "ACTIVE" : "INACTIVE"),
      cell: ({ row }) => <StatusPill isActive={row.original.isActive} />,
      filterFn: (row, _id, filterValue) =>
        !filterValue ||
        filterValue === "ALL" ||
        (filterValue === "ACTIVE" ? row.original.isActive : !row.original.isActive),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0">
                <span className="sr-only">Acciones</span>
                <DotsThreeVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(row.original)}
                className="text-destructive focus:text-destructive"
                disabled={isDeleting && deletingTaxId === row.original.id}
              >
                <Trash className="mr-2 size-4" />
                Eliminar
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

export function CompanyTaxTable({
  taxes,
  onEdit,
  onDelete,
  isDeleting,
  deletingTaxId,
  action,
  loading,
}: CompanyTaxTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState("ALL");

  const columns = React.useMemo(
    () => buildColumns({ onEdit, onDelete, isDeleting, deletingTaxId }),
    [onEdit, onDelete, isDeleting, deletingTaxId],
  );

  const table = useReactTable({
    data: taxes,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleStatusChange = (value: string) => {
    setStatusValue(value);
    table.getColumn("status")?.setFilterValue(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar impuestos..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:max-w-xs"
          />
          <Select value={statusValue} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="INACTIVE">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <DataTable
        table={table}
        loading={loading}
        emptyMessage="No se encontraron impuestos."
      />

      <DataTablePagination
        table={table}
        pageLabel="Página"
        previousLabel="Anterior"
        nextLabel="Siguiente"
      />
    </div>
  );
}
