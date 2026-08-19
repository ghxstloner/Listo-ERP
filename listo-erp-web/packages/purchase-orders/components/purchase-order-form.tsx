"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/sonner";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useGetDepartments } from "@/packages/department/api";
import { useGetProducts } from "@/packages/product/api";
import type { Product } from "@/packages/product/types";
import {
  useGetSupplierProducts,
  useGetSuppliers,
} from "@/packages/suppliers/api";
import { useGetWarehouses } from "@/packages/warehouse/api";
import { CatalogPagination } from "@/packages/pos/components/catalog-pagination";
import { ProductCatalog } from "@/packages/pos/components/product-catalog";
import { TicketSelector } from "@/packages/pos/components/ticket-selector";
import { TicketSummary } from "@/packages/pos/components/ticket-summary";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCreatePurchaseOrder } from "../api";
import { PurchaseCartItem } from "./purchase-cart-item";

interface PurchaseCartLine {
  product: Product;
  quantity: number;
  unitCost: string;
}

export function PurchaseOrderForm() {
  const { formatMoney, parseMoney } = useCurrency();
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [warehouseId, setWarehouseId] = useState<number | undefined>();
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<PurchaseCartLine[]>([]);
  const [page, setPage] = useState(1);
  const [catalogSize, setCatalogSize] = useState({ width: 0, height: 0 });
  const catalogViewportRef = useRef<HTMLDivElement>(null);

  const [suppliers] = useGetSuppliers();
  const [warehouses] = useGetWarehouses();
  const [departments] = useGetDepartments();
  const [supplierProducts, supplierProductsLoading] = useGetSupplierProducts(
    supplierId ?? 0,
  );
  const [productsResponse, productsLoading] = useGetProducts({
    departmentId,
    productType: "PRODUCT",
  });
  const [createPurchaseOrder, creating, createError] = useCreatePurchaseOrder();

  const allProducts = useMemo(
    () =>
      Array.isArray(productsResponse)
        ? productsResponse
        : (productsResponse?.data ?? []),
    [productsResponse],
  );
  const supplierProductIds = useMemo(
    () => new Set((supplierProducts ?? []).map((item) => item.productId)),
    [supplierProducts],
  );
  const productList = useMemo(
    () =>
      allProducts.filter(
        (product) => product.isActive && supplierProductIds.has(product.id),
      ),
    [allProducts, supplierProductIds],
  );
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return productList;
    return productList.filter(
      (product) =>
        product.name.toLocaleLowerCase().includes(normalizedSearch) ||
        product.sku.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [productList, search]);
  const departmentList = (departments?.data ?? []).filter(
    (department) => department.isActive,
  );
  const supplierList = (suppliers ?? []).filter(
    (supplier) => supplier.isActive,
  );
  const warehouseList = (warehouses ?? []).filter(
    (warehouse) => warehouse.isActive,
  );
  const columns =
    catalogSize.width >= 1280
      ? 4
      : catalogSize.width >= 768
        ? 3
        : catalogSize.width >= 640
          ? 2
          : 1;
  const rows = Math.max(1, Math.floor((catalogSize.height + 12) / 232));
  const productsPerPage = columns * rows;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  );
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );
  const total = cart.reduce(
    (sum, item) => sum + parseMoney(item.unitCost) * item.quantity,
    0,
  );
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const element = catalogViewportRef.current;
    if (!element) return;
    const updateSize = () =>
      setCatalogSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, [supplierId, supplierProductsLoading, productsLoading]);

  const selectSupplier = (value: string) => {
    setSupplierId(value ? Number(value) : undefined);
    setCart([]);
    setPage(1);
  };

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...current,
        {
          product,
          quantity: 1,
          unitCost:
            product.costPrice == null ? "" : formatMoney(product.costPrice),
        },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.product.id !== productId)
        : current.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
    );
  };

  const updateCost = (productId: number, unitCost: string) => {
    setCart((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, unitCost } : item,
      ),
    );
  };

  const removeProduct = (productId: number) => {
    setCart((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  };

  const submit = () => {
    if (!supplierId || !warehouseId) {
      showToast({
        type: "error",
        message: "Selecciona un proveedor y un almacén.",
      });
      return;
    }
    if (cart.length === 0) {
      showToast({
        type: "error",
        message: "Agrega al menos un producto a la orden.",
      });
      return;
    }
    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitCost: parseMoney(item.unitCost),
    }));
    if (
      items.some(
        (item) =>
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.unitCost) ||
          item.unitCost <= 0,
      )
    ) {
      showToast({
        type: "error",
        message:
          "Completa cantidades y costes válidos para todos los productos.",
      });
      return;
    }

    createPurchaseOrder(
      { supplierId, warehouseId, notes: notes.trim() || undefined, items },
      () => {
        showToast({
          type: "success",
          message: "Orden de compra creada correctamente.",
        });
        router.push("/listoerp/purchases/orders");
      },
    );
  };

  return (
    <div className="h-[calc(100dvh-5.5rem)] min-h-[560px]">
      <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-h-0 min-w-0 flex-col gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar producto o SKU"
                className="pl-9"
              />
            </div>
            <Select
              value={departmentId?.toString() ?? ""}
              onValueChange={(value) => {
                setDepartmentId(value ? Number(value) : undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Todos los departamentos" />
              </SelectTrigger>
              <SelectContent>
                {departmentList.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {!supplierId ? (
              <div className="text-muted-foreground flex min-h-80 flex-1 items-center justify-center rounded-lg border border-dashed text-center text-sm">
                Selecciona un proveedor para ver sus productos.
              </div>
            ) : productsLoading || supplierProductsLoading ? (
              <div className="text-muted-foreground flex min-h-80 flex-1 items-center justify-center text-sm">
                Cargando productos...
              </div>
            ) : (
              <>
                <ProductCatalog
                  products={pageProducts}
                  rows={rows}
                  columns={columns}
                  disabled={creating}
                  viewportRef={catalogViewportRef}
                  priceOverride={(product) => product.costPrice}
                  priceLabel="Costo actual"
                  onAdd={addProduct}
                />
                <CatalogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </main>

        <aside className="min-h-0 min-w-0">
          <div className="flex h-full flex-col gap-0 overflow-hidden rounded-lg border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="text-base font-semibold">Orden de compra</h3>
              <p className="text-muted-foreground text-xs">
                {itemCount} artículos
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5">
              <div className="grid shrink-0 gap-3">
                <TicketSelector
                  label="Proveedor"
                  value={supplierId ? String(supplierId) : undefined}
                  onChange={selectSupplier}
                  items={supplierList}
                />
                <TicketSelector
                  label="Almacén"
                  value={warehouseId ? String(warehouseId) : undefined}
                  onChange={(value) =>
                    setWarehouseId(value ? Number(value) : undefined)
                  }
                  items={warehouseList}
                />
              </div>
              <div className="grid shrink-0 gap-1.5">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Notas
                </label>
                <Input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notas adicionales de la orden..."
                  className="bg-muted/40"
                  disabled={creating}
                />
              </div>
              <div className="min-h-0 flex-1 divide-y overflow-y-auto border-y">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground py-10 text-center text-sm">
                    Agrega productos para iniciar la orden.
                  </p>
                ) : (
                  cart.map((item) => (
                    <PurchaseCartItem
                      key={item.product.id}
                      product={item.product}
                      quantity={item.quantity}
                      unitCost={item.unitCost}
                      disabled={creating}
                      onQuantityChange={(quantity) =>
                        updateQuantity(item.product.id, quantity)
                      }
                      onCostChange={(value) =>
                        updateCost(item.product.id, value)
                      }
                      onRemove={() => removeProduct(item.product.id)}
                    />
                  ))
                )}
              </div>
              <TicketSummary
                subtotal={total}
                tax={0}
                total={total}
                showTax={false}
                className="shrink-0"
              />
              <div className="shrink-0 space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={submit}
                  disabled={
                    creating || cart.length === 0 || !supplierId || !warehouseId
                  }
                >
                  {creating ? (
                    <Spinner className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {creating ? "Creando orden..." : "Crear orden de compra"}
                </Button>
                {createError && (
                  <p className="text-destructive text-sm">
                    {createError.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
