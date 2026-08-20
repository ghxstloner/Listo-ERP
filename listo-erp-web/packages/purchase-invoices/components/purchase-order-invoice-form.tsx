"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/sonner";
import { MoneyInput } from "@/packages/currency/components/money-input";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { useGetProducts } from "@/packages/product/api";
import { useGetPurchaseOrder } from "@/packages/purchase-orders/api";
import { formatSeriesNumber } from "@/packages/series/constants";
import { useGetActiveSeries } from "@/packages/series/api";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCreatePurchaseInvoice } from "../api";

interface PurchaseOrderInvoiceFormProps {
  orderId: number;
}

interface LineDraft {
  unitCost: string;
  taxRate: string;
}

export function PurchaseOrderInvoiceForm({
  orderId,
}: PurchaseOrderInvoiceFormProps) {
  const { formatMoney, parseMoney } = useCurrency();
  const queryClient = useQueryClient();
  const [order, orderLoading, orderError] = useGetPurchaseOrder(orderId);
  const [productsResponse] = useGetProducts({ productType: "PRODUCT" });
  const [createInvoice, creating, createError] = useCreatePurchaseInvoice();
  const [activeSeries, seriesLoading] = useGetActiveSeries("PURCHASE_INVOICES");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [drafts, setDrafts] = useState<Record<number, LineDraft>>({});

  const products = useMemo(
    () =>
      Array.isArray(productsResponse)
        ? productsResponse
        : (productsResponse?.data ?? []),
    [productsResponse],
  );
  const lines = useMemo(
    () =>
      (order?.items ?? []).map((item) => {
        const product = products.find(
          (candidate) => candidate.id === item.productId,
        );
        const draft = drafts[item.productId];
        return {
          ...item,
          unitCost: draft?.unitCost ?? formatMoney(item.unitCost),
          taxRate:
            draft?.taxRate ??
            (product?.isExempt ? "0" : String((product?.tax?.rate ?? 0) * 100)),
        };
      }),
    [drafts, formatMoney, order?.items, products],
  );
  const subtotal = lines.reduce(
    (sum, item) => sum + parseMoney(item.unitCost) * item.quantity,
    0,
  );
  const tax = lines.reduce(
    (sum, item) =>
      sum +
      parseMoney(item.unitCost) * item.quantity * (Number(item.taxRate) / 100),
    0,
  );
  const total = subtotal + tax;
  const nextInvoiceNumber = activeSeries
    ? formatSeriesNumber(activeSeries.format, activeSeries.consecutive)
    : null;

  const updateLine = (productId: number, draft: Partial<LineDraft>) => {
    const currentLine = lines.find((line) => line.productId === productId);
    setDrafts((current) => ({
      ...current,
      [productId]: {
        unitCost: current[productId]?.unitCost ?? currentLine?.unitCost ?? "",
        taxRate: current[productId]?.taxRate ?? currentLine?.taxRate ?? "0",
        ...draft,
      },
    }));
  };

  const submit = () => {
    if (!order || order.status !== "PENDING") return;
    if (!activeSeries || !issueDate) {
      showToast({
        type: "error",
        message:
          "Configura una serie activa y completa la fecha de la factura.",
      });
      return;
    }
    const items = lines.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: parseMoney(item.unitCost),
      taxRate: Number(item.taxRate) / 100,
    }));
    if (
      items.some(
        (item) =>
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
        message: "Revisa los costes e impuestos de los productos.",
      });
      return;
    }

    createInvoice(
      {
        supplierId: order.supplierId,
        warehouseId: order.warehouseId,
        purchaseOrderId: order.id,
        issueDate,
        items,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        showToast({
          type: "success",
          message: "Orden aprobada y factura registrada correctamente.",
        });
        window.location.href = "/listoerp/purchases/billing";
      },
    );
  };

  if (orderLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-muted-foreground">
        Cargando orden...
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-destructive">
            No se pudo cargar la orden de compra.
          </p>
          <Button variant="outline" asChild>
            <Link href="/listoerp/purchases/orders">Volver a órdenes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (order.status !== "PENDING") {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p>Esta orden ya no está pendiente y no puede facturarse.</p>
          <Button variant="outline" asChild>
            <Link href="/listoerp/purchases/orders">Volver a órdenes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/listoerp/purchases/orders">
          <ArrowLeft className="mr-1 size-4" /> Volver a órdenes
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Aprobar y facturar orden #{order.id}</CardTitle>
          <p className="text-muted-foreground text-sm">
            Confirma la factura del proveedor. Al guardar, la orden se cerrará y
            los productos ingresarán al inventario.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-muted-foreground text-xs uppercase">
                Proveedor
              </p>
              <p className="mt-1 font-medium">{order.supplier.name}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-muted-foreground text-xs uppercase">Almacén</p>
              <p className="mt-1 font-medium">{order.warehouse.name}</p>
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                htmlFor="supplier-invoice-number"
              >
                Número de factura
              </label>
              <Input
                id="supplier-invoice-number"
                value={
                  nextInvoiceNumber ??
                  (seriesLoading ? "Cargando serie..." : "Sin serie activa")
                }
                readOnly
                disabled
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                htmlFor="supplier-invoice-date"
              >
                Fecha de factura
              </label>
              <Input
                id="supplier-invoice-date"
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                disabled={creating}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Cantidad</th>
                  <th className="px-4 py-3 font-medium">Coste unitario</th>
                  <th className="px-4 py-3 font-medium">Impuesto %</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lines.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.product.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">
                      <MoneyInput
                        value={item.unitCost}
                        onValueChange={(value) =>
                          updateLine(item.productId, { unitCost: value })
                        }
                        disabled={creating}
                        aria-label={`Coste de ${item.product.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        className="w-24"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(event) =>
                          updateLine(item.productId, {
                            taxRate: event.target.value,
                          })
                        }
                        disabled={creating}
                        aria-label={`Impuesto de ${item.product.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(
                        parseMoney(item.unitCost) *
                          item.quantity *
                          (1 + Number(item.taxRate) / 100),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto max-w-sm space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impuestos</span>
              <span>{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          {createError && (
            <p className="text-destructive text-sm">{createError.message}</p>
          )}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={submit}
              disabled={creating || seriesLoading || !activeSeries}
            >
              {creating ? (
                <Spinner className="mr-2 size-4 animate-spin" />
              ) : null}
              {creating ? "Registrando..." : "Aprobar y registrar factura"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
