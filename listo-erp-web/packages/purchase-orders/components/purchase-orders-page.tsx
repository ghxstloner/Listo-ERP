"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useGetPurchaseOrders } from "../api";
import { CreatePurchaseOrderDialog } from "./create-purchase-order-dialog";
import { PurchaseOrdersTable } from "./purchase-orders-table";

export function PurchaseOrdersPage() {
  const [orders, isLoading] = useGetPurchaseOrders();

  return (
    <Card className="w-full">
      <CardContent>
        <PurchaseOrdersTable orders={orders ?? []} isLoading={isLoading} action={<CreatePurchaseOrderDialog />} />
      </CardContent>
    </Card>
  );
}
