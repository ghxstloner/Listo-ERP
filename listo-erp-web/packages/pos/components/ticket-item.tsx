import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import type { CartItem } from "../types";
import { formatAmount } from "../utils";

interface TicketItemProps {
  item: CartItem;
  availableStock: number;
  onQuantityChange: (productId: number, quantity: number) => void;
}

export function TicketItem({ item, availableStock, onQuantityChange }: TicketItemProps) {
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);
  const setQuantity = (quantity: number) => {
    setQuantityDraft(null);
    onQuantityChange(item.product.id, quantity);
  };

  return (
    <div className="flex gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.product.name}</p>
        <p className="text-muted-foreground text-xs">{formatAmount(item.product.salePrice)} c/u</p>
        <div className="mt-2 flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setQuantity(item.quantity - 1)}><Minus weight="bold" /></Button>
          <Input
            className="h-8 w-14 px-1 text-center text-sm font-semibold"
            type="number"
            min="0"
            max={availableStock}
            step="any"
            value={quantityDraft ?? item.quantity}
            onChange={(event) => {
              const value = event.target.value;
              setQuantityDraft(value);
              if (value !== "") onQuantityChange(item.product.id, Number(value));
            }}
            onBlur={() => setQuantityDraft(null)}
          />
          <Button variant="outline" size="icon-sm" onClick={() => setQuantity(item.quantity + 1)}><Plus weight="bold" /></Button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <p className="text-sm font-semibold">{formatAmount(item.product.salePrice * item.quantity)}</p>
        <Button variant="ghost" size="icon-sm" onClick={() => setQuantity(0)}><Trash className="text-destructive" /></Button>
      </div>
    </div>
  );
}
