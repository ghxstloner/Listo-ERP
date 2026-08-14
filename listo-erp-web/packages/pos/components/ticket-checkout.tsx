import { Button } from "@/components/ui/button";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { CheckCircle } from "@phosphor-icons/react";

interface TicketCheckoutProps {
  total: number;
  disabled: boolean;
  loading?: boolean;
  onCharge: () => void;
}

export function TicketCheckout({ total, disabled, loading = false, onCharge }: TicketCheckoutProps) {
  const { formatMoney } = useCurrency();

  return (
    <Button className="w-full shrink-0" size="lg" disabled={disabled || loading} onClick={onCharge}>
      <CheckCircle weight="bold" /> {loading ? "Registrando venta..." : `Cobrar ${formatMoney(total)}`}
    </Button>
  );
}
