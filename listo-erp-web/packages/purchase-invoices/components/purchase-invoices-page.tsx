"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useGetPurchaseInvoices } from "../api";
import { PurchaseInvoicesTable } from "./purchase-invoices-table";

export function PurchaseInvoicesPage() {
  const [invoices, isLoading, error] = useGetPurchaseInvoices();

  return (
    <Card className="w-full">
      <CardContent>
        <PurchaseInvoicesTable
          invoices={invoices ?? []}
          isLoading={isLoading}
          error={error}
        />
      </CardContent>
    </Card>
  );
}
