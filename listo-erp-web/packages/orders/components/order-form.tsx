"use client";

import { showToast } from "@/components/ui/sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useGetCustomers } from "@/packages/customers/api";
import { useGetDepartments } from "@/packages/department/api";
import { useGetProducts } from "@/packages/product/api";
import type { Product } from "@/packages/product/types";
import { useGetInventoryBalances } from "@/packages/inventory/api";
import { useCreateOrder, useUpdateOrder, useGetOrder } from "@/packages/orders/api";
import type { CartItem } from "@/packages/orders/types";
import { useGetBranches } from "@/packages/branch/api";
import { useGetSellers } from "@/packages/sellers/api";
import { ProductCatalog } from "@/packages/pos/components/product-catalog";
import { CatalogPagination } from "@/packages/pos/components/catalog-pagination";
import { TicketItem } from "@/packages/pos/components/ticket-item";
import { TicketSummary } from "@/packages/pos/components/ticket-summary";
import { TicketSelector } from "@/packages/pos/components/ticket-selector";
import { formatAmount } from "@/packages/pos/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface OrderFormProps {
  orderId?: number;
}

export function OrderForm({ orderId }: OrderFormProps) {
  const t = useTranslation();
  const router = useRouter();

  const [customerId, setCustomerId] = useState<number | undefined>();
  const [branchId, setBranchId] = useState<number | undefined>();
  const [sellerId, setSellerId] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [catalogSize, setCatalogSize] = useState({ width: 0, height: 0 });
  const catalogViewportRef = useRef<HTMLDivElement>(null);

  const [existingOrder, orderLoading] = useGetOrder(orderId ?? null);

  const [departments] = useGetDepartments();
  const [products, productsLoading] = useGetProducts({ departmentId });
  const [customers] = useGetCustomers();
  const [branchesResponse] = useGetBranches();
  const [sellersResponse] = useGetSellers();
  const [inventoryBalances] = useGetInventoryBalances();

  const [createOrder, creating, createError] = useCreateOrder();
  const [updateOrder, updating, updateError] = useUpdateOrder(orderId ?? 0);

  useEffect(() => {
    if (existingOrder && orderId) {
      setCustomerId(existingOrder.customerId);
      setBranchId(existingOrder.branchId ?? undefined);
      setSellerId(existingOrder.sellerId ?? undefined);
      setNotes(existingOrder.notes ?? "");
      setCart(
        existingOrder.items.map((item) => ({
          product: {
            id: item.productId,
            sku: item.product.sku,
            name: item.product.name,
            salePrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
          } as Product,
          quantity: Number(item.quantity),
        }))
      );
    }
  }, [existingOrder, orderId]);

  const departmentList = departments?.data?.filter((d) => d.isActive) ?? [];
  const productList = (Array.isArray(products) ? products : products?.data ?? []).filter((p) => p.isActive);
  const customerList = customers?.filter((c) => c.isActive) ?? [];
  const branchList = branchesResponse?.filter((branch) => branch.isActive) ?? [];
  const sellerList = sellersResponse?.filter((seller) => seller.isActive) ?? [];

  const stockByProduct = useMemo(() => {
    const map = new Map<number, number>();
    for (const balance of inventoryBalances ?? []) {
      map.set(
        balance.product.id,
        (map.get(balance.product.id) ?? 0) + Math.max(0, Number(balance.quantity))
      );
    }
    return map;
  }, [inventoryBalances]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productList;
    return productList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [productList, search]);

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
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0
  );
  const tax = cart.reduce(
    (sum, item) =>
      sum + item.product.salePrice * item.quantity * (Number(item.product.taxRate ?? 0) > 1 ? Number(item.product.taxRate) / 100 : Number(item.product.taxRate ?? 0)),
    0
  );
  const total = subtotal + tax;

  const loading = orderLoading || productsLoading;
  const saving = creating || updating;

  useEffect(() => {
    if (loading) return;
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
  }, [loading]);

  const addProduct = (product: Product) => {
    const availableStock = stockByProduct.get(product.id) ?? 0;
    if (availableStock <= 0) {
      showToast({
        type: "warning",
        message: t("sales.orders.noStock"),
      });
      return;
    }
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem && existingItem.quantity >= availableStock) {
      showToast({
        type: "warning",
        message: t("sales.orders.maxStockReached"),
      });
      return;
    }
    setCart((current) => {
      const item = current.find((line) => line.product.id === product.id);
      if (!item) return [...current, { product, quantity: 1 }];
      return current.map((line) =>
        line.product.id === product.id
          ? { ...line, quantity: line.quantity + 1 }
          : line
      );
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    if (quantity <= 0) {
      setCart((current) =>
        current.filter((item) => item.product.id !== productId)
      );
      return;
    }
    const availableStock = stockByProduct.get(productId) ?? 0;
    const nextQuantity = Math.min(quantity, availableStock);
    if (quantity > availableStock) {
      showToast({
        type: "warning",
        message: t("sales.orders.quantityAdjusted"),
      });
    }
    setCart((current) =>
      nextQuantity <= 0
        ? current.filter((item) => item.product.id !== productId)
        : current.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: nextQuantity }
              : item
          )
    );
  };

  const handleSubmit = () => {
    if (!customerId) {
      showToast({ type: "error", message: t("sales.orders.selectCustomer") });
      return;
    }
    if (cart.length === 0) {
      showToast({ type: "error", message: t("sales.orders.addProducts") });
      return;
    }

    const payload = {
      customerId,
      branchId: branchId || undefined,
      sellerId: sellerId || undefined,
      notes: notes || undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    if (orderId) {
      updateOrder(
        payload,
        () => {
          showToast({ type: "success", message: t("sales.orders.updated") });
          router.push("/listoerp/ventas/pedidos");
        }
      );
    } else {
      createOrder(payload, () => {
        showToast({ type: "success", message: t("sales.orders.created") });
        router.push("/listoerp/ventas/pedidos");
      });
    }
  };

  useEffect(() => {
    if (createError) {
      showToast({ type: "error", message: createError.message });
    }
  }, [createError]);

  useEffect(() => {
    if (updateError) {
      showToast({ type: "error", message: updateError.message });
    }
  }, [updateError]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-[calc(100dvh-5.5rem)] min-h-[560px]">
      <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-h-0 min-w-0 flex-col gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass
                className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                weight="bold"
              />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar producto o SKU"
                className="pl-9"
              />
            </div>
            <Select
              value={departmentId?.toString() ?? ""}
              onValueChange={(v) => {
                setDepartmentId(v ? Number(v) : undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Todos los departamentos" />
              </SelectTrigger>
              <SelectContent>
                {departmentList.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {loading ? (
              <div className="text-muted-foreground flex min-h-80 flex-1 items-center justify-center text-sm">
                Cargando...
              </div>
            ) : (
              <>
                <ProductCatalog
                  products={pageProducts}
                  rows={rows}
                  columns={columns}
                  stockByProduct={stockByProduct}
                  disabled={false}
                  viewportRef={catalogViewportRef}
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
          <div className="flex flex-col h-full gap-0 overflow-hidden py-0 rounded-lg border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="text-base font-semibold">Resumen del pedido</h3>
              <p className="text-muted-foreground text-xs">{itemCount} artículos</p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5">
              <div className="shrink-0 grid gap-3">
                <TicketSelector
                  label="Cliente"
                  value={customerId ? String(customerId) : undefined}
                  onChange={(v) => setCustomerId(Number(v))}
                  items={customerList}
                />
                <TicketSelector
                  label="Sucursal"
                  value={branchId ? String(branchId) : undefined}
                  onChange={(v) => setBranchId(v ? Number(v) : undefined)}
                  items={branchList}
                />
                <TicketSelector
                  label="Vendedor"
                  value={sellerId ? String(sellerId) : undefined}
                  onChange={(v) => setSellerId(v ? Number(v) : undefined)}
                  items={sellerList}
                />
              </div>
              <div className="shrink-0 grid gap-1.5">
                <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Notas
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales del pedido..."
                  className="bg-muted/40"
                />
              </div>
              <div className="min-h-0 flex-1 divide-y overflow-y-auto border-y">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground py-10 text-center text-sm">
                    Agrega productos para iniciar el pedido.
                  </p>
                ) : (
                  cart.map((item) => (
                    <TicketItem
                      key={item.product.id}
                      item={item}
                      availableStock={stockByProduct.get(item.product.id) ?? 0}
                      onQuantityChange={updateQuantity}
                    />
                  ))
                )}
              </div>
              <TicketSummary subtotal={subtotal} tax={tax} total={total} className="shrink-0" />
              <div className="shrink-0 space-y-2">
                <p className="text-center text-sm font-semibold">
                  Total a pagar: {formatAmount(total)}
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={saving || cart.length === 0 || !customerId}
                >
                  {saving ? (
                    <Spinner className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {orderId ? "Actualizar pedido" : "Guardar pedido"}
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
