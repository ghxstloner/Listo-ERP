import { Button } from "@/components/ui/button";
import { CheckCircle } from "@phosphor-icons/react";
import { formatAmount } from "../utils";

interface TicketCheckoutProps {
  total: number;
  disabled: boolean;
  onCharge: () => void;
}

export function TicketCheckout({ total, disabled, onCharge }: TicketCheckoutProps) {
  return (
    <Button className="w-full shrink-0" size="lg" disabled={disabled} onClick={onCharge}>
      <CheckCircle weight="bold" /> Cobrar {formatAmount(total)}
    </Button>
  );
}
