"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { FileText, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { PurchaseInvoice } from "../types";
import { PurchaseInvoiceReceiptDialog } from "./purchase-invoice-receipt-dialog";

interface PurchaseInvoicesTableProps {
  invoices: PurchaseInvoice[];
  isLoading: boolean;
  error?: Error | null;
  action?: React.ReactNode;
}

export function PurchaseInvoicesTable({
  invoices,
  isLoading,
  error,
  action,
}: PurchaseInvoicesTableProps) {
  const { formatMoney } = useCurrency();
  const [search, setSearch] = useState("");
  const [receiptInvoice, setReceiptInvoice] = useState<PurchaseInvoice | null>(
    null,
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((invoice) =>
      [
        invoice.documentNumber,
        invoice.supplierInvoiceNumber,
        invoice.supplier.name,
        invoice.supplier.taxId ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [invoices, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar factura o proveedor..."
          />
        </div>
        {action}
      </div>
      {isLoading && (
        <p className="py-10 text-center text-muted-foreground">
          Cargando facturas...
        </p>
      )}
      {error && (
        <p className="py-10 text-center text-destructive">{error.message}</p>
      )}
      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">No. interno</th>
                <th className="px-4 py-3 font-medium">No. proveedor</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Almacén</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    {invoice.documentNumber}
                  </td>
                  <td className="px-4 py-3">{invoice.supplierInvoiceNumber}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{invoice.supplier.name}</td>
                  <td className="px-4 py-3">{invoice.warehouse.name}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatMoney(invoice.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReceiptInvoice(invoice)}
                    >
                      <FileText className="size-4" /> Recibo
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No hay facturas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <PurchaseInvoiceReceiptDialog
        invoiceId={receiptInvoice?.id ?? null}
        documentNumber={receiptInvoice?.documentNumber}
        open={receiptInvoice !== null}
        onOpenChange={(open) => !open && setReceiptInvoice(null)}
      />
    </div>
  );
}
