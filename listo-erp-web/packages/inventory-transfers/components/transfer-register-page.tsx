"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/components/ui/sonner";
import { TicketSelector } from "@/packages/pos/components/ticket-selector";
import { useGetProducts } from "@/packages/product/api";
import type { Product } from "@/packages/product/types";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { useGetWarehouseInventoryBalances } from "@/packages/inventory/api";
import { useGetActiveSeries } from "@/packages/series/api";
import { formatSeriesNumber } from "@/packages/series/constants";
import { useCreateInventoryTransfer } from "../api";
import { TransferCartItem } from "./transfer-cart-item";
import { getProductImageUrl } from "@/packages/product/api";
import {
  ArrowLeft,
  Cube,
  MagnifyingGlass,
  Plus,
  Spinner,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";import { useEffect, useMemo, useState } from "react";

interface TransferCartItem {
  product: Product;
  quantity: number;
}

export function TransferRegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [sourceWarehouseId, setSourceWarehouseId] = useState<
    number | undefined
  >();
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<
    number | undefined
  >();
  const [controlStock, setControlStock] = useState(true);
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<TransferCartItem[]>([]);
  const [search, setSearch] = useState("");

  const [warehouses] = useGetWarehouses();
  const [activeSeries] = useGetActiveSeries("INVENTORY_TRANSFERS");
  const [productsResponse, productsLoading] = useGetProducts({
    productType: "PRODUCT",
  });
  const [balancesResponse] = useGetWarehouseInventoryBalances(
    sourceWarehouseId ?? 0,
  );
  const [createTransfer, creating, createError] = useCreateInventoryTransfer();

  const warehouseOptions =
    warehouses?.filter((warehouse) => warehouse.isActive) ?? [];
  const productList = (
    Array.isArray(productsResponse)
      ? productsResponse
      : (productsResponse?.data ?? [])
  ).filter((product) => product.isActive);

  const stockByProduct = useMemo(() => {
    const map = new Map<number, number>();
    for (const balance of balancesResponse ?? []) {
      map.set(balance.productId, Number(balance.quantity));
    }
    return map;
  }, [balancesResponse]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productList.filter((product) => {
      if ((stockByProduct.get(product.id) ?? 0) <= 0) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.barcode ?? "").toLowerCase().includes(q) ||
        (product.reference ?? "").toLowerCase().includes(q)
      );
    });
  }, [productList, stockByProduct, search]);

  const nextTransferNumber = activeSeries
    ? formatSeriesNumber(activeSeries.format, activeSeries.consecutive)
    : null;

  const issueDate = useMemo(
    () =>
      new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (createError) showToast({ type: "error", message: createError.message });
  }, [createError]);

  const selectSourceWarehouse = (value: string) => {
    setSourceWarehouseId(value ? Number(value) : undefined);
    setSearch("");
    setCart([]);
  };

  const addProduct = (product: Product) => {
    if (!sourceWarehouseId) {
      showToast({ type: "error", message: "Seleccione un almacén de origen." });
      return;
    }
    const availableStock = stockByProduct.get(product.id) ?? 0;
    const currentItem = cart.find((line) => line.product.id === product.id);
    if ((currentItem?.quantity ?? 0) + 1 > availableStock) {
      showToast({
        type: "warning",
        message: `Stock insuficiente para ${product.name}. Disponible: ${availableStock}`,
      });
      return;
    }
    setCart((current) =>
      currentItem
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...current, { product, quantity: 1 }],
    );
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    if (quantity <= 0) {
      setCart((current) =>
        current.filter((line) => line.product.id !== productId),
      );
      return;
    }
    let nextQuantity = quantity;
    if (controlStock) {
      const availableStock = stockByProduct.get(productId) ?? 0;
      if (quantity > availableStock) {
        showToast({
          type: "warning",
          message: `Solo hay ${availableStock} unidades disponibles.`,
        });
        nextQuantity = availableStock;
      }
    }
    setCart((current) =>
      current.map((line) =>
        line.product.id === productId ? { ...line, quantity: nextQuantity } : line,
      ),
    );
  };

  const handleSubmit = () => {
    if (!sourceWarehouseId || !destinationWarehouseId) {
      showToast({
        type: "error",
        message: "Seleccione el almacén de origen y el de destino.",
      });
      return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      showToast({
        type: "error",
        message: "El origen y el destino deben ser diferentes.",
      });
      return;
    }
    if (!activeSeries) {
      showToast({
        type: "error",
        message:
          "No hay una serie activa para transferencias. Configúrela en Series y Numeraciones.",
      });
      return;
    }
    if (cart.length === 0) {
      showToast({
        type: "error",
        message: "Agregue al menos un producto a la transferencia.",
      });
      return;
    }

    createTransfer(
      {
        sourceWarehouseId,
        destinationWarehouseId,
        controlStock,
        notes: notes.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["series"] });
        showToast({
          type: "success",
          message: "Transferencia registrada exitosamente.",
        });
        router.push("/listoerp/inventory/warehouse-transfers");
      },
    );
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Información de la transferencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Nro. comprobante
              </label>
              <Input
                value={nextTransferNumber ?? "Sin serie activa"}
                disabled
                className="bg-muted/50"
              />
              {!activeSeries && (
                <p className="text-xs text-amber-600">
                  Configure una serie en Series y Numeraciones.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Fecha de emisión
              </label>
              <Input value={issueDate} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Observaciones
              </label>
              <Input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Motivo o notas de la transferencia..."
                className="bg-muted/40"
                disabled={creating}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2 sm:max-w-sm">
            <div>
              <p className="text-sm font-medium">Controlar stock</p>
              <p className="text-muted-foreground text-xs">
                {controlStock
                  ? "Valida existencias del almacén origen"
                  : "Permite transferir sin validación"}
              </p>
            </div>
            <Switch
              checked={controlStock}
              onCheckedChange={setControlStock}
              disabled={creating}
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
              value={sourceWarehouseId ? String(sourceWarehouseId) : undefined}
              onChange={selectSourceWarehouse}
              items={warehouseOptions.map((warehouse) => ({
                id: warehouse.id,
                name: `${warehouse.name} (${warehouse.code})`,
              }))}
            />

            <div className="relative">
              <MagnifyingGlass
                className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                weight="bold"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  sourceWarehouseId
                    ? "Buscar por nombre, SKU, código de barras o referencia"
                    : "Seleccione un almacén de origen primero"
                }
                disabled={!sourceWarehouseId}
                className="pl-9 pr-9"
              />
              {productsLoading && (
                <Spinner className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>

            <div className="max-h-[420px] min-h-[120px] overflow-y-auto rounded-md border">
              {!sourceWarehouseId ? (
                <p className="text-muted-foreground p-6 text-center text-sm">
                  Seleccione un almacén de origen para ver su inventario.
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-muted-foreground p-6 text-center text-sm">
                  No hay productos con existencias en este almacén.
                </p>
              ) : (
                <div className="divide-y">
                  {filteredProducts.map((product) => {
                    const stock = stockByProduct.get(product.id) ?? 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 p-3"
                      >
                        <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                          {product.image ? (
                            <img
                              src={getProductImageUrl(product.image)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Cube
                              className="text-primary size-5"
                              weight="duotone"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {product.sku}
                            {product.barcode ? ` · ${product.barcode}` : ""}
                            {product.reference
                              ? ` · Ref. ${product.reference}`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-primary">
                            Disponible: {stock} {product.unit ?? ""}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => addProduct(product)}
                          title="Agregar a la transferencia"
                        >
                          <Plus weight="bold" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
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
              value={
                destinationWarehouseId
                  ? String(destinationWarehouseId)
                  : undefined
              }
              onChange={(value) =>
                setDestinationWarehouseId(value ? Number(value) : undefined)
              }
              items={warehouseOptions
                .filter((warehouse) => warehouse.id !== sourceWarehouseId)
                .map((warehouse) => ({
                  id: warehouse.id,
                  name: `${warehouse.name} (${warehouse.code})`,
                }))}
            />

            <div className="max-h-[420px] min-h-[120px] divide-y overflow-y-auto rounded-md border">
              {cart.length === 0 ? (
                <p className="text-muted-foreground p-6 text-center text-sm">
                  Agregue productos desde el almacén origen.
                </p>
              ) : (
                cart.map((item) => (
                  <TransferCartItem
                    key={item.product.id}
                    product={item.product}
                    quantity={item.quantity}
                    availableStock={stockByProduct.get(item.product.id) ?? 0}
                    controlStock={controlStock}
                    disabled={creating}
                    onQuantityChange={(quantity) =>
                      updateQuantity(item.product.id, quantity)
                    }
                    onRemove={() => updateQuantity(item.product.id, 0)}
                  />
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {cart.length} {cart.length === 1 ? "línea" : "líneas"}
              </span>
              <span className="font-semibold">Total unidades: {totalUnits}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={
                creating ||
                cart.length === 0 ||
                !sourceWarehouseId ||
                !destinationWarehouseId
              }
            >
              {creating ? <Spinner className="mr-2 size-4 animate-spin" /> : null}
              Registrar transferencia
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
