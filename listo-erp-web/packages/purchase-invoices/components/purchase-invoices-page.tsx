"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useGetPurchaseInvoices } from "../api";
import type { PurchaseInvoice } from "../types";
import { CreatePurchaseInvoiceDialog } from "./create-purchase-invoice-dialog";
import { PurchaseInvoiceReceiptDialog } from "./purchase-invoice-receipt-dialog";
import { PurchaseInvoicesTable } from "./purchase-invoices-table";

export function PurchaseInvoicesPage() {
  const [invoices, isLoading, error] = useGetPurchaseInvoices();
  const [createdInvoice, setCreatedInvoice] = useState<PurchaseInvoice | null>(
    null,
  );

  return (
    <Card className="w-full">
      <CardContent>
        <PurchaseInvoicesTable
          invoices={invoices ?? []}
          isLoading={isLoading}
          error={error}
          action={<CreatePurchaseInvoiceDialog onCreated={setCreatedInvoice} />}
        />
      </CardContent>
      <PurchaseInvoiceReceiptDialog
        invoiceId={createdInvoice?.id ?? null}
        documentNumber={createdInvoice?.documentNumber}
        open={createdInvoice !== null}
        onOpenChange={(open) => !open && setCreatedInvoice(null)}
      />
    </Card>
  );
}
