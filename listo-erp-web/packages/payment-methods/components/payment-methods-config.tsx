"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@config";
import { Camera, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { getPaymentMethodImageUrl, uploadPaymentMethodImage, useGetPaymentMethods } from "../api";
import type { PaymentMethod, PaymentMethodRequest, PaymentMethodResponse } from "../types";

const initialForm: PaymentMethodRequest = {
  name: "",
  code: "",
  requiresReference: false,
  isActive: true,
};

export function PaymentMethodsConfig() {
  const queryClient = useQueryClient();
  const [paymentMethods, isLoading, error] = useGetPaymentMethods();
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PaymentMethodRequest>(initialForm);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageMethodId, setImageMethodId] = useState<number | null>(null);

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
      requiresReference: method.requiresReference,
      isActive: method.isActive,
    });
    setDialogOpen(true);
  };
  const submit = () => {
    if (!form.name.trim() || !form.code.trim()) {
      showToast({ type: "error", message: "El nombre y código son obligatorios." });
      return;
    }
    save.mutate({ ...form, name: form.name.trim(), code: form.code.trim().toUpperCase() });
  };
  const selectImage = (id: number) => {
    setImageMethodId(id);
    imageInputRef.current?.click();
  };
  const handleImage = (file: File | undefined) => {
    if (file && imageMethodId) uploadImage.mutate({ id: imageMethodId, file });
  };

  if (isLoading) return <Card><CardContent className="py-8 text-center text-muted-foreground">Cargando métodos de pago...</CardContent></Card>;
  if (error) return <Card><CardContent className="py-8 text-center text-destructive">No se pudieron cargar los métodos: {error.message}</CardContent></Card>;

  return <>
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div><CardTitle>Métodos de pago</CardTitle><CardDescription>Administra los métodos de pago de la empresa y sus imágenes.</CardDescription></div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo método</Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border"><Table>
          <TableHeader className="bg-muted/40"><TableRow><TableHead className="w-16">Imagen</TableHead><TableHead>Nombre</TableHead><TableHead>Código</TableHead><TableHead>Referencia</TableHead><TableHead>Estado</TableHead><TableHead className="w-28 text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>{(paymentMethods ?? []).map((method) => <TableRow key={method.id}>
            <TableCell>{method.image ? <img src={getPaymentMethodImageUrl(method.image)} alt="" className="h-9 w-9 rounded object-contain" /> : <div className="flex h-9 w-9 items-center justify-center rounded bg-muted text-xs font-semibold">{method.code.slice(0, 2)}</div>}</TableCell>
            <TableCell className="font-medium">{method.name}</TableCell><TableCell className="font-mono text-xs">{method.code}</TableCell><TableCell>{method.requiresReference ? "Sí" : "No"}</TableCell>
            <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${method.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{method.isActive ? "Activo" : "Inactivo"}</span></TableCell>
            <TableCell><div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => selectImage(method.id)} aria-label={`Cambiar imagen de ${method.name}`}><Camera className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => openEdit(method)} aria-label={`Editar ${method.name}`}><PencilSimple className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={remove.isPending} onClick={() => { if (window.confirm(`¿Eliminar ${method.name}?`)) remove.mutate(method.id); }} aria-label={`Eliminar ${method.name}`}><Trash className="h-4 w-4" /></Button></div></TableCell>
          </TableRow>)}{paymentMethods?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No hay métodos de pago configurados.</TableCell></TableRow>}</TableBody>
        </Table></div>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(event) => handleImage(event.target.files?.[0])} />
      </CardContent>
    </Card>
    <Dialog open={isDialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(initialForm); } }}>
      <DialogContent><DialogHeader><DialogTitle>{editing ? "Editar método de pago" : "Nuevo método de pago"}</DialogTitle></DialogHeader>
        <div className="space-y-4"><div className="space-y-2"><Label htmlFor="payment-method-name">Nombre</Label><Input id="payment-method-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="payment-method-code">Código</Label><Input id="payment-method-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></div><div className="flex items-center justify-between rounded-lg border p-3"><span>Requiere referencia</span><Switch checked={form.requiresReference} onCheckedChange={(requiresReference) => setForm({ ...form, requiresReference })} /></div><div className="flex items-center justify-between rounded-lg border p-3"><span>Activo</span><Switch checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(initialForm); }}>Cancelar</Button><Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Guardando..." : "Guardar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
