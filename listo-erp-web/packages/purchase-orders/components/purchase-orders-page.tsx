"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useGetPurchaseOrders } from "../api";
import { CreatePurchaseOrderDialog } from "./create-purchase-order-dialog";
import { PurchaseOrdersTable } from "./purchase-orders-table";

export function PurchaseOrdersPage() {
  const [orders, isLoading] = useGetPurchaseOrders();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Órdenes de compra</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las órdenes pendientes y registra la recepción de mercancía.
          </p>
        </div>
        <CreatePurchaseOrderDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <PurchaseOrdersTable orders={orders ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
