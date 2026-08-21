"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProductImageUrl } from "@/packages/product/api";
import { Cube, Minus, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";

type TransferCartItemProduct = {
  name: string;
  sku: string;
  barcode?: string | null;
  reference?: string | null;
  image?: string | null;
};

interface TransferCartItemProps {
  product: TransferCartItemProduct;
  quantity: number;
  availableStock?: number;
  controlStock: boolean;
  disabled: boolean;
  readOnly?: boolean;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
}

export function TransferCartItem({
  product,
  quantity,
  availableStock,
  controlStock,
  disabled,
  readOnly = false,
  onQuantityChange,
  onRemove,
}: TransferCartItemProps) {
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);

  const subtitle = readOnly
    ? [
        product.sku,
        product.barcode,
        product.reference ? `Ref. ${product.reference}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : `${product.sku} · Disponible: ${
        controlStock ? (availableStock ?? 0) : "Sin límite"
      }`;

  return (
    <div className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40">
      <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
        {product.image ? (
          <img
            src={getProductImageUrl(product.image)}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Cube className="text-primary size-5" weight="duotone" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
      </div>

      {readOnly ? (
        <span className="shrink-0 rounded-md border bg-muted/50 px-3 py-1.5 text-sm font-semibold">
          Cantidad: {quantity}
        </span>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={disabled}
              onClick={() => onQuantityChange?.(quantity - 1)}
            >
              <Minus weight="bold" />
            </Button>
            <Input
              className="h-8 w-14 px-1 text-center text-sm font-semibold"
              type="number"
              min="0"
              max={controlStock ? availableStock : undefined}
              step="any"
              value={quantityDraft ?? quantity}
              disabled={disabled}
              onChange={(event) => {
                const value = event.target.value;
                setQuantityDraft(value);
                if (value !== "") onQuantityChange?.(Number(value));
              }}
              onBlur={() => {
                if (quantityDraft === null) return;
                if (quantityDraft.trim() === "") onRemove?.();
                else setQuantityDraft(null);
              }}
            />
            <Button
              variant="outline"
              size="icon-sm"
              disabled={disabled}
              onClick={() => onQuantityChange?.(quantity + 1)}
            >
              <Plus weight="bold" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onRemove?.()}
            aria-label={`Quitar ${product.name}`}
            title="Quitar de la transferencia"
          >
            <Trash className="text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
}
