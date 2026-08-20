import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDown, Check, Minus, Plus, Trash } from "@phosphor-icons/react";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import type { ProductPrice } from "@/packages/product/types";
import { cn } from "@/lib/utils";
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
  const activePrices = item.product.prices?.filter((price) => price.isActive) ?? [];
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

  const hasMultiplePrices = prices.length > 1;

  const setQuantity = (quantity: number) => {
    setQuantityDraft(null);
    onQuantityChange(item.productPriceId, quantity);
  };

  return (
    <div className="flex gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.product.name}</p>
        <p className="text-muted-foreground text-xs">
          {formatMoney(item.unitPrice)} c/u{item.priceName ? ` · ${item.priceName}` : ""}
        </p>
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
        {hasMultiplePrices ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 -mr-1.5 text-sm font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                title="Cambiar precio"
              >
                <span>{formatMoney(item.unitPrice * item.quantity)}</span>
                <CaretDown className="size-3 text-muted-foreground group-hover:text-foreground transition-transform group-data-[state=open]:rotate-180" weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Precios disponibles
              </DropdownMenuLabel>
              {prices.map((price) => {
                const isSelected = price.id === item.productPriceId;
                return (
                  <DropdownMenuItem
                    key={price.id}
                    onClick={() => onPriceChange(item.productPriceId, price)}
                    className={cn(
                      "flex items-center justify-between text-xs cursor-pointer py-2",
                      isSelected && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected ? (
                        <Check className="size-3.5 text-primary shrink-0" weight="bold" />
                      ) : (
                        <span className="size-3.5 shrink-0" />
                      )}
                      <span className="truncate">{price.name}</span>
                    </div>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{formatMoney(price.amount)}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <p className="text-sm font-semibold">{formatMoney(item.unitPrice * item.quantity)}</p>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => setQuantity(0)} title="Eliminar del ticket">
          <Trash className="text-destructive" />
        </Button>
      </div>
    </div>
  );
}
