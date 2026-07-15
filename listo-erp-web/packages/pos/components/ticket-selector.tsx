import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer } from "@/packages/customers/types";
import type { Seller } from "@/packages/sellers/types";

interface TicketSelectorProps {
  label: string;
  value?: string;
  items: Array<Customer | Seller>;
  onChange: (value: string) => void;
}

export function TicketSelector({ label, value, items, onChange }: TicketSelectorProps) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {label}
      <Select value={value} onValueChange={onChange} disabled={items.length === 0}>
        <SelectTrigger className="w-full bg-muted/40 text-left font-normal normal-case text-foreground"><SelectValue placeholder={`Sin ${label.toLocaleLowerCase()}`} /></SelectTrigger>
        <SelectContent>{items.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
      </Select>
    </label>
  );
}
