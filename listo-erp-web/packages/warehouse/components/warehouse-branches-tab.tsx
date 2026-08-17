"use client";

import { DataTable, DataTablePagination } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { useGetWarehouseBranchesByWarehouse } from "@/packages/warehouse-branch/api";
import type { WarehouseBranchWithBranch } from "@/packages/warehouse-branch/types";
import { type Column, type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

function SortableHeader({ column, children }: { column: Column<WarehouseBranchWithBranch, unknown>; children: React.ReactNode }) {
  return <button type="button" className="inline-flex h-8 items-center rounded-md px-2 text-sm font-medium hover:bg-muted" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></button>;
}

export function WarehouseBranchesTab({ warehouseId }: { warehouseId: number }) {
  const [branches, loading, error] = useGetWarehouseBranchesByWarehouse(warehouseId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo<ColumnDef<WarehouseBranchWithBranch>[]>(() => [
    { id: "name", accessorFn: (row) => row.branch.name, header: ({ column }) => <SortableHeader column={column}>Sucursal</SortableHeader>, cell: ({ row }) => <span className="font-medium">{row.original.branch.name}</span> },
    { id: "code", accessorFn: (row) => row.branch.branchCode, header: ({ column }) => <SortableHeader column={column}>Código</SortableHeader>, cell: ({ row }) => row.original.branch.branchCode },
    { id: "status", accessorFn: (row) => (row.branch.isActive ? "ACTIVE" : "INACTIVE"), header: ({ column }) => <SortableHeader column={column}>Estado</SortableHeader>, cell: ({ row }) => row.original.branch.isActive ? "Activo" : "Inactivo" },
  ], []);
  const table = useReactTable({ data: branches ?? [], columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });
  return <Card><CardContent className="p-0">
    <DataTable table={table} loading={loading} loadingMessage="Cargando sucursales..." error={error ? <>No se pudieron cargar las sucursales: {error.message}</> : undefined} emptyMessage="No hay sucursales asignadas." />
    <DataTablePagination table={table} pageLabel="Página" previousLabel="Anterior" nextLabel="Siguiente" className="p-4" />
  </CardContent></Card>;
}
