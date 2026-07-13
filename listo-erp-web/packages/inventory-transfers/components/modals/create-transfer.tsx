"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import { useGetBranches } from "@/packages/branch/api";
import { useGetProducts } from "@/packages/product/api";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { useGetWarehouseInventoryBalances } from "@/packages/inventory/api";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCreateInventoryTransfer } from "../../api";

export function CreateTransfer() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [createTransfer, isCreating, error] = useCreateInventoryTransfer();
  const [warehouses] = useGetWarehouses();
  const [branches] = useGetBranches();
  const [productsResponse] = useGetProducts();
  const [balances] = useGetWarehouseInventoryBalances(Number(warehouseId) || 0);
  const products = Array.isArray(productsResponse)
    ? productsResponse
    : (productsResponse?.data ?? []);
  const selectedBalance = balances?.find(
    (balance) => balance.productId === Number(productId),
  );
  const availableQuantity = selectedBalance?.quantity ?? 0;

  const close = () => {
    setOpen(false);
    setWarehouseId("");
    setBranchId("");
    setProductId("");
    setQuantity("");
  };
  const create = () => {
    const amount = Number(quantity);
    if (
      !warehouseId ||
      !branchId ||
      !productId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > availableQuantity
    ) {
      showToast({
        type: "error",
        message:
          "Verifique los datos y que la cantidad no supere la existencia disponible.",
      });
      return;
    }
    createTransfer(
      {
        sourceWarehouseId: Number(warehouseId),
        destinationBranchId: Number(branchId),
        items: [{ productId: Number(productId), quantity: amount }],
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
        close();
        showToast({
          type: "success",
          message: "Transferencia creada exitosamente.",
        });
      },
    );
  };
  useEffect(() => {
    if (error) showToast({ type: "error", message: error.message });
  }, [error]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva transferencia
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
      >
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Nueva transferencia</DialogTitle>
            <DialogDescription>
              Despacha mercancía desde un almacén hacia una sucursal.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 p-4 py-0 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Almacén origen</Label>
              <Select
                value={warehouseId}
                onValueChange={setWarehouseId}
                disabled={isCreating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    ?.filter((warehouse) => warehouse.isActive)
                    .map((warehouse) => (
                      <SelectItem
                        key={warehouse.id}
                        value={String(warehouse.id)}
                      >
                        {warehouse.name} ({warehouse.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sucursal destino</Label>
              <Select
                value={branchId}
                onValueChange={setBranchId}
                disabled={isCreating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    ?.filter((branch) => branch.isActive)
                    .map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select
                value={productId}
                onValueChange={setProductId}
                disabled={isCreating || !warehouseId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter(
                      (product) =>
                        product.isActive &&
                        balances?.some(
                          (balance) =>
                            balance.productId === product.id &&
                            balance.quantity > 0,
                        ),
                    )
                    .map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.sku} - {product.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-quantity">Cantidad</Label>
              <Input
                id="transfer-quantity"
                type="number"
                min="0.0001"
                max={availableQuantity || undefined}
                step="0.0001"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={isCreating}
              />
              {productId ? (
                <p className="text-muted-foreground text-sm">
                  Disponible en almacén:{" "}
                  <span className="font-medium text-foreground">
                    {availableQuantity} {selectedBalance?.product.unit ?? ""}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button variant="outline" onClick={close} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={create} disabled={isCreating}>
              {isCreating ? "Creando..." : "Crear transferencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
