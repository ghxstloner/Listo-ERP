import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPaymentMethodImageUrl } from "@/packages/payment-methods/api";
import type { PaymentMethod } from "../types";

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod | null;
  paymentMethods: PaymentMethod[];
  onChange: (id: string) => void;
}

export function PaymentMethodSelector({ paymentMethod, paymentMethods, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="shrink-0">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Método de pago</p>
      <Select value={paymentMethod ? String(paymentMethod.id) : undefined} onValueChange={onChange} disabled={paymentMethods.length === 0}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona un método de pago" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">{paymentMethods.map((method) => <SelectItem key={method.id} value={String(method.id)}><span className="flex items-center gap-2">{method.image && <img src={getPaymentMethodImageUrl(method.image)} alt="" className="h-5 w-5 shrink-0 rounded object-contain" />}{method.name}</span></SelectItem>)}</SelectContent>
      </Select>
      {paymentMethods.length === 0 && <p className="text-muted-foreground mt-2 text-sm">No hay métodos de pago activos.</p>}
    </div>
  );
}
