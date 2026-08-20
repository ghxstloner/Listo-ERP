"use client";

import { PageLoading } from "@/components/page-loading";
import { useTranslation } from "@/hooks/use-translation";
import { decodeId } from "@/lib/hash-id";
import { usePageTitle } from "@/lib/page-title-context";
import { EditProductPage } from "@/packages/product/components/edit-product-page";
import type { Product, ProductType } from "@/packages/product/types";
import { Spinner } from "@phosphor-icons/react";
import { useApiQuery } from "@config";
import { use, useEffect } from "react";

export default function ProductDetailRoute({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  return <ProductDetailPage productId={productId} productType="PRODUCT" />;
}

export function ProductDetailPage({
  productId: encodedProductId,
  productType = "PRODUCT",
}: {
  productId: string;
  productType?: ProductType;
}) {
  const { setTitle } = usePageTitle();
  const t = useTranslation();
  const id = decodeId(encodedProductId);
  const [product, loading, error] = useApiQuery<Product>(
    ["products", id ?? "invalid", productType],
    `products/${id ?? 0}`,
    undefined,
    { enabled: id !== null },
  );

  useEffect(() => {
    if (product?.name) setTitle(product.name);
  }, [product?.name, setTitle]);

  if (loading || id === null)
    return <PageLoading text={t("common.loading")} icon={<Spinner size={32} />} spin />;

  if (error || !product || product.productType !== productType)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}:{" "}
          {(error as Error)?.message || t("inventory.products.notFound")}
        </p>
      </div>
    );

  return (
    <EditProductPage 
      product={product} 
      productId={id} 
      productType={productType} 
    />
  );
}
