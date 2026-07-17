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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import {
  useCloseCashSession,
  useOpenCashSession,
} from "@/packages/cash-sessions/api";
import type { CashSession } from "@/packages/cash-sessions/types";
import type { Till } from "@/packages/till/types";
import { queryClient } from "@/packages/config/query/client";
import Link from "next/link";
import { useEffect, useState } from "react";

function invalidatePosSession() {
  queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
}

export function OpenPosCashSessionDialog({
  deviceKey,
  till,
  open,
  onOpenChange,
}: {
  deviceKey: string;
  till: Till;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [openingAmount, setOpeningAmount] = useState("");
  const [openingNote, setOpeningNote] = useState("");
  const [openSession, opening, error] = useOpenCashSession();

  useEffect(() => {
    if (error) showToast({ type: "error", message: error.message });
  }, [error]);

  const submit = () => {
    const amount = Number(openingAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    openSession(
      {
        tillId: till.id,
        deviceKey,
        openingAmount: amount,
        openingNote: openingNote.trim() || undefined,
      },
      () => {
        invalidatePosSession();
        onOpenChange(false);
        showToast({ type: "success", message: "Caja abierta exitosamente." });
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir caja</DialogTitle>
          <DialogDescription>
            Debes abrir una caja antes de usar el POS.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            {till.tillName} ({till.tillCode}) - {till.branch?.name}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-opening-amount">Monto inicial</Label>
            <Input
              id="pos-opening-amount"
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(event) => setOpeningAmount(event.target.value)}
              placeholder="0.00"
              disabled={opening}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-opening-note">Nota</Label>
            <textarea
              id="pos-opening-note"
              value={openingNote}
              onChange={(event) => setOpeningNote(event.target.value)}
              className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              disabled={opening}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={opening || openingAmount === ""}>
            {opening ? "Abriendo..." : "Abrir caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PosAccessActions({
  deviceKey,
  till,
}: {
  deviceKey: string;
  till: Till | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-lg">
        <h2 className="text-xl font-semibold">Acceso al punto de venta</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {till
            ? `Caja asociada: ${till.tillName} (${till.tillCode})`
            : "Este acceso no tiene una caja asociada."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" asChild>
            <Link href="/listoerp/ventas/cierres-caja">
              Ver registro de cajas
            </Link>
          </Button>
          {till && <Button onClick={() => setOpen(true)}>Abrir caja</Button>}
        </div>
        {till && (
          <OpenPosCashSessionDialog
            deviceKey={deviceKey}
            till={till}
            open={open}
            onOpenChange={setOpen}
          />
        )}
      </div>
    </div>
  );
}

export function CloseExpiredCashSessionDialog({
  session,
}: {
  session: CashSession;
}) {
  const [declaredClosingAmount, setDeclaredClosingAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [closeSession, closing, error] = useCloseCashSession(session.id);

  useEffect(() => {
    if (error) showToast({ type: "error", message: error.message });
  }, [error]);

  const submit = () => {
    const amount = Number(declaredClosingAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    closeSession(
      {
        declaredClosingAmount: amount,
        closingNote: closingNote.trim() || undefined,
      },
      () => {
        invalidatePosSession();
        showToast({
          type: "success",
          message: "Caja vencida cerrada. Puedes abrir una nueva sesión.",
        });
      },
    );
  };

  return (
    <Dialog open>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>La sesión de caja venció</DialogTitle>
          <DialogDescription>
            Debes realizar el arqueo y cerrar {session.till.tillName} antes de
            abrir una nueva caja.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pos-declared-closing-amount">Monto contado</Label>
            <Input
              id="pos-declared-closing-amount"
              type="number"
              min="0"
              step="0.01"
              value={declaredClosingAmount}
              onChange={(event) => setDeclaredClosingAmount(event.target.value)}
              placeholder="0.00"
              disabled={closing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-closing-note">Nota</Label>
            <textarea
              id="pos-closing-note"
              value={closingNote}
              onChange={(event) => setClosingNote(event.target.value)}
              className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              disabled={closing}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={closing || declaredClosingAmount === ""}
          >
            {closing ? "Cerrando..." : "Cerrar caja vencida"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CashSessionInUseDialog() {
  return (
    <Dialog open>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Hay una caja abierta en otro equipo</DialogTitle>
          <DialogDescription>
            Este usuario ya tiene una sesión de caja abierta desde otro equipo.
            Debes cerrarla antes de operar desde este equipo.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
