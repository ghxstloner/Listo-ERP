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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import { useGetProducts } from "@/packages/product/api";
import { useGetSuppliers } from "@/packages/suppliers/api";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCreatePurchaseOrder } from "../api";

type DraftItem = { productId: string; quantity: string; unitCost: string };

const emptyItem = (): DraftItem => ({ productId: "", quantity: "1", unitCost: "" });

function formatAmount(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CreatePurchaseOrderDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [suppliers] = useGetSuppliers();
  const [warehouses] = useGetWarehouses();
  const [productsResponse] = useGetProducts();
  const [createPurchaseOrder, isCreating, createError] = useCreatePurchaseOrder();
  const products = Array.isArray(productsResponse) ? productsResponse : productsResponse?.data ?? [];

  const reset = () => {
    setSupplierId("");
    setWarehouseId("");
    setItems([emptyItem()]);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = () => {
    const parsedItems = items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
    }));
    const productIds = parsedItems.map((item) => item.productId);

    if (!supplierId || !warehouseId) {
      showToast({ type: "error", message: "Selecciona un proveedor y un almacén." });
      return;
    }
    if (parsedItems.some((item) => !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitCost) || item.unitCost < 0)) {
      showToast({ type: "error", message: "Completa cada producto con una cantidad y un costo válidos." });
      return;
    }
    if (new Set(productIds).size !== productIds.length) {
      showToast({ type: "error", message: "No puedes agregar el mismo producto más de una vez." });
      return;
    }

    createPurchaseOrder(
      { supplierId: Number(supplierId), warehouseId: Number(warehouseId), items: parsedItems },
      () => {
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        close();
        showToast({ type: "success", message: "Orden de compra creada correctamente." });
      }
    );
  };

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0);
  const selectedProducts = new Set(items.map((item) => item.productId).filter(Boolean));

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nueva orden
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle>Nueva orden de compra</DialogTitle>
            <DialogDescription>
              Selecciona el proveedor, el almacén de destino y los productos a solicitar.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-6 px-5">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="purchase-supplier">Proveedor</FieldLabel>
                <Select value={supplierId} onValueChange={setSupplierId} disabled={isCreating}>
                  <SelectTrigger id="purchase-supplier" className="w-full"><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                  <SelectContent>
                    {suppliers?.filter((supplier) => supplier.isActive).map((supplier) => <SelectItem key={supplier.id} value={String(supplier.id)}>{supplier.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="purchase-warehouse">Almacén de destino</FieldLabel>
                <Select value={warehouseId} onValueChange={setWarehouseId} disabled={isCreating}>
                  <SelectTrigger id="purchase-warehouse" className="w-full"><SelectValue placeholder="Seleccionar almacén" /></SelectTrigger>
                  <SelectContent>
                    {warehouses?.filter((warehouse) => warehouse.isActive).map((warehouse) => <SelectItem key={warehouse.id} value={String(warehouse.id)}>{warehouse.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium">Productos</h3>
                  <FieldDescription>Los productos deben estar asociados al proveedor seleccionado.</FieldDescription>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setItems((current) => [...current, emptyItem()])} disabled={isCreating}>
                  <Plus className="size-4" /> Añadir producto
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_110px_130px_36px] sm:items-end">
                    <Field>
                      <FieldLabel htmlFor={`purchase-product-${index}`}>Producto</FieldLabel>
                      <Select value={item.productId} onValueChange={(value) => updateItem(index, "productId", value)} disabled={isCreating}>
                        <SelectTrigger id={`purchase-product-${index}`} className="w-full"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                        <SelectContent>
                          {products.filter((product) => product.isActive && (!selectedProducts.has(String(product.id)) || item.productId === String(product.id))).map((product) => <SelectItem key={product.id} value={String(product.id)}>{product.sku} - {product.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`purchase-quantity-${index}`}>Cantidad</FieldLabel>
                      <Input id={`purchase-quantity-${index}`} type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} disabled={isCreating} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`purchase-cost-${index}`}>Costo unitario</FieldLabel>
                      <Input id={`purchase-cost-${index}`} type="number" min="0" step="0.0001" placeholder="0.00" value={item.unitCost} onChange={(event) => updateItem(index, "unitCost", event.target.value)} disabled={isCreating} />
                    </Field>
                    <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(index)} disabled={isCreating || items.length === 1} aria-label="Quitar producto">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total estimado</span>
                <span className="ml-4 font-semibold tabular-nums">{formatAmount(total)}</span>
              </div>
            </div>
            {createError && <p className="text-sm text-destructive">{(createError as Error).message || "No fue posible crear la orden."}</p>}
          </div>
          <DialogFooter className="border-t p-5">
            <Button variant="outline" onClick={close} disabled={isCreating}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isCreating}>{isCreating ? "Creando..." : "Crear orden"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
