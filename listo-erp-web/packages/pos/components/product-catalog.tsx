import type { Product } from "@/packages/product/types";
import type { RefObject } from "react";
import { ProductCard } from "./product-card";

interface ProductCatalogProps {
  products: Product[];
  rows: number;
  stockByProduct: Map<number, number>;
  disabled: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
  onAdd: (product: Product) => void;
}

export function ProductCatalog({ products, rows, stockByProduct, disabled, viewportRef, onAdd }: ProductCatalogProps) {
  return (
    <div ref={viewportRef} className="min-h-0 flex-1">
      <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} availableStock={stockByProduct.get(product.id) ?? 0} disabled={disabled} onAdd={onAdd} />
        ))}
        {products.length === 0 && <div className="text-muted-foreground col-span-full row-span-full flex items-center justify-center rounded-lg border border-dashed text-center text-sm">No se encontraron productos.</div>}
      </div>
    </div>
  );
}
