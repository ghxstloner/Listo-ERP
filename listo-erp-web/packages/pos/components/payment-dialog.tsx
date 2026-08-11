import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "@phosphor-icons/react";
import { getPaymentMethodImageUrl } from "@/packages/payment-methods/api";
import type { LocalPaymentEntry, PaymentMethod } from "../types";
import { formatAmount } from "../utils";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  subtotal: number;
  tax: number;
  payments: LocalPaymentEntry[];
  paymentMethods: PaymentMethod[];
  remaining: number;
  onUpdatePayment: (methodId: number, amount: number) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  subtotal,
  tax,
  payments,
  paymentMethods,
  remaining,
  onUpdatePayment,
}: PaymentDialogProps) {
  const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  const paymentByMethodId = new Map<number, LocalPaymentEntry>();
  for (const p of payments) {
    paymentByMethodId.set(p.paymentMethodId, p);
  }

  const handleInputChange = (methodId: number, value: string) => {
    const numericValue = Number(value) || 0;
    onUpdatePayment(methodId, numericValue);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl min-h-[600px]">
        <DialogHeader>
          <DialogTitle>Pago</DialogTitle>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatAmount(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos</span>
              <span>{formatAmount(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-1 border-t">
              <span>Total a pagar</span>
              <span className="text-foreground">{formatAmount(total)}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const existingPayment = paymentByMethodId.get(method.id);
            const displayValue = existingPayment ? String(existingPayment.amount) : "";
            const maxAllowed = existingPayment ? existingPayment.amount + remaining : remaining;
            const isDisabled = remaining === 0 && !existingPayment;

            return (
              <div
                key={method.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {method.image && (
                  <img
                    src={getPaymentMethodImageUrl(method.image)}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-contain"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{method.name}</p>
                  {existingPayment && (
                    <p className="text-xs text-emerald-600">
                      Asignado: {formatAmount(existingPayment.amount)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-32">
                    <Input
                      type="number"
                      min={0}
                      max={maxAllowed}
                      step={0.01}
                      value={displayValue}
                      onChange={(e) => handleInputChange(method.id, e.target.value)}
                      placeholder="Monto"
                      disabled={isDisabled}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {paymentMethods.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay metodos de pago disponibles.
            </p>
          )}
        </div>

        <Separator />

        <DialogFooter className="sm:justify-between gap-2">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Pagado:</span>
              <span className="font-medium">{formatAmount(paymentsTotal)}</span>
            </div>
            {remaining > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Faltan:</span>
                <span className="font-semibold text-foreground">
                  {formatAmount(remaining)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle size={14} weight="fill" />
                <span className="font-medium">Pago completo</span>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleClose}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
