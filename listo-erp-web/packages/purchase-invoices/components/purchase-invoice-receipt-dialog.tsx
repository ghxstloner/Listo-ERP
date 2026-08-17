"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CircleNotch, DownloadSimple } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { downloadPurchaseInvoiceReceipt } from "../api";

interface PurchaseInvoiceReceiptDialogProps {
  invoiceId: number | null;
  documentNumber?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseInvoiceReceiptDialog({
  invoiceId,
  documentNumber,
  open,
  onOpenChange,
}: PurchaseInvoiceReceiptDialogProps) {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !invoiceId) return;
    let current = true;
    let url: string | null = null;
    void Promise.resolve()
      .then(() => {
        if (current) setError(null);
        return downloadPurchaseInvoiceReceipt(invoiceId);
      })
      .then((blob) => {
        url = URL.createObjectURL(blob);
        if (current) setReceiptUrl(url);
      })
      .catch((reason) => {
        if (current)
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudo cargar el recibo.",
          );
      });
    return () => {
      current = false;
      if (url) URL.revokeObjectURL(url);
      setReceiptUrl(null);
    };
  }, [invoiceId, open]);

  const download = () => {
    if (!receiptUrl) return;
    const anchor = document.createElement("a");
    anchor.href = receiptUrl;
    anchor.download = `${documentNumber ?? "factura-proveedor"}-recibo.pdf`;
    anchor.click();
  };

  const loading = open && Boolean(invoiceId) && !receiptUrl && !error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recibo de factura de proveedor</DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          {receiptUrl ? (
            <iframe
              title="Vista previa del recibo de proveedor"
              src={receiptUrl}
              className="h-[70vh] w-full bg-white"
            />
          ) : (
            <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
              {loading ? (
                <>
                  <CircleNotch className="mr-2 size-4 animate-spin" /> Generando
                  recibo...
                </>
              ) : (
                (error ?? "No hay recibo disponible.")
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="rounded-md bg-muted p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Separator />
        <DialogFooter>
          <Button disabled={!receiptUrl} onClick={download}>
            <DownloadSimple /> Descargar recibo
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
