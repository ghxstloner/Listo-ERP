"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/use-confirm";
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
import { showToast } from "@/components/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DotsThreeVertical, MagnifyingGlass } from "@phosphor-icons/react";
import { Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCancelPurchaseOrder, useReceivePurchaseOrder } from "../api";
import type { PurchaseOrder } from "../types";

const statusLabels: Record<PurchaseOrder["status"], string> = { PENDING: "Pendiente", RECEIVED: "Recibida", CANCELLED: "Cancelada" };
const statusClasses: Record<PurchaseOrder["status"], string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  RECEIVED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function OrderActions({ order }: { order: PurchaseOrder }) {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState<"receive" | "cancel" | null>(null);
  const [receive, isReceiving] = useReceivePurchaseOrder(order.id);
  const [cancel, isCancelling] = useCancelPurchaseOrder(order.id);
  const isMutating = isReceiving || isCancelling;

  const complete = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    setConfirmation(null);
    showToast({ type: "success", message });
  };

  if (order.status !== "PENDING") return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Acciones para orden ${order.id}`} disabled={isMutating}>
            <DotsThreeVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setConfirmation("receive")}><Check className="size-4" /> Recibir orden</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmation("cancel")}><X className="size-4" /> Cancelar orden</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
        onConfirm={() => confirmation === "receive" ? receive(undefined, () => complete("Orden recibida e ingresada al inventario.")) : cancel(undefined, () => complete("Orden de compra cancelada."))}
        title={confirmation === "receive" ? "¿Recibir esta orden?" : "¿Cancelar esta orden?"}
        description={confirmation === "receive" ? "Se actualizará el inventario con las cantidades recibidas. Esta acción no se puede deshacer." : "La orden dejará de estar disponible para recepción. Esta acción no se puede deshacer."}
        confirmText={confirmation === "receive" ? "Recibir orden" : "Cancelar orden"}
        severity={confirmation === "cancel" ? "destructive" : "warning"}
        isLoading={isMutating}
      />
    </>
  );
}

export function PurchaseOrdersTable({ orders, isLoading }: { orders: PurchaseOrder[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = status === "ALL" || order.status === status;
    const matchesSearch = !normalizedSearch || [String(order.id), order.supplier.name, order.warehouse.name].some((value) => value.toLowerCase().includes(normalizedSearch));
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número, proveedor o almacén" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="RECEIVED">Recibidas</SelectItem>
            <SelectItem value="CANCELLED">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Orden</TableHead><TableHead>Proveedor</TableHead><TableHead>Almacén</TableHead><TableHead>Productos</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead className="w-12 pr-4"><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Cargando órdenes de compra...</TableCell></TableRow>}
          {!isLoading && filteredOrders.length === 0 && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">{orders.length === 0 ? "Aún no hay órdenes de compra." : "No hay órdenes que coincidan con los filtros."}</TableCell></TableRow>}
          {!isLoading && filteredOrders.map((order) => {
            const total = order.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
            const totalQuantity = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
            return <TableRow key={order.id}>
              <TableCell className="pl-4 font-medium">#{order.id}</TableCell>
              <TableCell>{order.supplier.name}</TableCell><TableCell>{order.warehouse.name}</TableCell>
              <TableCell><span className="font-medium">{totalQuantity}</span> <span className="text-muted-foreground">unidades</span><span className="ml-2 hidden text-muted-foreground lg:inline">{formatMoney(total)}</span></TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses[order.status]}`}>{statusLabels[order.status]}</span></TableCell>
              <TableCell className="pr-4"><OrderActions order={order} /></TableCell>
            </TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
  );
}
