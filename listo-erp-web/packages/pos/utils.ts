import type { Product } from "@/packages/product/types";

export const formatAmount = (amount: number) =>
  new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

export const getTaxRate = (product: Product) => {
  const rate = Number(product.taxRate ?? 0);
  return rate > 1 ? rate / 100 : rate;
};
