import { Button } from "@/components/ui/button";
import { CheckCircle } from "@phosphor-icons/react";
import { formatAmount } from "../utils";

interface TicketCheckoutProps {
  total: number;
  disabled: boolean;
  loading?: boolean;
  onCharge: () => void;
}

export function TicketCheckout({ total, disabled, loading = false, onCharge }: TicketCheckoutProps) {
  return (
    <Button className="w-full shrink-0" size="lg" disabled={disabled || loading} onClick={onCharge}>
      <CheckCircle weight="bold" /> {loading ? "Registrando venta..." : `Cobrar ${formatAmount(total)}`}
    </Button>
  );
}
