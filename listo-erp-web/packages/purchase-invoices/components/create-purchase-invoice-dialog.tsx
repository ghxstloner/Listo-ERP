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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
import { MoneyInput } from "@/packages/currency/components/money-input";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useGetProducts } from "@/packages/product/api";
import { useGetSuppliers } from "@/packages/suppliers/api";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCreatePurchaseInvoice } from "../api";
import type { PurchaseInvoice } from "../types";

type DraftItem = {
  productId: string;
  quantity: string;
  unitCost: string;
  taxRate: string;
};

const emptyItem = (): DraftItem => ({
  productId: "",
  quantity: "1",
  unitCost: "",
  taxRate: "0",
});

interface CreatePurchaseInvoiceDialogProps {
  onCreated?: (invoice: PurchaseInvoice) => void;
}

export function CreatePurchaseInvoiceDialog({
  onCreated,
}: CreatePurchaseInvoiceDialogProps) {
  const { formatMoney, parseMoney } = useCurrency();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [suppliers] = useGetSuppliers();
  const [warehouses] = useGetWarehouses();
  const [productsResponse] = useGetProducts();
  const [createInvoice, isCreating, createError] = useCreatePurchaseInvoice();
  const products = Array.isArray(productsResponse)
    ? productsResponse
    : (productsResponse?.data ?? []);

  const reset = () => {
    setSupplierId("");
    setWarehouseId("");
    setSupplierInvoiceNumber("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setItems([emptyItem()]);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((item) => String(item.id) === productId);
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              unitCost:
                product?.costPrice != null
                  ? formatMoney(product.costPrice)
                  : "",
              taxRate: product?.isExempt
                ? "0"
                : String((product?.taxRate ?? 0) * 100),
            }
          : item,
      ),
    );
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const submit = () => {
    const parsedItems = items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
      unitCost: parseMoney(item.unitCost),
      taxRate: Number(item.taxRate) / 100,
    }));
    const productIds = parsedItems.map((item) => item.productId);
    if (
      !supplierId ||
      !warehouseId ||
      !supplierInvoiceNumber.trim() ||
      !issueDate
    ) {
      showToast({
        type: "error",
        message: "Completa proveedor, almacén, número y fecha de factura.",
      });
      return;
    }
    if (
      parsedItems.some(
        (item) =>
          !item.productId ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.unitCost) ||
          item.unitCost <= 0 ||
          !Number.isFinite(item.taxRate) ||
          item.taxRate < 0 ||
          item.taxRate > 1,
      )
    ) {
      showToast({
        type: "error",
        message:
          "Completa cada producto con cantidad, costo e impuesto válidos.",
      });
      return;
    }
    if (new Set(productIds).size !== productIds.length) {
      showToast({
        type: "error",
        message: "No puedes agregar el mismo producto más de una vez.",
      });
      return;
    }

    createInvoice(
      {
        supplierId: Number(supplierId),
        warehouseId: Number(warehouseId),
        supplierInvoiceNumber: supplierInvoiceNumber.trim(),
        issueDate,
        items: parsedItems,
      },
      (response) => {
        queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        onCreated?.(response.data);
        close();
        showToast({
          type: "success",
          message: "Factura registrada e inventario actualizado.",
        });
      },
    );
  };

  const total = items.reduce((sum, item) => {
    const subtotal = (Number(item.quantity) || 0) * parseMoney(item.unitCost);
    const tax = subtotal * ((Number(item.taxRate) || 0) / 100);
    return sum + subtotal + tax;
  }, 0);
  const selectedProducts = new Set(
    items.map((item) => item.productId).filter(Boolean),
  );

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nueva factura
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle>Nueva factura de proveedor</DialogTitle>
            <DialogDescription>
              Registra la factura y sus productos. Al guardar, las cantidades
              ingresarán al inventario.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-6 px-5">
            <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="supplier-invoice-supplier">
                  Proveedor
                </FieldLabel>
                <Select
                  value={supplierId}
                  onValueChange={setSupplierId}
                  disabled={isCreating}
                >
                  <SelectTrigger
                    id="supplier-invoice-supplier"
                    className="w-full"
                  >
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(suppliers ?? [])
                      .filter((supplier) => supplier.isActive)
                      .map((supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={String(supplier.id)}
                        >
                          {supplier.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="supplier-invoice-warehouse">
                  Almacén
                </FieldLabel>
                <Select
                  value={warehouseId}
                  onValueChange={setWarehouseId}
                  disabled={isCreating}
                >
                  <SelectTrigger
                    id="supplier-invoice-warehouse"
                    className="w-full"
                  >
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {(warehouses ?? [])
                      .filter((warehouse) => warehouse.isActive)
                      .map((warehouse) => (
                        <SelectItem
                          key={warehouse.id}
                          value={String(warehouse.id)}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="supplier-invoice-number">
                  No. factura proveedor
                </FieldLabel>
                <Input
                  id="supplier-invoice-number"
                  value={supplierInvoiceNumber}
                  onChange={(event) =>
                    setSupplierInvoiceNumber(event.target.value)
                  }
                  disabled={isCreating}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="supplier-invoice-date">Fecha</FieldLabel>
                <Input
                  id="supplier-invoice-date"
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  disabled={isCreating}
                />
              </Field>
            </FieldGroup>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium">Productos</h3>
                  <FieldDescription>
                    El costo y el impuesto se guardan como parte de la factura.
                  </FieldDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setItems((current) => [...current, emptyItem()])
                  }
                  disabled={isCreating}
                >
                  <Plus className="size-4" /> Añadir producto
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_100px_140px_100px_36px] sm:items-end"
                  >
                    <Field>
                      <FieldLabel htmlFor={`supplier-invoice-product-${index}`}>
                        Producto
                      </FieldLabel>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => selectProduct(index, value)}
                        disabled={isCreating}
                      >
                        <SelectTrigger
                          id={`supplier-invoice-product-${index}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products
                            .filter(
                              (product) =>
                                product.isActive &&
                                (!selectedProducts.has(String(product.id)) ||
                                  item.productId === String(product.id)),
                            )
                            .map((product) => (
                              <SelectItem
                                key={product.id}
                                value={String(product.id)}
                              >
                                {product.sku} - {product.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor={`supplier-invoice-quantity-${index}`}
                      >
                        Cantidad
                      </FieldLabel>
                      <Input
                        id={`supplier-invoice-quantity-${index}`}
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        disabled={isCreating}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`supplier-invoice-cost-${index}`}>
                        Costo unitario
                      </FieldLabel>
                      <MoneyInput
                        id={`supplier-invoice-cost-${index}`}
                        value={item.unitCost}
                        onValueChange={(value) =>
                          updateItem(index, "unitCost", value)
                        }
                        disabled={isCreating}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`supplier-invoice-tax-${index}`}>
                        IVA %
                      </FieldLabel>
                      <Input
                        id={`supplier-invoice-tax-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(event) =>
                          updateItem(index, "taxRate", event.target.value)
                        }
                        disabled={isCreating}
                      />
                    </Field>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(index)}
                      disabled={isCreating || items.length === 1}
                      aria-label="Quitar producto"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total estimado</span>
                <span className="ml-4 font-semibold tabular-nums">
                  {formatMoney(total)}
                </span>
              </div>
            </div>
            {createError && (
              <p className="text-sm text-destructive">
                {createError.message || "No fue posible registrar la factura."}
              </p>
            )}
          </div>
          <DialogFooter className="border-t p-5">
            <Button variant="outline" onClick={close} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={isCreating}>
              {isCreating ? "Registrando..." : "Registrar factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
