"use client";

import { Button } from "@/components/ui/button";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { api } from "@config";
import { Camera, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { type Column, type ColumnDef, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { getPaymentMethodImageUrl, uploadPaymentMethodImage, useGetPaymentMethods } from "../api";
import type { PaymentMethod, PaymentMethodRequest, PaymentMethodResponse } from "../types";

const initialForm: PaymentMethodRequest = {
  name: "",
  code: "",
  dianCode: "",
  isActive: true,
};

function SortableHeader({ column, children }: { column: Column<PaymentMethod, unknown>; children: React.ReactNode }) {
  return <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={column.getToggleSortingHandler()}>{children}<ArrowUpDown className="ml-2 h-4 w-4" /></Button>;
}

export function PaymentMethodsConfig() {
  const queryClient = useQueryClient();
  const [paymentMethods, isLoading, error] = useGetPaymentMethods();
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PaymentMethodRequest>(initialForm);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageMethodId, setImageMethodId] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
  const save = useMutation({
    mutationFn: (request: PaymentMethodRequest) =>
      editing
        ? api.patch<PaymentMethodResponse>(`payment-methods/${editing.id}`, { body: request })
        : api.post<PaymentMethodResponse>("payment-methods", { body: request }),
    onSuccess: (response) => {
      invalidate();
      setEditing(null);
      setForm(initialForm);
      setDialogOpen(false);
      showToast({ type: "success", message: response.message });
    },
    onError: (mutationError) => showToast({ type: "error", message: mutationError.message }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete<{ message: string }>(`payment-methods/${id}`),
    onSuccess: (response) => {
      invalidate();
      showToast({ type: "success", message: response.message });
    },
    onError: (mutationError) => showToast({ type: "error", message: mutationError.message }),
  });
  const uploadImage = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadPaymentMethodImage(id, file),
    onSuccess: () => {
      invalidate();
      showToast({ type: "success", message: "Imagen actualizada." });
    },
    onError: (mutationError) => showToast({ type: "error", message: mutationError.message }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setDialogOpen(true);
  };
  const openEdit = (method: PaymentMethod) => {
    setEditing(method);
    setForm({
      name: method.name,
      code: method.code,
      dianCode: method.dianCode ?? "",
      isActive: method.isActive,
    });
    setDialogOpen(true);
  };
  const submit = () => {
    if (!form.name.trim() || !form.code.trim()) {
      showToast({ type: "error", message: "El nombre y código son obligatorios." });
      return;
    }
    save.mutate({ ...form, name: form.name.trim(), code: form.code.trim().toUpperCase(), dianCode: form.dianCode?.trim().toUpperCase() || null });
  };
  const selectImage = (id: number) => {
    setImageMethodId(id);
    imageInputRef.current?.click();
  };
  const handleImage = (file: File | undefined) => {
    if (file && imageMethodId) uploadImage.mutate({ id: imageMethodId, file });
  };

  const columns = useMemo<ColumnDef<PaymentMethod>[]>(() => [
    { id: "image", accessorFn: (row) => row.image ?? "", header: ({ column }) => <SortableHeader column={column}>Imagen</SortableHeader>, cell: ({ row }) => row.original.image ? <img src={getPaymentMethodImageUrl(row.original.image)} alt="" className="h-9 w-9 rounded object-contain" /> : <div className="flex h-9 w-9 items-center justify-center rounded bg-muted text-xs font-semibold">{row.original.code.slice(0, 2)}</div> },
    { id: "name", accessorKey: "name", header: ({ column }) => <SortableHeader column={column}>Nombre</SortableHeader>, cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { id: "code", accessorKey: "code", header: ({ column }) => <SortableHeader column={column}>Código interno</SortableHeader>, cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span> },
    { id: "dianCode", accessorFn: (row) => row.dianCode ?? "", header: ({ column }) => <SortableHeader column={column}>Código DIAN</SortableHeader>, cell: ({ row }) => <span className="font-mono text-xs">{row.original.dianCode ?? "-"}</span> },
    { id: "status", accessorFn: (row) => (row.isActive ? "ACTIVE" : "INACTIVE"), header: ({ column }) => <SortableHeader column={column}>Estado</SortableHeader>, cell: ({ row }) => <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.original.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{row.original.isActive ? "Activo" : "Inactivo"}</span> },
    { id: "actions", header: () => <div className="text-right">Acciones</div>, cell: ({ row }) => <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => selectImage(row.original.id)} aria-label={`Cambiar imagen de ${row.original.name}`}><Camera className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => openEdit(row.original)} aria-label={`Editar ${row.original.name}`}><PencilSimple className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={remove.isPending} onClick={() => { if (window.confirm(`¿Eliminar ${row.original.name}?`)) remove.mutate(row.original.id); }} aria-label={`Eliminar ${row.original.name}`}><Trash className="h-4 w-4" /></Button></div>, enableSorting: false },
  ], [getPaymentMethodImageUrl, remove.isPending, editing]);
  const table = useReactTable({ data: paymentMethods ?? [], columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } } });

  return <>
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div><CardTitle>Métodos de pago</CardTitle><CardDescription>Administra los métodos de pago de la empresa y sus imágenes.</CardDescription></div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo método</Button>
      </CardHeader>
      <CardContent>
        <DataTable table={table} loading={isLoading} loadingMessage="Cargando métodos de pago..." error={error ? <>No se pudieron cargar los métodos: {error.message}</> : undefined} emptyMessage="No hay métodos de pago configurados." />
        <DataTablePagination table={table} pageLabel="Página" previousLabel="Anterior" nextLabel="Siguiente" />
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(event) => handleImage(event.target.files?.[0])} />
      </CardContent>
    </Card>
    <Dialog open={isDialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(initialForm); } }}>
      <DialogContent><DialogHeader><DialogTitle>{editing ? "Editar método de pago" : "Nuevo método de pago"}</DialogTitle></DialogHeader>
        <div className="space-y-4"><div className="space-y-2"><Label htmlFor="payment-method-name">Nombre</Label><Input id="payment-method-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="payment-method-code">Código interno</Label><Input id="payment-method-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></div><div className="space-y-2"><Label htmlFor="payment-method-dian-code">Código DIAN</Label><Input id="payment-method-dian-code" value={form.dianCode ?? ""} onChange={(event) => setForm({ ...form, dianCode: event.target.value.toUpperCase() })} placeholder="10" /><p className="text-xs text-muted-foreground">Se utiliza para facturación electrónica en Colombia.</p></div><div className="flex items-center justify-between rounded-lg border p-3"><span>Activo</span><Switch checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(initialForm); }}>Cancelar</Button><Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Guardando..." : "Guardar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
