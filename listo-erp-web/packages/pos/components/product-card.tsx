import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/packages/currency/components/currency-provider";
import { getProductImageUrl } from "@/packages/product/api";
import { getProductDefaultPrice } from "@/packages/product/types";
import type { Product } from "@/packages/product/types";
import { Cube, Plus } from "@phosphor-icons/react";

interface ProductCardProps {
  product: Product;
  availableStock: number;
  disabled: boolean;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, availableStock, disabled, onAdd }: ProductCardProps) {
  const { formatMoney } = useCurrency();
  const defaultPrice = getProductDefaultPrice(product);

  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className="bg-primary/10 flex min-h-20 flex-1 items-center justify-center overflow-hidden">
        {product.image ? <img className="h-full w-full object-fit" src={getProductImageUrl(product.image)} alt={product.name} /> : <Cube className="text-primary size-9" weight="duotone" />}
      </div>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">{product.sku}</p>
            <p className="text-muted-foreground mt-1 text-xs">Disponible: {availableStock}</p>
          </div>
           <div className="shrink-0 text-right">
             <p className="text-sm font-bold">{formatMoney(defaultPrice?.amount ?? product.salePrice)}</p>
             {defaultPrice?.name && <p className="text-muted-foreground text-[11px]">{defaultPrice.name}</p>}
           </div>
        </div>
        <Button className="w-full" size="sm" disabled={disabled || availableStock <= 0} onClick={() => onAdd(product)}>
          <Plus weight="bold" /> Agregar
        </Button>
      </CardContent>
    </Card>
  );
}
