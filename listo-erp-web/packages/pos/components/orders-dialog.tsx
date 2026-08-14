"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGetBranches } from "@/packages/branch/api";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useGetOrders } from "@/packages/orders/api";
import type { OrderListItem } from "@/packages/orders/types";
import { CaretDown, Check, Spinner } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface OrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBranchId?: number;
  onSelectOrder: (orderId: number) => void;
}

export function OrdersDialog({
  open,
  onOpenChange,
  defaultBranchId,
  onSelectOrder,
}: OrdersDialogProps) {
  const { formatMoney } = useCurrency();
  const [branchIds, setBranchIds] = useState<number[] | null>(null);
  const [branchesInitialized, setBranchesInitialized] = useState(false);
  const [branches] = useGetBranches();
  const [orders, loading] = useGetOrders({
    status: "PENDING",
    branchIds: branchIds ?? undefined,
  });

  useEffect(() => {
    if (open && !branchesInitialized && defaultBranchId) {
      setBranchIds([defaultBranchId]);
      setBranchesInitialized(true);
    }
  }, [branchesInitialized, defaultBranchId, open]);

  const toggleBranch = (branchId: number) => {
    setBranchIds((current) =>
      (current ?? []).includes(branchId)
        ? (current ?? []).filter((id) => id !== branchId)
        : [...(current ?? []), branchId],
    );
  };

  const activeBranches = (branches ?? []).filter((branch) => branch.isActive);
  const selectedBranchesLabel =
    branchIds === null
      ? "Todas las sucursales"
      : branchIds.length === 0
        ? "Sin sucursales"
        : branchIds.length === 1
          ? activeBranches.find((branch) => branch.id === branchIds[0])?.name ?? "1 sucursal"
          : `${branchIds.length} sucursales seleccionadas`;

  const selectOrder = (order: OrderListItem) => {
    onSelectOrder(order.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pedidos pendientes</DialogTitle>
          <DialogDescription>
            Selecciona un pedido para cargar sus productos, cliente y vendedor al ticket.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Sucursales</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between font-normal">
                <span className="truncate">{selectedBranchesLabel}</span>
                <CaretDown className="size-4 shrink-0 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar sucursal..." />
                <CommandList>
                  <CommandEmpty>No se encontraron sucursales.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="todas las sucursales" onSelect={() => setBranchIds(null)}>
                      <Check className={`mr-2 size-4 ${branchIds === null ? "opacity-100" : "opacity-0"}`} />
                      Todas las sucursales
                    </CommandItem>
                    {activeBranches.map((branch) => (
                      <CommandItem key={branch.id} value={branch.name} onSelect={() => toggleBranch(branch.id)}>
                        <Check className={`mr-2 size-4 ${branchIds?.includes(branch.id) ? "opacity-100" : "opacity-0"}`} />
                        {branch.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto rounded-md border">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center text-muted-foreground">
              <Spinner className="mr-2 size-4 animate-spin" /> Cargando pedidos...
            </div>
          ) : orders?.length ? (
            <div className="divide-y">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  onClick={() => selectOrder(order)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Pedido #{order.id}</span>
                    <span className="font-semibold">{formatMoney(order.total)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customer?.name ?? "Sin cliente"} · {order.seller?.name ?? "Sin vendedor"} · {order.branch?.name ?? "Sin sucursal"}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.itemsCount} artículos</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay pedidos pendientes para las sucursales seleccionadas.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
