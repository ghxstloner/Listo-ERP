"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/packages/currency/components/money-input";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import type { Product } from "@/packages/product/types";
import { Minus, Plus, Trash } from "@phosphor-icons/react";

interface PurchaseCartItemProps {
  product: Product;
  quantity: number;
  unitCost: string;
  disabled: boolean;
  onQuantityChange: (quantity: number) => void;
  onCostChange: (value: string) => void;
  onRemove: () => void;
}

export function PurchaseCartItem({
  product,
  quantity,
  unitCost,
  disabled,
  onQuantityChange,
  onCostChange,
  onRemove,
}: PurchaseCartItemProps) {
  const { formatMoney, parseMoney } = useCurrency();
  const parsedCost = parseMoney(unitCost);

  return (
    <div className="flex gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-muted-foreground text-xs">{product.sku}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[90px_minmax(0,1fr)]">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={disabled}
              onClick={() => onQuantityChange(quantity - 1)}
            >
              <Minus weight="bold" />
            </Button>
            <Input
              className="h-8 w-14 px-1 text-center text-sm font-semibold"
              type="number"
              min="0.0001"
              step="0.0001"
              value={quantity}
              disabled={disabled}
              onChange={(event) => onQuantityChange(Number(event.target.value))}
            />
            <Button
              variant="outline"
              size="icon-sm"
              disabled={disabled}
              onClick={() => onQuantityChange(quantity + 1)}
            >
              <Plus weight="bold" />
            </Button>
          </div>
          <MoneyInput
            value={unitCost}
            onValueChange={onCostChange}
            disabled={disabled}
            aria-label={`Costo de ${product.name}`}
          />
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <p className="text-sm font-semibold">
          {formatMoney(parsedCost * quantity)}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Quitar ${product.name}`}
        >
          <Trash className="text-destructive" />
        </Button>
      </div>
    </div>
  );
}
