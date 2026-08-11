import { formatAmount } from "../utils";

interface TicketSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  className?: string;
}

export function TicketSummary({ subtotal, tax, total, className }: TicketSummaryProps) {
  return (
    <div className={`shrink-0 space-y-2 text-sm ${className ?? ""}`}>
      <div className="text-muted-foreground flex justify-between"><span>Subtotal</span><span>{formatAmount(subtotal)}</span></div>
      <div className="text-muted-foreground flex justify-between"><span>Impuestos</span><span>{formatAmount(tax)}</span></div>
      <div className="flex justify-between border-t pt-3 text-base font-bold"><span>Total</span><span>{formatAmount(total)}</span></div>
    </div>
  );
}
