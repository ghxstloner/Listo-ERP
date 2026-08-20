import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { getProductImageUrl } from "@/packages/product/api";
import { getProductDefaultPrice } from "@/packages/product/types";
import type { Product } from "@/packages/product/types";
import { Cube, Package, Plus, Sparkle } from "@phosphor-icons/react";

interface ProductCardProps {
  product: Product;
  availableStock?: number;
  priceOverride?: number | null;
  priceLabel?: string;
  disabled: boolean;
  showProductType?: boolean;
  onAdd: (product: Product) => void;
}

export function ProductCard({
  product,
  availableStock,
  priceOverride,
  priceLabel,
  disabled,
  showProductType,
  onAdd,
}: ProductCardProps) {
  const { formatMoney } = useCurrency();
  const defaultPrice =
    priceOverride === undefined ? getProductDefaultPrice(product) : null;
  const displayPrice =
    priceOverride === undefined
      ? (defaultPrice?.amount ?? product.salePrice)
      : priceOverride;
  const hasStockLimit = availableStock !== undefined;

  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className="bg-primary/10 relative flex min-h-20 flex-1 items-center justify-center overflow-hidden">
        {showProductType && (
          <>
            <div className="absolute right-0 top-0 z-10 h-12 w-12 bg-primary [clip-path:polygon(100%_0,0_0,100%_100%)]" />
            <div className="absolute right-1.5 top-1.5 z-20 text-primary-foreground">
              {product.productType === "SERVICE" ? (
                <Sparkle size={18} weight="duotone" />
              ) : (
                <Package size={18} weight="duotone" />
              )}
            </div>
          </>
        )}
        {product.image ? (
          <img
            className="h-full w-full object-fit"
            src={getProductImageUrl(product.image)}
            alt={product.name}
          />
        ) : (
          <Cube className="text-primary size-9" weight="duotone" />
        )}
      </div>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">{product.sku}</p>
            {hasStockLimit && (
              <p className="text-muted-foreground mt-1 text-xs">
                Disponible: {availableStock}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold">
              {displayPrice == null ? "Sin costo" : formatMoney(displayPrice)}
            </p>
            {(priceLabel ?? defaultPrice?.name) && (
              <p className="text-muted-foreground text-[11px]">
                {priceLabel ?? defaultPrice?.name}
              </p>
            )}
          </div>
        </div>
        <Button
          className="w-full"
          size="sm"
          disabled={disabled || (hasStockLimit && (availableStock ?? 0) <= 0)}
          onClick={() => onAdd(product)}
        >
          <Plus weight="bold" /> Agregar
        </Button>
      </CardContent>
    </Card>
  );
}
