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
import { useTranslation } from "@/hooks/use-translation";
import { useGetProducts } from "@/packages/product/api";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  type InventoryEntryType,
  useCreateInventoryEntry,
  useGetWarehouseInventoryBalances,
} from "../api";

type DraftItem = { productId: string; quantity: string };

const emptyItem = (): DraftItem => ({ productId: "", quantity: "1" });

export function CreateInventoryEntryDialog() {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InventoryEntryType>("ENTRY");
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [warehouses] = useGetWarehouses();
  const [productsResponse] = useGetProducts();
  const [balances] = useGetWarehouseInventoryBalances(Number(warehouseId) || 0);
  const [createEntry, isCreating, createError] = useCreateInventoryEntry();
  const products = Array.isArray(productsResponse)
    ? productsResponse
    : (productsResponse?.data ?? []);
  const selectedProducts = new Set(
    items.map((item) => item.productId).filter(Boolean),
  );

  useEffect(() => {
    if (createError) {
      showToast({
        type: "error",
        message:
          createError.message || t("inventory.control.unableToRegisterError"),
      });
    }
  }, [createError]);

  const close = () => {
    setOpen(false);
    setType("ENTRY");
    setWarehouseId("");
    setItems([emptyItem()]);
  };
  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
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
    }));
    const productIds = parsedItems.map((item) => item.productId);
    if (!warehouseId) {
      showToast({
        type: "error",
        message: t("inventory.control.selectWarehouseError"),
      });
      return;
    }
    if (
      parsedItems.some(
        (item) =>
          !item.productId ||
          !Number.isFinite(item.quantity) ||
          item.quantity === 0 ||
          (type === "ENTRY" && item.quantity < 0),
      )
    ) {
      showToast({
        type: "error",
        message:
          type === "ENTRY"
            ? t("inventory.control.invalidEntryError")
            : t("inventory.control.invalidAdjustmentError"),
      });
      return;
    }
    if (new Set(productIds).size !== productIds.length) {
      showToast({
        type: "error",
        message: t("inventory.control.duplicateProductError"),
      });
      return;
    }
    createEntry(
      { warehouseId: Number(warehouseId), type, items: parsedItems },
      () => {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        close();
        showToast({
          type: "success",
          message:
            type === "ENTRY"
              ? t("inventory.control.entrySuccess")
              : t("inventory.control.adjustmentSuccess"),
        });
      },
    );
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> {t("inventory.control.registerEntry")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle>{t("inventory.control.entryDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("inventory.control.entryDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-6 px-5">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("inventory.control.movementType")}</FieldLabel>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setType(value as InventoryEntryType)
                  }
                  disabled={isCreating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRY">
                      {t("inventory.control.generalEntry")}
                    </SelectItem>
                    <SelectItem value="ADJUSTMENT">
                      {t("inventory.control.adjustment")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>{t("inventory.control.warehouse")}</FieldLabel>
                <Select
                  value={warehouseId}
                  onValueChange={setWarehouseId}
                  disabled={isCreating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("inventory.control.selectWarehouse")}
                    />
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
              </Field>
            </FieldGroup>
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium">
                    {t("inventory.control.products")}
                  </h3>
                  <FieldDescription>
                    {type === "ENTRY"
                      ? t("inventory.control.entryDescription")
                      : t("inventory.control.adjustmentDescription")}
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
                  <Plus className="size-4" />{" "}
                  {t("inventory.control.addProduct")}
                </Button>
              </div>
              {items.map((item, index) => {
                const balance = balances?.find(
                  (entry) => entry.productId === Number(item.productId),
                );
                return (
                  <div
                    key={index}
                    className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_140px_36px] sm:items-start"
                  >
                    <Field>
                      <FieldLabel htmlFor={`inventory-product-${index}`}>
                        {t("inventory.control.product")}
                      </FieldLabel>
                      <Select
                        value={item.productId}
                        onValueChange={(value) =>
                          updateItem(index, "productId", value)
                        }
                        disabled={isCreating}
                      >
                        <SelectTrigger
                          id={`inventory-product-${index}`}
                          className="w-full"
                        >
                          <SelectValue
                            placeholder={t("inventory.control.selectProduct")}
                          />
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
                      {type === "ADJUSTMENT" && item.productId ? (
                        <FieldDescription>
                          {t("inventory.control.currentStock")}:{" "}
                          {balance?.quantity ?? 0} {balance?.product.unit ?? ""}
                        </FieldDescription>
                      ) : null}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`inventory-quantity-${index}`}>
                        {t("inventory.control.quantity")}
                      </FieldLabel>
                      <Input
                        id={`inventory-quantity-${index}`}
                        type="number"
                        min={type === "ENTRY" ? "0.0001" : undefined}
                        step="0.0001"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        disabled={isCreating}
                      />
                    </Field>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground sm:mt-6 hover:text-destructive"
                      onClick={() => removeItem(index)}
                      disabled={isCreating || items.length === 1}
                      aria-label="Quitar producto"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="border-t p-5">
            <Button variant="outline" onClick={close} disabled={isCreating}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={isCreating}>
              {isCreating
                ? t("inventory.control.registering")
                : t("inventory.control.register")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
