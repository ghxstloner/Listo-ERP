"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CircleNotch, DownloadSimple, WarningCircle, XCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { downloadElectronicInvoiceReceipt, useGetElectronicInvoiceStatus } from "../api";

interface ElectronicInvoiceDialogProps {
  saleId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const processingStatuses = new Set(["PENDING", "PROCESSING"]);

export function ElectronicInvoiceDialog({ saleId, open, onOpenChange }: ElectronicInvoiceDialogProps) {
  const [shouldPoll, setShouldPoll] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [invoice, , error] = useGetElectronicInvoiceStatus(saleId, shouldPoll);

  useEffect(() => {
    if (!open) {
      setShouldPoll(false);
      return;
    }
    setShouldPoll(true);
    const timeout = window.setTimeout(() => setShouldPoll(false), 30_000);
    return () => window.clearTimeout(timeout);
  }, [open, saleId]);

  const status = invoice?.status;
  const isAccepted = status === "ACCEPTED";
  const isProcessing = !status || processingStatuses.has(status);

  useEffect(() => {
    if (!open || !saleId || !isAccepted) return;
    let isCurrent = true;
    let url: string | null = null;
    setDownloadError(null);
    void downloadElectronicInvoiceReceipt(saleId)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        if (isCurrent) setReceiptUrl(url);
      })
      .catch((reason) => {
        if (isCurrent) {
          setDownloadError(reason instanceof Error ? reason.message : "No se pudo cargar el recibo.");
        }
      });
    return () => {
      isCurrent = false;
      if (url) URL.revokeObjectURL(url);
      setReceiptUrl(null);
    };
  }, [isAccepted, open, saleId]);

  const download = () => {
    if (!receiptUrl) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const anchor = document.createElement("a");
      anchor.href = receiptUrl;
      anchor.download = `${invoice?.consecutive ?? "factura"}-recibo.pdf`;
      anchor.click();
    } catch (reason) {
      setDownloadError(reason instanceof Error ? reason.message : "No se pudo descargar el recibo.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Factura electrónica</DialogTitle>
          <DialogDescription>
            {invoice?.consecutive ? `Consecutivo ${invoice.consecutive}` : "Consultando estado de facturación electrónica."}
          </DialogDescription>
        </DialogHeader>

        {isProcessing && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <CircleNotch className="mt-0.5 size-5 shrink-0 animate-spin" />
            <div>
              <p className="font-medium">Venta registrada. Factura en proceso.</p>
              <p className="mt-1 text-sm">No se mostrará como válida ni tendrá descarga hasta la aceptación DIAN.</p>
            </div>
          </div>
        )}

        {isAccepted && invoice && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {receiptUrl ? <iframe title="Vista previa del recibo electrónico" src={receiptUrl} className="h-96 w-full bg-white" /> : <div className="flex h-96 items-center justify-center text-sm text-muted-foreground"><CircleNotch className="mr-2 size-4 animate-spin" /> Generando vista previa...</div>}
            </div>
          </div>
        )}

        {status === "REJECTED" && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-950"><XCircle className="mt-0.5 size-5 shrink-0" weight="fill" /><div><p className="font-medium">Factura rechazada</p><p className="mt-1 text-sm">La venta se conservó, pero esta factura no es válida.</p></div></div>
        )}
        {status === "FAILED" && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-950"><WarningCircle className="mt-0.5 size-5 shrink-0" weight="fill" /><div><p className="font-medium">No se pudo procesar la factura</p><p className="mt-1 text-sm">La venta se conservó y requiere revisión operativa.</p></div></div>
        )}
        {(invoice?.lastError || error || downloadError) && <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{downloadError ?? error?.message ?? invoice?.lastError}</p>}

        <Separator />
        <DialogFooter>
          {isAccepted && invoice?.canDownload && <Button disabled={!receiptUrl || downloading} onClick={download}><DownloadSimple /> {downloading ? "Descargando..." : "Descargar recibo"}</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
