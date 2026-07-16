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
import type { CompanyRole } from "@/packages/company/types";
import { DotsThreeVertical, Pencil, Trash } from "@phosphor-icons/react";
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

interface CompanyRoleTableProps {
  roles: CompanyRole[];
  onEdit: (role: CompanyRole) => void;
  onDelete: (role: CompanyRole) => void;
  isDeleting: boolean;
  deletingRoleId: number | null;
  action?: React.ReactNode;
}

function SortableHeader({ column, children }: { column: Column<CompanyRole, unknown>; children: React.ReactNode }) {
  return <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 size-4" /></Button>;
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{isActive ? "Activo" : "Inactivo"}</span>;
}

function buildColumns({ onEdit, onDelete, isDeleting, deletingRoleId }: Pick<CompanyRoleTableProps, "onEdit" | "onDelete" | "isDeleting" | "deletingRoleId">): ColumnDef<CompanyRole>[] {
  return [
    {
      id: "name",
      header: ({ column }) => <SortableHeader column={column}>Rol</SortableHeader>,
      accessorFn: (role) => role.name,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      sortingFn: "alphanumeric",
    },
    {
      id: "description",
      header: ({ column }) => <SortableHeader column={column}>Descripción</SortableHeader>,
      accessorFn: (role) => role.description ?? "",
      cell: ({ row }) => <span className="block max-w-[320px] truncate text-sm text-muted-foreground">{row.original.description || "Sin descripción"}</span>,
      sortingFn: "alphanumeric",
    },
    {
      id: "permissions",
      header: ({ column }) => <SortableHeader column={column}>Permisos</SortableHeader>,
      accessorFn: (role) => role.permissions.length,
      cell: ({ row }) => <span className="text-sm">{row.original.permissions.length} permisos</span>,
      sortingFn: "basic",
    },
    {
      id: "status",
      header: ({ column }) => <SortableHeader column={column}>Estado</SortableHeader>,
      accessorFn: (role) => (role.isActive ? "ACTIVE" : "INACTIVE"),
      cell: ({ row }) => <StatusPill isActive={row.original.isActive} />,
      filterFn: (row, _id, filterValue) => !filterValue || filterValue === "ALL" || (filterValue === "ACTIVE" ? row.original.isActive : !row.original.isActive),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => <div className="flex justify-end"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="size-8 p-0"><span className="sr-only">Acciones</span><DotsThreeVertical className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive focus:text-destructive" disabled={isDeleting && deletingRoleId === row.original.id}><Trash className="mr-2 size-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function CompanyRoleTable({ roles, onEdit, onDelete, isDeleting, deletingRoleId, action }: CompanyRoleTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusValue, setStatusValue] = React.useState("");
  const columns = React.useMemo(() => buildColumns({ onEdit, onDelete, isDeleting, deletingRoleId }), [onEdit, onDelete, isDeleting, deletingRoleId]);
  // eslint-disable-next-line
  const table = useReactTable({
    data: roles,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().toLowerCase();
      return !query || row.original.name.toLowerCase().includes(query) || (row.original.description ?? "").toLowerCase().includes(query);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Buscar roles..." className="sm:max-w-sm" />
        <Select value={statusValue} onValueChange={(value) => { setStatusValue(value === "ALL" ? "" : value); table.getColumn("status")?.setFilterValue(value === "ALL" ? undefined : value); }}>
          <SelectTrigger className="min-w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">Todos los estados</SelectItem><SelectItem value="ACTIVE">Activo</SelectItem><SelectItem value="INACTIVE">Inactivo</SelectItem></SelectContent>
        </Select>
      </div>
      {action}
    </div>
    <div className="rounded-lg border"><Table><TableHeader className="bg-muted/40">{table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center">No hay roles configurados.</TableCell></TableRow>}</TableBody></Table></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Página {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button></div></div>
  </div>;
}
