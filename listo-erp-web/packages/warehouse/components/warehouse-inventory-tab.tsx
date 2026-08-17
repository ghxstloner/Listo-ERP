"use client";

import { DataTable, DataTablePagination } from "@/components/data-table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetWarehouseInventoryBalances } from "@/packages/inventory/api";
import type { InventoryBalance } from "@/packages/inventory/types";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { type Column, type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

function SortableHeader({ column, children }: { column: Column<InventoryBalance, unknown>; children: React.ReactNode }) {
  return <ButtonHeader onClick={() => column.toggleSorting()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></ButtonHeader>;
}

function ButtonHeader({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return <button type="button" className="inline-flex h-8 items-center rounded-md px-2 text-sm font-medium hover:bg-muted" onClick={onClick}>{children}</button>;
}

export function WarehouseInventoryTab({ warehouseId }: { warehouseId: number }) {
  const [search, setSearch] = useState("");
  const [balances, loading, error] = useGetWarehouseInventoryBalances(warehouseId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const rows = useMemo(() => (balances ?? []).filter((balance) => `${balance.product.sku} ${balance.product.name}`.toLowerCase().includes(search.toLowerCase())), [balances, search]);
  const columns = useMemo<ColumnDef<InventoryBalance>[]>(() => [
    { id: "sku", accessorFn: (row) => row.product.sku, header: ({ column }) => <SortableHeader column={column}>SKU</SortableHeader>, cell: ({ row }) => <span className="font-medium">{row.original.product.sku}</span> },
    { id: "product", accessorFn: (row) => row.product.name, header: ({ column }) => <SortableHeader column={column}>Producto</SortableHeader>, cell: ({ row }) => row.original.product.name },
    { id: "unit", accessorFn: (row) => row.product.unit ?? "", header: ({ column }) => <SortableHeader column={column}>Unidad</SortableHeader>, cell: ({ row }) => row.original.product.unit ?? "-" },
    { id: "quantity", accessorKey: "quantity", header: ({ column }) => <div className="text-right"><SortableHeader column={column}>Existencia</SortableHeader></div>, cell: ({ row }) => <div className="text-right font-medium">{row.original.quantity}</div> },
    { id: "updatedAt", accessorKey: "updatedAt", header: ({ column }) => <SortableHeader column={column}>Actualizado</SortableHeader>, cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.updatedAt).toLocaleString()}</span>, sortingFn: "datetime" },
  ], []);
  const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });
  return <div className="space-y-4">
    <div className="relative max-w-sm"><MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por SKU o producto" /></div>
    <Card>
      <DataTable table={table} loading={loading} loadingMessage="Cargando inventario..." error={error ? <>No se pudo cargar el inventario: {error.message}</> : undefined} emptyMessage="El almacén no tiene existencias." />
      <DataTablePagination table={table} pageLabel="Página" previousLabel="Anterior" nextLabel="Siguiente" />
    </Card>
  </div>;
}
