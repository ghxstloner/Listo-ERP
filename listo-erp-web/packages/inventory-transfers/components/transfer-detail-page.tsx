"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoading } from "@/components/page-loading";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TicketSelector } from "@/packages/pos/components/ticket-selector";
import { ArrowLeft, Cube, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useGetInventoryTransfer, type TransferStatus } from "../api";
import { TransferCartItem } from "./transfer-cart-item";

function statusClass(status: TransferStatus) {
  return status === "RECEIVED"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "bg-muted text-muted-foreground";
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function TransferDetailPage({ id }: { id: number }) {
  const [transfer, loading, error] = useGetInventoryTransfer(id);

  if (loading)
    return (
      <PageLoading
        text="Cargando transferencia..."
        icon={<Spinner size={32} />}
        spin
      />
    );

  if (error || !transfer)
    return (
      <div className="flex min-h-[400px] items-center justify-center text-destructive">
        No se pudo cargar la transferencia: {error?.message ?? "No encontrada"}
      </div>
    );

  const totalUnits = transfer.items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  const sourceWarehouseItem = {
    id: transfer.sourceWarehouseId,
    name: `${transfer.sourceWarehouse.name} (${transfer.sourceWarehouse.code})`,
  };
  const destinationWarehouseItem = {
    id: transfer.destinationWarehouseId,
    name: `${transfer.destinationWarehouse.name} (${transfer.destinationWarehouse.code})`,
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link
            href="/listoerp/inventory/warehouse-transfers"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a transferencias
          </Link>
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Información de la transferencia
          </CardTitle>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(transfer.status.code)}`}
          >
            {transfer.status.label}
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Nro. comprobante
              </label>
              <Input
                value={transfer.documentNumber ?? `TRF-${transfer.id}`}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Fecha de emisión
              </label>
              <Input
                value={formatDateTime(transfer.createdAt)}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Observaciones
              </label>
              <Input
                value={transfer.notes ?? ""}
                placeholder="Sin observaciones"
                disabled
                className="bg-muted/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2 sm:max-w-sm">
            <div>
              <p className="text-sm font-medium">Controlar stock</p>
              <p className="text-muted-foreground text-xs">
                {transfer.controlStock
                  ? "Validó existencias del almacén origen"
                  : "Se transfirió sin validación"}
              </p>
            </div>
            <Switch
              checked={transfer.controlStock}
              onCheckedChange={() => {}}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Almacén origen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TicketSelector
              label="Origen"
              value={String(transfer.sourceWarehouseId)}
              onChange={() => {}}
              items={[sourceWarehouseItem]}
              disabled
            />

            <div className="min-h-[120px] rounded-md border p-6 text-center">
              <Cube
                className="text-primary mx-auto size-8"
                weight="duotone"
              />
              <p className="text-muted-foreground mt-2 text-sm">
                Se descontaron {totalUnits} unidades del inventario de este
                almacén.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Almacén destino y detalle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TicketSelector
              label="Destino"
              value={String(transfer.destinationWarehouseId)}
              onChange={() => {}}
              items={[destinationWarehouseItem]}
              disabled
            />

            <div className="max-h-[420px] min-h-[120px] divide-y overflow-y-auto rounded-md border">
              {transfer.items.length === 0 ? (
                <p className="text-muted-foreground p-6 text-center text-sm">
                  Esta transferencia no tiene productos.
                </p>
              ) : (
                transfer.items.map((item) => (
                  <TransferCartItem
                    key={item.productId}
                    product={item.product}
                    quantity={Number(item.quantity)}
                    controlStock={transfer.controlStock}
                    disabled
                    readOnly
                  />
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {transfer.items.length}{" "}
                {transfer.items.length === 1 ? "línea" : "líneas"}
              </span>
              <span className="font-semibold">
                Total unidades: {totalUnits}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
