"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showToast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DotsThreeVertical } from "@phosphor-icons/react";
import {
  useDispatchTransfer,
  useReceiveTransfer,
  type InventoryTransfer,
  type TransferStatus,
} from "../api";

function statusClass(status: TransferStatus) {
  return status === "RECEIVED"
    ? "bg-emerald-500/10 text-emerald-700"
    : status === "IN_TRANSIT"
      ? "bg-amber-500/10 text-amber-700"
      : "bg-muted text-muted-foreground";
}
function TransferAction({ transfer }: { transfer: InventoryTransfer }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [dispatch, dispatching] = useDispatchTransfer(transfer.id);
  const [receive, receiving] = useReceiveTransfer(transfer.id);
  const receivingMode = transfer.status.code === "IN_TRANSIT";
  const execute = () => {
    const mutation = receivingMode ? receive : dispatch;
    mutation(undefined, () => {
      qc.invalidateQueries({ queryKey: ["inventory-transfers"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setConfirm(false);
      showToast({
        type: "success",
        message: receivingMode
          ? "Transferencia recibida en el almacén destino."
          : "Transferencia despachada.",
      });
    });
  };
  if (
    transfer.status.code !== "PENDING" &&
    transfer.status.code !== "IN_TRANSIT"
  )
    return null;
  const loading = dispatching || receiving;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            disabled={loading}
          >
            <DotsThreeVertical className="size-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setConfirm(true)}>
            {receivingMode ? "Recibir" : "Despachar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={execute}
        title={
          receivingMode
            ? "¿Recibir transferencia?"
            : "¿Despachar transferencia?"
        }
        description={
          receivingMode
            ? "La mercancía se agregará al inventario del almacén destino."
            : "La mercancía se descontará del inventario del almacén."
        }
        confirmText={receivingMode ? "Recibir" : "Despachar"}
        cancelText="Cancelar"
        isLoading={loading}
      />
    </>
  );
}
export function TransferTable({
  transfers,
}: {
  transfers: InventoryTransfer[];
}) {
  if (transfers.length === 0)
    return (
      <Card>
        <CardContent className="flex min-h-[180px] items-center justify-center py-10 text-muted-foreground">
          No hay transferencias registradas.
        </CardContent>
      </Card>
    );
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Almacén origen</TableHead>
            <TableHead>Almacén destino</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((transfer) => (
            <TableRow key={transfer.id}>
              <TableCell className="font-medium">
                {transfer.sourceWarehouse.name}
                <div className="text-muted-foreground text-xs">
                  {transfer.sourceWarehouse.code}
                </div>
              </TableCell>
              <TableCell>
                {transfer.destinationWarehouse.name}
                <div className="text-muted-foreground text-xs">
                  {transfer.destinationWarehouse.code}
                </div>
              </TableCell>
              <TableCell>
                {transfer.items
                  .map((item) => `${item.product.sku} x${item.quantity}`)
                  .join(", ")}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(transfer.status.code)}`}
                >
                  {transfer.status.label}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <TransferAction transfer={transfer} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
