import { useCurrency } from "@/packages/currency/components/currency-provider";

interface TicketSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  className?: string;
  showTax?: boolean;
}

export function TicketSummary({
  subtotal,
  tax,
  total,
  className,
  showTax = true,
}: TicketSummaryProps) {
  const { formatMoney } = useCurrency();

  return (
    <div className={`shrink-0 space-y-2 text-sm ${className ?? ""}`}>
      <div className="text-muted-foreground flex justify-between">
        <span>Subtotal</span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      {showTax && (
        <div className="text-muted-foreground flex justify-between">
          <span>Impuestos</span>
          <span>{formatMoney(tax)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-3 text-base font-bold">
        <span>Total</span>
        <span>{formatMoney(total)}</span>
      </div>
    </div>
  );
}
