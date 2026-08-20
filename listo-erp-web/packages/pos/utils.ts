import type { Product } from "@/packages/product/types";

export const getTaxRate = (product: Product) => {
  if (product.isExempt) return 0;
  const rate = Number(product.tax?.rate ?? 0);
  return rate > 1 ? rate / 100 : rate;
};
