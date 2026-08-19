"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useGetPurchaseOrders } from "../api";
import { PurchaseOrdersTable } from "./purchase-orders-table";

export function PurchaseOrdersPage() {
  const [orders, isLoading] = useGetPurchaseOrders();

  return (
    <Card className="w-full">
      <CardContent>
        <PurchaseOrdersTable
          orders={orders ?? []}
          isLoading={isLoading}
          action={
            <Button size="sm" asChild>
              <Link href="/listoerp/purchases/orders/new">
                <Plus className="mr-2 size-4" />
                Nueva orden
              </Link>
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
