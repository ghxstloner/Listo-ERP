"use client";

import { DataTable, DataTablePagination } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { getPaymentMethodImageUrl, useGetPaymentMethods } from "@/packages/payment-methods/api";
import { useUpdateTill } from "@/packages/till/api";
import type { Till } from "@/packages/till/types";
import { useQueryClient } from "@tanstack/react-query";
import { type Column, type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TillPaymentMethodsProps { till: Till; }

function SortableHeader({ column, children }: { column: Column<NonNullable<ReturnType<typeof useGetPaymentMethods>[0]>[number], unknown>; children: React.ReactNode }) {
  return <span className="inline-flex items-center"><button type="button" className="inline-flex h-8 items-center rounded-md px-2 text-sm font-medium hover:bg-muted" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></button></span>;
}

export function TillPaymentMethods({ till }: TillPaymentMethodsProps) {
  const queryClient = useQueryClient();
  const [paymentMethods, isLoading, error] = useGetPaymentMethods();
  const [selectedIds, setSelectedIds] = useState(() => (till.paymentMethods ?? []).map(({ paymentMethod }) => paymentMethod.id));
  const [updateTill, isUpdating, updateError] = useUpdateTill(till.id);
  const [sorting, setSorting] = useState<SortingState>([]);
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["tills"] }); queryClient.invalidateQueries({ queryKey: ["tills", till.id] }); };
  const toggleMethod = (id: number) => {
    const nextSelectedIds = selectedIds.includes(id) ? selectedIds.filter((currentId) => currentId !== id) : [...selectedIds, id];
    updateTill({ paymentMethodIds: nextSelectedIds }, () => { setSelectedIds(nextSelectedIds); invalidate(); showToast({ type: "success", message: "Métodos de pago actualizados." }); });
  };
  useEffect(() => { if (updateError) showToast({ type: "error", message: updateError.message }); }, [updateError]);
  type PaymentMethodRow = NonNullable<typeof paymentMethods>[number];
  const columns = useMemo<ColumnDef<PaymentMethodRow>[]>(() => [
    { id: "image", accessorFn: (row) => row.image ?? "", header: ({ column }) => <SortableHeader column={column}>Imagen</SortableHeader>, cell: ({ row }) => row.original.image ? <img src={getPaymentMethodImageUrl(row.original.image)} alt="" className="h-9 w-9 rounded object-contain" /> : <div className="flex h-9 w-9 items-center justify-center rounded bg-muted text-xs font-semibold">{row.original.code.slice(0, 2)}</div> },
    { id: "name", accessorKey: "name", header: ({ column }) => <SortableHeader column={column}>Método de pago</SortableHeader>, cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { id: "code", accessorKey: "code", header: ({ column }) => <SortableHeader column={column}>Código</SortableHeader>, cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span> },
    { id: "status", accessorFn: (row) => (row.isActive ? "ACTIVE" : "INACTIVE"), header: ({ column }) => <SortableHeader column={column}>Estado global</SortableHeader>, cell: ({ row }) => row.original.isActive ? "Activo" : "Inactivo" },
    { id: "enabled", header: () => "En esta caja", cell: ({ row }) => <Switch checked={selectedIds.includes(row.original.id)} onCheckedChange={() => toggleMethod(row.original.id)} disabled={isUpdating} aria-label={`${selectedIds.includes(row.original.id) ? "Desactivar" : "Activar"} ${row.original.name} para esta caja`} />, enableSorting: false },
  ], [isUpdating, selectedIds, toggleMethod]);
  const table = useReactTable({ data: paymentMethods ?? [], columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });
  return <Card>
    <CardHeader><CardTitle>Métodos de pago</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-muted-foreground text-sm">Activa los métodos de pago disponibles para esta caja.</p>
      <DataTable table={table} loading={isLoading} loadingMessage="Cargando métodos de pago..." error={error?.message} emptyMessage="No hay métodos de pago configurados." />
      <DataTablePagination table={table} pageLabel="Página" previousLabel="Anterior" nextLabel="Siguiente" />
    </CardContent>
  </Card>;
}
