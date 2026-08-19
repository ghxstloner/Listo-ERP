import type { Product } from "@/packages/product/types";
import type { RefObject } from "react";
import { ProductCard } from "./product-card";

interface ProductCatalogProps {
  products: Product[];
  rows: number;
  columns: number;
  stockByProduct?: Map<number, number>;
  priceOverride?: (product: Product) => number | null | undefined;
  priceLabel?: string;
  disabled: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
  onAdd: (product: Product) => void;
}

export function ProductCatalog({
  products,
  rows,
  columns,
  stockByProduct,
  priceOverride,
  priceLabel,
  disabled,
  viewportRef,
  onAdd,
}: ProductCatalogProps) {
  return (
    <div ref={viewportRef} className="min-h-0 flex-1">
      <div
        className="grid h-full gap-3"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            availableStock={stockByProduct?.get(product.id)}
            priceOverride={priceOverride?.(product)}
            priceLabel={priceLabel}
            disabled={disabled}
            onAdd={onAdd}
          />
        ))}
        {products.length === 0 && (
          <div className="text-muted-foreground col-span-full row-span-full flex items-center justify-center rounded-lg border border-dashed text-center text-sm">
            No se encontraron productos.
          </div>
        )}
      </div>
    </div>
  );
}
