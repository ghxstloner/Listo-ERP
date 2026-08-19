import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, Trash } from "@phosphor-icons/react";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import type { ProductPrice } from "@/packages/product/types";
import { useState } from "react";
import type { CartItem } from "../types";

interface TicketItemProps {
  item: CartItem;
  availableStock?: number;
  onQuantityChange: (productPriceId: number, quantity: number) => void;
  onPriceChange: (productPriceId: number, nextPrice: ProductPrice) => void;
}

export function TicketItem({ item, availableStock, onQuantityChange, onPriceChange }: TicketItemProps) {
  const { formatMoney } = useCurrency();
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);
  const activePrices = item.product.prices.filter((price) => price.isActive);
  const prices = activePrices.some((price) => price.id === item.productPriceId)
    ? activePrices
    : [
        ...activePrices,
        {
          id: item.productPriceId,
          productId: item.product.id,
          name: item.priceName ?? "Precio actual",
          amount: item.unitPrice,
          isActive: true,
          sortOrder: Number.MAX_SAFE_INTEGER,
        },
      ];
  const setQuantity = (quantity: number) => {
    setQuantityDraft(null);
    onQuantityChange(item.productPriceId, quantity);
  };

  return (
    <div className="flex gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.product.name}</p>
        <p className="text-muted-foreground text-xs">{formatMoney(item.unitPrice)} c/u</p>
        {prices.length > 0 && (
          <Select
            value={String(item.productPriceId)}
            onValueChange={(value) => {
              const price = prices.find((candidate) => candidate.id === Number(value));
              if (price) onPriceChange(item.productPriceId, price);
            }}
          >
            <SelectTrigger size="sm" className="mt-1 h-7 w-full max-w-[190px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {prices.map((price) => (
                <SelectItem key={price.id} value={String(price.id)}>
                  {price.name} · {formatMoney(price.amount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
               if (value !== "") onQuantityChange(item.productPriceId, Number(value));
            }}
            onBlur={() => setQuantityDraft(null)}
          />
          <Button variant="outline" size="icon-sm" onClick={() => setQuantity(item.quantity + 1)}><Plus weight="bold" /></Button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
         <p className="text-sm font-semibold">{formatMoney(item.unitPrice * item.quantity)}</p>
        <Button variant="ghost" size="icon-sm" onClick={() => setQuantity(0)}><Trash className="text-destructive" /></Button>
      </div>
    </div>
  );
}
