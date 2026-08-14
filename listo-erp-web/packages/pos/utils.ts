import type { Product } from "@/packages/product/types";

export const getTaxRate = (product: Product) => {
  const rate = Number(product.taxRate ?? 0);
  return rate > 1 ? rate / 100 : rate;
};
