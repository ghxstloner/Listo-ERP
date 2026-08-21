import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectableItem = { id: number; name: string };

interface TicketSelectorProps {
  label: string;
  value?: string;
  items: SelectableItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TicketSelector({
  label,
  value,
  items,
  onChange,
  disabled = false,
}: TicketSelectorProps) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {label}
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || items.length === 0}
      >
        <SelectTrigger className="w-full bg-muted/40 text-left font-normal normal-case text-foreground">
          <SelectValue placeholder={`Sin ${label.toLocaleLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
