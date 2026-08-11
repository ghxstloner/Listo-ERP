import { Button } from "@/components/ui/button";
import { X, Wallet } from "@phosphor-icons/react";
import { getPaymentMethodImageUrl } from "@/packages/payment-methods/api";
import type { LocalPaymentEntry, PaymentMethod } from "../types";
import { formatAmount } from "../utils";

interface PaymentSplitPanelProps {
  total: number;
  payments: LocalPaymentEntry[];
  paymentMethods: PaymentMethod[];
  remaining: number;
  canOpenPaymentDialog: boolean;
  onRemovePayment: (localId: string) => void;
  onOpenPaymentDialog: () => void;
}

export function PaymentSplitPanel({
  total,
  payments,
  paymentMethods,
  remaining,
  canOpenPaymentDialog,
  onRemovePayment,
  onOpenPaymentDialog,
}: PaymentSplitPanelProps) {
  return (
    <div className="shrink-0 space-y-2">
      {payments.length === 0 && (
        <div className="space-y-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total a pagar</p>
            <p className="text-lg font-semibold">{formatAmount(total)}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!canOpenPaymentDialog}
            onClick={onOpenPaymentDialog}
          >
            <Wallet size={16} weight="bold" /> Pagar
          </Button>
        </div>
      )}

      {payments.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-1">
            {payments.map((payment) => {
              const method = paymentMethods.find(
                (pm) => pm.id === payment.paymentMethodId,
              );
              return (
                <div
                  key={payment.localId}
                  className="flex items-center justify-between rounded-md border bg-card px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {method?.image && (
                      <img
                        src={getPaymentMethodImageUrl(method.image)}
                        alt=""
                        className="h-4 w-4 shrink-0 rounded object-contain"
                      />
                    )}
                    <span className="truncate text-xs">{method?.name ?? "Metodo"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-medium">
                      {formatAmount(payment.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemovePayment(payment.localId)}
                      className="text-muted-foreground hover:text-foreground rounded p-0.5"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {remaining > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Faltan <span className="font-semibold text-foreground">{formatAmount(remaining)}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canOpenPaymentDialog}
                onClick={onOpenPaymentDialog}
              >
                Agregar mas
              </Button>
            </div>
          )}

          {remaining === 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600 font-medium">Pago completo</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!canOpenPaymentDialog}
                onClick={onOpenPaymentDialog}
              >
                Editar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
